import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AotWidgetService } from '@services/aot-widget.service';
import { InteractionEventService } from '@services/interaction-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ReqCampaignContact, ResCampaign, ResData } from 'app/interfaces';
import { AppUiService } from 'app/services/app-ui.service';
import * as moment from 'moment';
import { SDKClient, IUIEvent, CCLDataEvent, TextChatRemoteUserConnectedEvent } from 'tmac-sdk';
import { join } from 'lodash';
import * as _ from 'lodash';
import { O } from '@angular/cdk/keycodes';

@Component({
    selector: 'tw-register-callback',
    templateUrl: './tw-register-callback.component.html',
    styleUrls: ['./tw-register-callback.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwRegisterCallbackComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    @ViewChild('addContactForm') addContactFormDialog: TemplateRef<any>;

    dataConfig: {
        GetCampaignsUrl: string;
        CreateContactCampaignUrl: string;
    };

    selectedCampaign: ResCampaign;

    getCampaignsReq: ResData<ResCampaign[]> = {
        data: [],
        error: false,
        loading: true,
        msg: ''
    };

    addCampaingReq: ResData<null> = {
        error: false,
        loading: false,
        msg: ''
    };

    addContactFormGroup = new FormGroup({
        Name: new FormControl('', [Validators.required]),
        Phone: new FormControl('', [Validators.required]),
        Date: new FormControl(new Date(), [Validators.required]),
        Time: new FormControl('12:00', [Validators.required])
    });

    interactionId: number;
    dataMap: {
        Name: string;
        Phone: number;
    };
    dataMapValues = new Object();

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private matDialog: MatDialog,
        private appUiService: AppUiService,
        private _aotWidgetService: AotWidgetService,
        private _interactionEventService: InteractionEventService
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
            const eventBag = this._interactionEventService.get(this.interactionId);

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

    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        this.processCustomerDetails(evt);
    }

    private CCLDataEvent = (evt: CCLDataEvent) => {
        this.processCustomerDetails(evt);
    }

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
            this.dataMapValues[key] = _.get(evt, valueMap, this.dataMap[key].DefaultValue);
        }
    }

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

    addNewContact(): void {
        if (this.addContactFormGroup.invalid) {
            return;
        }

        const contact = this.addContactFormGroup.value;
        this.addCampaingReq = {
            error: false,
            loading: true,
            msg: ''
        };

        let directAgentScheduleTime: any = new Date(contact.Date);
        directAgentScheduleTime.setHours(contact.Time.split(':')[0]);
        directAgentScheduleTime.setMinutes(contact.Time.split(':')[1]);
        directAgentScheduleTime.setSeconds(0);
        directAgentScheduleTime = moment(directAgentScheduleTime).format('YYYYMMDDHHmmss');

        const { agentId } = SDKClient.getAgentData();

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
                this.appUiService.showSnackbar('Added contact successfully', 'success');
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
                this.appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
            }
        );
    }

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
