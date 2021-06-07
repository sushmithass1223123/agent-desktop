import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { GenericInteractionEvent, IAgentData, IncomingCallEvent, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { IAppConfig, IMaskData, IWidget } from 'app/interfaces';
import { getValueFromJson, maskDataLocal } from 'app/utils';
import { firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
    @Input() data: IWidget<IncomingCallEvent | GenericInteractionEvent, WidgetData>;

    /**
     * To store entire app config and get update
     */
    appConfig: IAppConfig;

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

    constructor(private _appDataService: AppDataService, private _appUIService: AppUiService, private _tmacEventService: TMACEventService) {
        super();
    }

    /**
     * On Init
     */
    async ngOnInit(): Promise<void> {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.user = SDKClient.getAgentData();

        // get interaction id
        this.interaction = this.data.InteractionDetails;

        // get the customer info config
        this.customerInfo = this.data.Data.CustomerInfo ?? [];

        // check if its an interaction
        if (this.interaction) {
            // create event names to subscribe
            const eventNames = [];

            this.customerInfo.forEach((c) => {
                try {
                    // get the event name
                    const eventName = c.ValueSource?.split('.')?.shift();
                    // push to eventNames
                    if (eventName && !eventNames.includes(eventName)) {
                        eventNames.push(eventName);
                    }
                } catch (error) {
                    TUtils.Logger.console('error', 'Error in TwCustomerDetailsComponent', null, error);
                }
            });

            // register to tmac events
            this._tmacEventService
                .getInteractionEvents(eventNames, this.interaction.InteractionID)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) =>
                    evts.forEach((evt) => {
                        this.processCustomerDetails(evt);
                    })
                );
        }

        // get TCM client web service url from config
        const appConfig = await firstValueFrom(
            this._appDataService.getConfig({ tcmUrl: 'Main.Urls.TCMClient' }).pipe(takeUntil(this.unsubscribeAll))
        );

        // get the url
        this.tcmClientUrl = appConfig?.tcmUrl;

        // check if we got the url
        if (!this.tcmClientUrl) {
            TUtils.Logger.warn('TwCampaignContactComponent: Unable to fetch TCM client url, please check the config!');
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

        this.processCustomerDetails({
            EventName: 'ContactData',
            ...this.contactData.data
        });
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * IUIEvent Handelr
     * @param {Any} data
     */
    private processCustomerDetails = (evt: any) => {
        // check if customer info map is available in this event
        this.customerInfo.forEach((item: CustomerInfo) => {
            // check if value is added, then ignore
            if (item.Value) {
                return;
            }
            // get the value source
            const valueSource = item.ValueSource;
            let valueSourceSplit = [];
            // check if we need to parse the json
            if (valueSource.toLowerCase().includes('jsonparse')) {
                // expected value = jsonparse(EventName.{...path}).getValue
                // get the path by taking string between ()
                const path = valueSource.substring(valueSource.lastIndexOf('(') + 1, valueSource.lastIndexOf(')'));

                if (path) {
                    // split the value source
                    valueSourceSplit = path.split('.');
                    // check if the value source event name matches with the current event
                    if (valueSourceSplit[0] !== evt.EventName) {
                        return;
                    }

                    // get the value from path
                    const jsonStr = getValueFromJson(valueSourceSplit, evt, '');

                    if (jsonStr) {
                        // get the property by taking string between ) and last
                        const prop = valueSource.substring(valueSource.lastIndexOf(')') + 2, valueSource.length);

                        item.Value = maskDataLocal(JSON.parse(jsonStr)[prop] ?? '', item.MaskData);
                    }
                }
            } else {
                valueSourceSplit = item.ValueSource.split('.');
                // check if the value source event name matches with the current event
                if (valueSourceSplit[0] !== evt.EventName) {
                    return;
                }

                // get the value from path or default value
                item.Value = maskDataLocal(getValueFromJson(valueSourceSplit, evt, item.DefaultValue), item.MaskData);
            }
        });
    };

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
        return await TUtils.HttpClient.sendRequest<IResponse>({
            urls: [this.tcmClientUrl + method],
            requestArgs,
            header: {
                'Content-Type': 'application/json'
            },
            responseType: 'json',
            method: 'POST',
            log: true
        });
    }

    /**
     * To confirm make call
     */
    confirmMakeCall(btn: MatButton): void {
        btn.disabled = true;
        this.dialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Make Call', `Are you sure to make call to ${this.phoneNumber}`);
        this.dialogRef.afterClosed().subscribe((res) => {
            if (res) {
                // send end chat to server
                this.makeCallToCustomer(btn);
            } else {
                btn.disabled = false;
            }
        });
    }

    /**
     * To make call to customer
     */
    makeCallToCustomer(btn: MatButton): void {
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
                    btn.disabled = false;
                }
            })
            .catch((err) => {
                this._appUIService.showSnackbar('Make call error', 'failure');
                TUtils.Logger.error('Error in TwCampaignContactComponent.makeCallToCustomer', err);
                btn.disabled = false;
            });
    }
}

interface WidgetData {
    /**
     * Customer info config
     */
    CustomerInfo: CustomerInfo[];
}

/**
 * Customer info Model
 */
interface CustomerInfo {
    /**
     * Title
     */
    Title: string;
    /**
     * Value Source
     */
    ValueSource: string;
    /**
     * Value
     */
    Value?: string;
    /**
     * Default Value
     */
    DefaultValue: string;
    /**
     * Width of column
     */
    Width?: string;
    /**
     * To mask value
     */
    MaskData?: IMaskData | boolean;
}
