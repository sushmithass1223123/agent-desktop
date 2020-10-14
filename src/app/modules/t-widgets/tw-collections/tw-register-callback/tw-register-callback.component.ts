import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ReqCampaignContact, ResCampaign, ResData } from 'app/interfaces';
import { AppUiService } from 'app/services/app-ui.service';
import * as moment from 'moment';
import { SDKClient, IUIEvent, CCLDataEvent, TextChatRemoteUserConnectedEvent } from 'tmac-sdk';
import { join } from 'lodash';
import { get } from 'lodash';

/**
 * Register Callback Widget component
 */
@Component({
    selector: 'tw-register-callback',
    templateUrl: './tw-register-callback.component.html',
    styleUrls: ['./tw-register-callback.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwRegisterCallbackComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Add contact form group
     */
    @ViewChild('addContactForm') addContactFormDialog: TemplateRef<any>;

    /**
     * Data Config
     */
    dataConfig: {
        /**
         * Get campaigns list
         */
        GetCampaignsUrl: string;
        /**
         * Create Contact campaign Url
         */
        CreateContactCampaignUrl: string;
    };

    /**
     * Seleced Campaign
     */
    selectedCampaign: ResCampaign;

    /**
     * Get Campaign Stateful Request
     */
    getCampaignsReq: ResData<ResCampaign[]> = {
        data: [],
        error: false,
        loading: true,
        msg: ''
    };

    /**
     * Add campaign stateful request
     */
    addCampaingReq: ResData<null> = {
        error: false,
        loading: false,
        msg: ''
    };

    /**
     * Minimum Date for Callback
     */
    minDate = new Date();

    /**
     * Add contact form group
     */
    addContactFormGroup = new FormGroup({
        Name: new FormControl('', [Validators.required]),
        Phone: new FormControl('', [Validators.required]),
        Date: new FormControl(new Date(), [Validators.required]),
        Time: new FormControl('12:00', [
            Validators.required,
            (control) => {
                if (this.addContactFormGroup && control.value) {
                    const enteredDate = new Date(this.addContactFormGroup.get('Date').value);
                    const today = new Date();
                    const [hours, mins] = control.value.split(':');
                    if (
                        enteredDate.getDate() === today.getDate() &&
                        enteredDate.getMonth() === today.getMonth() &&
                        enteredDate.getFullYear() === today.getFullYear()
                    ) {
                        if (hours < today.getHours()) {
                            return { invalid: true };
                        } else if (parseInt(hours, 10) === today.getHours() && parseInt(mins, 10) - 5 < today.getMinutes()) {
                            return { invalid: true };
                        }
                        return {};
                    }
                    return {};
                }
                return { invalid: true };
            }
        ])
    });

    /**
     * Interaction id
     */
    interactionId: number;

    /**
     * Data map
     */
    dataMap: {
        /**
         * Name 
         */
        Name: string;
        /**
         * Phone
         */
        Phone: number;
    };

    /**
     * Data Map values
     * Need more description
     */
    dataMapValues = new Object();

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private matDialog: MatDialog,
        private _appUiService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.dataConfig = this.data.Data;
        this.fetchCampaigns();

        this.interactionId = this.data.InteractionDetails?.InteractionID;
        this.dataMap = this.data.Data?.DataMap || new Object();

        // this.addContactFormGroup.patchValue({});

        // listen to events only if opened in an interaction
        if (this.interactionId) {
            // get the event from event bag to make sure no events are missed
            const eventBag = this._tmacEventService.get(this.interactionId);

            // process the events if any
            eventBag.forEach((evt: IUIEvent) => {
                this[evt.EventName]?.(evt);
            });

            // register to the event 
            SDKClient.events.on('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
            SDKClient.events.on('CCLDataEvent', this.CCLDataEvent);
        }
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.off('CCLDataEvent', this.CCLDataEvent);
    }

    /**
     * TextChatRemoteUserConnectedEvent handler
     * @method TextChatRemoteUserConnectedEvent
     * @param {TextChatRemoteUserConnectedEvent} evt 
     */
    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * CCLDataEvent Handler
     * @method CCLDataEvent
     * @param {CCLDataEvent} evt 
     */
    private CCLDataEvent = (evt: CCLDataEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * Custmer details processed
     * @method processCustomerDetails
     * @param {IUIEvent} evt 
     */
    private processCustomerDetails = (evt: IUIEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // return if no map found
        if (!this.dataMap || Object.keys(this.dataMap).length === 0) {
            return;
        }

        // check if customer info map is available in this event
        for (const [key, value] of Object.entries(this.dataMap)) {
            // split the value source
            const valueSourceSplit = this.dataMap[key].ValueSource.split('.');
            // check if the value source event name matches with the current event
            if (valueSourceSplit[0] !== evt.EventName) {
                return;
            }
            // remove the event name from the array
            valueSourceSplit.shift();
            // map the property and get the value from event property
            const valueMap = join(valueSourceSplit, '.');

            // assign to the map
            this.dataMapValues[key] = get(evt, valueMap, this.dataMap[key].DefaultValue);
        }
    }

    /**
     * Fetch campaigns 
     * @method fetchCampaigns
     */
    fetchCampaigns(): void {
        if (this.dataConfig.GetCampaignsUrl) {
            this.http.get<ResCampaign[]>(this.dataConfig.GetCampaignsUrl).subscribe(
                (res) => {
                    this.getCampaignsReq = {
                        data: res,
                        error: false,
                        loading: false,
                        msg: ''
                    };
                },
                () => {
                    this.getCampaignsReq = {
                        error: true,
                        loading: false,
                        msg: COMMON_ERR_MESSAGE
                    };
                }
            );
        } else {
            this.getCampaignsReq = {
                error: true,
                loading: false,
                msg: 'GetCampaignsUrl not found'
            };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Add new Contact
     * @method addNewContact
     */
    addNewContact(): void {
        if (this.addContactFormGroup.invalid) {
            return;
        }

        const contact = this.addContactFormGroup.value;

        let directAgentScheduleTime: any = new Date(contact.Date);
        directAgentScheduleTime.setHours(contact.Time.split(':')[0]);
        directAgentScheduleTime.setMinutes(contact.Time.split(':')[1]);
        directAgentScheduleTime.setSeconds(0);
        directAgentScheduleTime = moment(directAgentScheduleTime).format('YYYYMMDDHHmmss');

        const { agentId } = SDKClient.getAgentData();

        this.addCampaingReq = {
            error: false,
            loading: true,
            msg: ''
        };

        const reqPacket: ReqCampaignContact = {
            campaignId: this.selectedCampaign.id,
            campaignName: this.selectedCampaign.campaignName,
            channel: this.selectedCampaign.channel,
            directAgent: agentId,
            directAgentScheduleTime,
            dnd: false,
            dynamicValues: '',
            email: this.selectedCampaign.emailAccountId,
            name: contact.Name,
            phoneNumber: contact.Phone,
            retryCount: this.selectedCampaign.retryCount
        };
        this.http.post(this.dataConfig.CreateContactCampaignUrl, reqPacket).subscribe(
            () => {
                this.addCampaingReq = {
                    error: false,
                    loading: false,
                    msg: ''
                };
                this.matDialog.closeAll();
                this._appUiService.showSnackbar('Added contact successfully', 'success');
                this.addContactFormGroup.reset();
                // check if the AOT widget
                if (this.data.Config.AOT) {
                    this._aotWidgetService.destroyWidget(this.data.ID);
                }
            },
            () => {
                this.addCampaingReq = {
                    error: true,
                    loading: false,
                    msg: COMMON_ERR_MESSAGE
                };
                this._appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
            }
        );
    }

    /**
     * 
     * Toggle Callback Form display
     * @param {ResCampaign} campaign
     */
    toggleForm(campaign: ResCampaign): void {
        if (this.matDialog.openDialogs.length) {
            this.matDialog.closeAll();
        } else {
            this.selectedCampaign = campaign;

            // patch the values if avaialable
            if (this.dataMapValues && Object.keys(this.dataMapValues).length > 0) {
                this.addContactFormGroup.patchValue(this.dataMapValues);
            }

            this.matDialog
                .open(this.addContactFormDialog, {
                    data: campaign,
                    width: '20%',
                    panelClass: 'new-campaign-contact',
                    disableClose: true
                });
        }
    }
}

// for more info visit - https://angular.io/api/core
