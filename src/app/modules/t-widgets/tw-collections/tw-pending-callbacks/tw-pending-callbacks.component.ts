import { TwPendingCallbacks, TwPendingCallbacksData } from '@ad/types';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ResData } from 'app/interfaces';
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
    @Input() data: TwPendingCallbacks<any>;

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
     * Data Config
     */
    dataConfig: TwPendingCallbacksData;

    /**
     * Constructor
     * @param {http} HttpClient
     * @param {appUiService} AppUiService
     */
    constructor(private http: HttpClient, private appUiService: AppUiService) {
        super('TwPendingCallbacksComponent');
        this.pendingCallbacksTable = {
            source: new MatTableDataSource([]),
            columns: ['CampaignName', 'CampaignType', 'ScheduleTime', 'Name', 'Status', 'Actions']
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.dataConfig = this.data.Data;

        const url = this.dataConfig.TCMProxyUrl;

        if (!url) {
            this.getPendingCallbacksReq = { loading: false, error: true, msg: 'Missing TCMProxy in config', data: false };
            return;
        }

        this.dataConfig.TCMProxyUrl = url.endsWith('/') ? url : url + '/';

        // assign the phone number
        this.phone = this.data.InteractionDetails?.PhoneNumber;
        if (this.phone) {
            this.getPendingCallbacks();
        }
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Get all callbacks
     */
    async getPendingCallbacks(): Promise<void> {
        try {
            const url = new URL(`${this.dataConfig.TCMProxyUrl}/Contact/GetContactsByPhoneNumber`);
            url.searchParams.append('phone', this.phone.toString());
            this.getPendingCallbacksReq = { loading: true, error: false };
            this.http.get(url.toString()).subscribe({
                next: (res: any) => {
                    this.pendingCallbacksTable.source.data = res.map((x: any) => ({
                        ...x,
                        ScheduleTime: moment(x.ScheduleTime, 'YYYYMMDDHHmmss').format('DD-MM-YYYY hh:mm:ss A')
                    }));
                    this.getPendingCallbacksReq = { loading: false, error: false, data: true };
                },
                error: (err) => {
                    console.error({ err });
                    this.getPendingCallbacksReq = { loading: false, error: true, msg: 'Unable to fetch pending callbacks', data: false };
                }
            });
        } catch (err) {
            console.error({ err });
            this.getPendingCallbacksReq = { loading: false, error: true, msg: 'Unable to fetch pending callbacks', data: false };
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
                .post(`${this.dataConfig.TCMProxyUrl}/api/Contact/ChangeContactStatus`, {
                    campaignId: callback.campaignId,
                    contactIds: [callback.id],
                    contactStatus: 'Completed',
                    agentStatus: 'Closed',
                    reason: 'Closed',
                    comment: ''
                })
                .subscribe({
                    next: (res: any) => {
                        if (res.resultCode) {
                            this.changeContactStatusReq = { loading: false, error: false };
                            this.pendingCallbacksTable.source.data = this.pendingCallbacksTable.source.data.filter((x) => x.Id !== callback.id);
                        } else {
                            this.changeContactStatusReq = { loading: false, error: false };
                        }
                    },
                    error: (err) => {
                        console.error({ err });
                        this.changeContactStatusReq = { loading: false, error: true, msg: 'Unable to close callback' };
                        this.appUiService.showSnackbar('Unable to close callback', 'failure');
                    }
                });
        } catch (err) {
            console.error({ err });
            this.changeContactStatusReq = { loading: false, error: true, msg: 'Unable to close callback' };
            this.appUiService.showSnackbar('Unable to close callback', 'failure');
        }
    }
}

// for more info visit - https://angular.io/api/core
