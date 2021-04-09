import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ResData } from 'app/interfaces';
import * as moment from 'moment';

/**
 * Pending Callbacks widget
 */
@Component({
    selector: 'tw-pending-callbacks', // make sure you set the selector starts with tw-<widget-name>
    templateUrl: './tw-pending-callbacks.component.html',
    styleUrls: ['./tw-pending-callbacks.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwPendingCallbacksComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Phone nuber to be entered by user if not found in the Event data
     */
    phone: number;

    /**
     * Get pending callbacks stateful req
     */
    getPendingCallbacksReq: ResData<any> = {
        loading: false,
        error: false
    };

    /**
     * Change Cotact status request
     */
    changeContactStatusReq: ResData<any> = {
        loading: false,
        error: false
    };

    /**
     * Pending callbacks data
     */
    pendingCallbacksTable: {
        /**
         * Source of Mat table
         */
        source: MatTableDataSource<any>;
        /**
         * Allowed Mat table columns
         */
        columns: string[];
    };

    /**
     * TCM proxy Url
     */
    tcmProxyUrl: string;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     * @param {http} HttpClient
     * @param {appUiService} AppUiService
     */
    constructor(
        private http: HttpClient,
        private appUiService: AppUiService
    ) {
        super();
        this.pendingCallbacksTable = {
            source: new MatTableDataSource([]),
            columns: ['CampaignName', 'CampaignType', 'ScheduleTime', 'Name', 'Status', 'Actions']
        };
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
        if (!this.tcmProxyUrl) {
            this.getPendingCallbacksReq = { loading: false, error: true, msg: 'Missing TCMProxy in config', data: false };
            return;
        }

        // assign the phone number
        this.phone = this.data.InteractionDetails?.PhoneNumber;
        if (this.phone) {
            this.getPendingCallbacks();
        }
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all callbacks
     */
    async getPendingCallbacks(): Promise<void> {
        try {
            const url = new URL(`${this.tcmProxyUrl}/api/Contact/GetContactsByPhoneNumber`);
            url.searchParams.append('phone', this.phone.toString());
            this.getPendingCallbacksReq = { loading: true, error: false };
            this.http.get(url.toString()).subscribe(
                (res: any) => {
                    this.pendingCallbacksTable.source.data = res.map((x: any) => ({
                        ...x,
                        ScheduleTime: moment(x.ScheduleTime, 'YYYYMMDDHHmmss').format('DD-MM-YYYY hh:mm:ss A')
                    }));
                    this.getPendingCallbacksReq = { loading: false, error: false, data: true };
                },
                (err) => {
                    console.error({ err });
                    this.getPendingCallbacksReq = { loading: false, error: true, msg: COMMON_ERR_MESSAGE, data: false };
                }
            );
        } catch (err) {
            console.error({ err });
            this.getPendingCallbacksReq = { loading: false, error: true, msg: COMMON_ERR_MESSAGE, data: false };
        }
    }

    /**
     * Close Callback
     * @param callback
     */
    async closeCallback(callback: any): Promise<void> {
        try {
            // const { agentStatus } = SDKClient.getAgentData();
            this.changeContactStatusReq = { loading: true, error: false, data: callback.id };
            this.http
                .post(`${this.tcmProxyUrl}/api/Contact/ChangeContactStatus`, {
                    campaignId: callback.campaignId,
                    contactIds: [callback.id],
                    contactStatus: 'Completed',
                    agentStatus: 'Closed',
                    reason: 'Closed',
                    comment: ''
                })
                .subscribe(
                    (res: any) => {
                        if (res.resultCode) {
                            this.changeContactStatusReq = { loading: false, error: false };
                            this.pendingCallbacksTable.source.data = this.pendingCallbacksTable.source.data.filter((x) => x.Id !== callback.id);
                        } else {
                            this.changeContactStatusReq = { loading: false, error: false };
                        }
                    },
                    (err) => {
                        console.error({ err });
                        this.changeContactStatusReq = { loading: false, error: true, msg: COMMON_ERR_MESSAGE };
                        this.appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
                    }
                );
        } catch (err) {
            console.error({ err });
            this.changeContactStatusReq = { loading: false, error: true, msg: COMMON_ERR_MESSAGE };
            this.appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
        }
    }
}

// for more info visit - https://angular.io/api/core
