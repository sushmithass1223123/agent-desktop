import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { fuseAnimations } from '@fuse/animations';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import { IUIEvent, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget, ReqCampaignContact, ResCampaign, ResData } from 'app/interfaces';
import { AppUiService } from 'app/services/app-ui.service';
import { throwADError } from 'app/utils';
import { extractJsonVal } from '@tmac/operators';
import { uniq } from 'lodash';
import moment from 'moment';
import { takeUntil } from 'rxjs/operators';
import { TwRegisterCallback } from '@ad/types';
import { TranslocoService } from '@ngneat/transloco';

/**
 * Register Callback Widget component
 */
@Component({
    selector: 'tw-register-callback',
    templateUrl: './tw-register-callback.component.html',
    styleUrls: ['./tw-register-callback.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
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
     * TCM Proxy Url
     */
    tcmProxyUrl: string;

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
        filteredData: [],
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
    addContactFormGroup = new UntypedFormGroup({
        Name: new UntypedFormControl('', [Validators.required]),
        Phone: new UntypedFormControl('', [Validators.required]),
        Date: new UntypedFormControl(new Date(), [Validators.required]),
        Time: new UntypedFormControl('12:00', [
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
        Name: {
            /**
             * Value source
             */
            ValueSource: string;
            /**
             * Default value
             */
            DefaultValue: string;
        };
        /**
         * Phone
         */
        Phone: {
            /**
             * Value source
             */
            ValueSource: string;
            /**
             * Default value
             */
            DefaultValue: string;
        };
    };

    /**
     * Data Map values
     * Need more description
     */
    dataMapValues = new Object();

    /**
     * To seach campaing
     */
    searchTerm: string;

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private matDialog: MatDialog,
        private _appUiService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private translocoService: TranslocoService
    ) {
        super('TwRegisterCallbackComponent');
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
        // assign the proxy url
        const url = this.data.Data.TCMProxyUrl;
        this.tcmProxyUrl = url.endsWith('/') ? url : url + '/';
        this.fetchCampaigns();

        this.interactionId = this.data.InteractionDetails?.InteractionID;
        this.dataMap = this.data.Data?.DataMap || new Object();

        try {
            // create event names to subscribe
            const eventNames: any = uniq(Object.entries(this.dataMap).map((a) => a[1].ValueSource?.split('.')?.shift() ?? []));
            // listen to events only if opened in an interaction
            if (this.interactionId && eventNames.length) {
                this._tmacEventService
                    .getInteractionEvents(eventNames, this.interactionId)
                    .pipe(takeUntil(this.unsubscribeAll))
                    .subscribe((evts) => evts.forEach((evt) => this.processCustomerDetails(evt)));
            }
        } catch (error) {
            throwADError('Error in TwRegisterCallbackComponent', error);
        }
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Custmer details processed
     * @method processCustomerDetails
     * @param {IUIEvent} evt
     */
    private processCustomerDetails = (evt: IUIEvent) => {
        // return if no map found
        if (!this.dataMap || Object.keys(this.dataMap).length === 0) {
            return;
        }

        try {
            // check if customer info map is available in this event
            for (const [key, value] of Object.entries(this.dataMap)) {
                this.dataMapValues[key] = extractJsonVal({ [evt.EventName]: evt }, this.dataMap[key].ValueSource) || this.dataMap[key].DefaultValue;
            }
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Fetch campaigns
     * @method fetchCampaigns
     */
    fetchCampaigns(): void {
        if (this.tcmProxyUrl) {
            this.http.get<ResCampaign[]>(`${this.tcmProxyUrl}Campaign/Getcampaigns`).subscribe(
                (res) => {
                    this.getCampaignsReq = {
                        data: res,
                        filteredData: res,
                        error: false,
                        loading: false,
                        msg: ''
                    };
                },
                () => {
                    this.getCampaignsReq = {
                        error: true,
                        loading: false,
                        msg: this.translocoService.translate('widgets.registerCallback.fetchCampaignFailed')
                    };
                }
            );
        } else {
            this.getCampaignsReq = {
                error: true,
                loading: false,
                msg: this.translocoService.translate('widgets.registerCallback.tcmProxyUrlNotFound')
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
        if (this.tcmProxyUrl) {
            this.http.post(`${this.tcmProxyUrl}Contact/CreateCampaignContact`, reqPacket).subscribe(
                () => {
                    this.addCampaingReq = {
                        error: false,
                        loading: false,
                        msg: ''
                    };
                    this.matDialog.closeAll();
                    this._appUiService.showSnackbar(this.translocoService.translate('widgets.registerCallback.addContactSuccess'), 'success');
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
                        msg: this.translocoService.translate('widgets.registerCallback.addContactFailed')
                    };
                    this._appUiService.showSnackbar(this.translocoService.translate('widgets.registerCallback.addContactFailed'), 'failure');
                }
            );
        } else {
            this.getCampaignsReq = {
                error: true,
                loading: false,
                msg: this.translocoService.translate('widgets.registerCallback.tcmProxyUrlNotFound')
            };
        }
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

            this.matDialog.open(this.addContactFormDialog, {
                data: campaign,
                width: '20%',
                panelClass: 'new-campaign-contact',
                disableClose: true
            });
        }
    }

    /**
     * To filter campaigns
     */
    filterCampaigns(): void {
        const searchTerm = this.searchTerm.toLowerCase();
        // Search
        if (searchTerm === '') {
            this.getCampaignsReq.filteredData = this.getCampaignsReq.data;
        } else {
            this.getCampaignsReq.filteredData = this.getCampaignsReq.data.filter((item) => {
                return item.campaignName.toLowerCase().includes(searchTerm);
            });
        }
    }
}

// for more info visit - https://angular.io/api/core
