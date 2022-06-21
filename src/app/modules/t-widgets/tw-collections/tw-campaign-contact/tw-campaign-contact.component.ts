import { AppRootConfig, TwCampaignContact, TwCampaignContactData } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { GenericInteractionEvent, IAgentData, IncomingCallEvent, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { CustomerInfo } from 'app/interfaces';
import { processCustomerDetails, throwADError } from 'app/utils';
import { uniq } from 'lodash';
import { take, takeUntil } from 'rxjs/operators';

/**
 * Campaign Contact Component
 */
@Component({
    selector: 'tw-campaign-contact',
    templateUrl: './tw-campaign-contact.component.html',
    styleUrls: ['./tw-campaign-contact.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCampaignContactComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwCampaignContact<IncomingCallEvent | GenericInteractionEvent>;

    /**
     * Widget data
     */
    widgetData: TwCampaignContactData;

    /**
     * To store entire app config and get update
     */
    appConfig: AppRootConfig;

    /**
     * ID of interaction
     */
    interaction: IncomingCallEvent | GenericInteractionEvent;

    /**
     * Campaign contact data
     */
    contactData = {
        data: null,
        loading: true,
        errorMessage: ''
    };

    /**
     * Customer infor t
     */
    customerInfo: CustomerInfo[];

    /**
     * Confirm dialog ref
     */
    dialogRef: MatDialogRef<any, any>;

    /**
     * Customer primary phone number
     */
    phoneNumber: string;

    /**
     * Current agent data
     */
    user: IAgentData;

    /**
     * TCM client url
     */
    tcmClientUrl: string;

    /**
     * Show make call button flag
     */
    showMakeCall: boolean;

    /**
     * Maximized flag
     */
    maximized: boolean;

    /**
     * Campaign status list to update
     */
    statusList: StatusReasonCode[];

    /**
     * Reason list
     */
    reasonList: StatusReasonCode[];

    /**
     * Submit form
     */
    submitForm: FormGroup;

    /**
     * Flag to check whether call is made to customer
     */
    callMadeToCustomer: boolean;

    /**
     * To show progress
     */
    progress: boolean;

    constructor(
        private _appDataService: AppDataService,
        private _appUIService: AppUiService,
        private _tmacEventService: TMACEventService,
        private _formBuilder: FormBuilder
    ) {
        super('TwCampaignContactComponent');
        this.showMakeCall = false;
        this.callMadeToCustomer = false;
    }

    /**
     * On Init
     */
    async ngOnInit(): Promise<void> {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.widgetData = this.data.Data;

        this.user = SDKClient.getAgentData();

        this.submitForm = this._formBuilder.group({
            status: ['', Validators.required],
            reason: [''],
            comment: ['']
        });

        // Set validators for form
        if (this.widgetData.ReasonEnabled) {
            this.submitForm.controls.reason.setValidators(Validators.required);
        }

        // get interaction id
        this.interaction = this.data.InteractionDetails;

        // get the customer info config
        this.customerInfo = this.data.Data.CustomerInfo ?? [];

        // check if its an interaction
        if (this.interaction) {
            try {
                // create event names to subscribe
                const eventNames: any = uniq(this.customerInfo.map((c) => c.ValueSource?.split('.')?.shift()) ?? []);
                const processInfo = processCustomerDetails(this.customerInfo);
                // register to tmac events
                this._tmacEventService
                    .getInteractionEvents(eventNames, this.interaction.InteractionID)
                    .pipe(takeUntil(this.unsubscribeAll))
                    .subscribe((evts) =>
                        evts.forEach((evt) => {
                            processInfo.exec(evt);
                        })
                    );
            } catch (error) {
                throwADError('Error in TwCampaignContactComponent', error);
            }
        }

        // get TCM client web service url from config
        const appConfig = await this._appDataService
            .getConfig({ tcmUrl: 'Main.Urls.TCMClient' })
            .pipe(takeUntil(this.unsubscribeAll), take(1))
            .toPromise();

        // get the url
        this.tcmClientUrl = appConfig?.tcmUrl;

        // check if we got the url
        if (!this.tcmClientUrl) {
            this.logger.warn('Unable to fetch TCM client url, please check the config!');
            return;
        }

        let phone = '';
        let fromAddr = '';
        let ucid = '';
        let skill = '';
        let contactId = '';

        let urlPath = '';

        // check the interaction whether its voice or generic
        if (this.interaction?.EventName === 'IncomingCallEvent') {
            const interaction = this.interaction as IncomingCallEvent;
            if (interaction.SubType.toLowerCase() === 'camp') {
                // get the subtype data
                const subTypeData = typeof interaction.SubTypeData === 'object' ? JSON.parse(interaction.SubTypeData) : interaction.SubTypeData;

                fromAddr = subTypeData.fromAddress ?? subTypeData;
                ucid = interaction.UCID;
                skill = interaction.Queue;
            }
        } else if (this.interaction?.EventName === 'GenericInteractionEvent') {
            const interaction = this.interaction as GenericInteractionEvent;

            phone = this.phoneNumber = interaction.Item.PhoneNumber;
            skill = interaction.Item.Skill;
            contactId = interaction.Item.ID;

            // TODO:: only notify that callback request is assigned if it was assigned the first time and not if the UI is reloaded or re-login
            // if (!this.interaction?.RecoveryEvent) {
            //     // call TCM to notify assigned
            //     this.notifyTcmAssigned(phone, interaction.Item.Type);
            // }

            this.notifyTcmAssigned(phone, interaction.Item.Type);
        }

        let requestArgs = {
            agentID: this.user.agentId,
            extension: this.user.deviceId,
            ucid: ucid,
            skill: skill
        } as any;

        if (contactId) {
            // to get customer contact data by contact id
            urlPath = '/GetCustomerContactDataByContactId';
            requestArgs = {
                ...requestArgs,
                contactId
            };
        } else if (phone) {
            // to get customer contact data by phone number
            urlPath = '/GetCustomerContactDataByPhoneNumber';
            requestArgs = {
                ...requestArgs,
                phone
            };
        } else if (fromAddr && this.interaction?.InteractionID) {
            // to get customer contact data by fromAddr and interaction id
            urlPath = '/GetCustomerContactInteractionData';
            requestArgs = {
                ...requestArgs,
                fromAddr: fromAddr,
                interactionid: this.interaction.InteractionID
            };
        } else if (fromAddr) {
            // to get customer contact data by fromAddr
            urlPath = '/GetCustomerContactData';
            requestArgs = {
                ...requestArgs,
                fromAddr: fromAddr
            };
        }

        const result = await this.restCall(urlPath, requestArgs);

        this.contactData.loading = false;

        // check for valid response from server
        if (!result || !result.response) {
            this._appUIService.showSnackbar('Unable to reach fetch contact information', 'failure');
            this.contactData.errorMessage = 'Unable to reach fetch contact information';
        }

        // store the data
        this.contactData.data = result.response.d ? JSON.parse(result.response.d) : null;

        // emit custom event
        this._tmacEventService.emitSDKEvent({
            event: {
                EventName: 'CustomerContactInfoReceivedEvent',
                InteractionID: this.interaction?.InteractionID ?? '0',
                ...this.contactData.data
            },
            isInteractionEvent: true,
            log: true
        });

        processCustomerDetails(this.customerInfo).exec({
            EventName: 'ContactData',
            ...this.contactData.data
        });

        // get the campaign status list
        const statusResult = await this.restCall('/GetCampaignStatusCodes', {
            campId: this.contactData.data.campaignContact.CampId,
            id: ''
        });

        this.statusList = statusResult.response?.d ?? [];
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To notify TCM about item assignment
     *
     * @param {String }phone
     * @param {String }type
     */
    private async notifyTcmAssigned(phone: string, type: string): Promise<void> {
        try {
            const result = await this.restCall('/OnDacNotificationEvent', {
                fromAddr: phone,
                response: 'assigned',
                agentID: this.user.agentId,
                extension: this.user.deviceId,
                scheduletime: '',
                interactionId: this.interaction?.InteractionID ?? '0'
            });

            // check the response
            if (result.response.d === 1) {
                if (type.toLowerCase() === 'tcmvoicewq') {
                    this.showMakeCall = true;
                }
            } else {
                this._appUIService.showSnackbar('Failed to assign the direct agent item to campaign manager', 'failure');
            }
        } catch (error) {
            this._appUIService.showSnackbar('Error in assigning the direct agent item to campaign manager', 'failure');
        }
    }

    /**
     * To make rest call
     *
     * @param {String} method
     * @param {Any} requestArgs
     */
    private async restCall(method: string, requestArgs: any): Promise<IResponse> {
        try {
            this.progress = true;
            let response: IResponse | PromiseLike<IResponse>;
            try {
                response = await TUtils.HttpClient.sendRequest<IResponse>({
                    urls: [this.tcmClientUrl + method],
                    requestArgs,
                    header: {
                        'Content-Type': 'application/json'
                    },
                    responseType: 'json',
                    method: 'POST',
                    log: true
                });
            } catch (error) {}
            this.progress = false;
            return response;
        } catch (error) {}
        return null;
    }

    /**
     * To confirm make call
     */
    confirmMakeCall(): void {
        this.dialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Make Call', `Are you sure to make call to ${this.phoneNumber}`);
        this.dialogRef.afterClosed().subscribe((res) => {
            if (res) {
                // send end chat to server
                this.makeCallToCustomer();
            }
        });
    }

    /**
     * To make call to customer
     */
    makeCallToCustomer(): void {
        // signal TCM that the callback request has been accepted
        this.restCall('/OnAgentResponseToDacRequest', {
            fromAddr: this.phoneNumber,
            response: 'accept',
            agentID: this.user.agentId,
            extension: this.user.deviceId,
            scheduletime: ''
        });

        // make call to the provided number and complete the reminder
        SDKClient.makeCall({
            interactionId: this.interaction.InteractionID.toString(),
            number: this.phoneNumber,
            source: '',
            sourceId: ''
        })
            .then((dt) => {
                if (dt.response.ResultCode === 0) {
                    this._appUIService.showSnackbar(`Make call to ${this.phoneNumber} successful`);
                } else {
                    this._appUIService.showSnackbar(`Make call failed, ${dt.response.ResultMessage}`, 'failure');
                }
            })
            .catch((err) => {
                this._appUIService.showSnackbar('Make call error', 'failure');
                this.logger.error('Error in makeCallToCustomer', err);
            });
    }

    /**
     * On status change
     *
     * @param {MatSelectChange} data
     */
    async onStatusChange(data: MatSelectChange): Promise<void> {
        this.reasonList = [];

        if (!data.value) {
            return;
        }

        // load reason list by status value
        const statusResult = await this.restCall('/GetCampaignStatusCodeReasons', {
            codeId: data.value,
            id: ''
        });
        this.reasonList = statusResult.response?.d ?? [];
    }

    /**
     * To check for submit button
     *
     * @returns {Boolean}
     */
    checkForSubmit(): boolean {
        try {
            const agentStatus = SDKClient.getAgentData().agentStatus.toLowerCase();
            return (this.showMakeCall ? this.callMadeToCustomer : true) && this.submitForm.valid && !agentStatus.includes('on call');
        } catch (error) {}
        return false;
    }

    /**
     * To submit a callback with status
     */
    submitCallback(btn: MatButton): void {
        this.dialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Submit', `Are you sure to submit`);
        this.dialogRef.afterClosed().subscribe(async (res) => {
            if (res) {
                btn.disabled = true;
                try {
                    const resp = await this.restCall('/UpdateRecordData', {
                        rid: this.contactData.data.recordId,
                        stat: this.submitForm.get('status').value,
                        reason: this.submitForm.get('reason').value ?? '',
                        comment: this.submitForm.get('comment').value ?? ''
                    });

                    if (resp.response?.d?.resultCode === 1) {
                        this._appUIService.showSnackbar('Callback status updated successfully');
                        if (this.interaction) {
                            SDKClient.closeInteraction(this.interaction.InteractionID.toString());
                        }
                    } else {
                        this._appUIService.showSnackbar('Failed to update callback status', 'failure');
                        btn.disabled = false;
                    }
                } catch (error) {
                    this._appUIService.showSnackbar('Error in updating callback status', 'failure');
                    btn.disabled = false;
                }
            }
        });
    }
}

interface WidgetData {
    /**
     * Customer info config
     */
    CustomerInfo: CustomerInfo[];
    /**
     * Reason flag
     */
    ReasonEnabled: boolean;
}

interface StatusReasonCode {
    /**
     * Status
     */
    Status: number;
    /**
     * Text of status code
     */
    Text: string;
    /**
     * Value of status code
     */
    Value: string;
}
