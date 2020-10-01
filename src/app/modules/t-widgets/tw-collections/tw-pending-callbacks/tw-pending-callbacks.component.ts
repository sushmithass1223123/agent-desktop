import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ResData } from 'app/interfaces';
import * as moment from 'moment';
import { takeUntil } from 'rxjs/operators';

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
     * --------------------------------------------------
     *  @ [OPTIONAL] to store the fuse config for theme
     * --------------------------------------------------
     */
    fuseConfig: FuseConfig;

    /**
     * --------------------------------------------------
     *  @ [OPTIONAL] to store entire app config and get update
     * --------------------------------------------------
     */
    appConfig: any;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        private http: HttpClient,
        private appUiService: AppUiService
    ) {
        super();
        this.pendingCallbacksTable = {
            source: new MatTableDataSource([]),
            columns: ['ScheduleTime', 'Name', 'Status', 'Actions']
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
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });
        this.phone = this.data.InteractionDetails.PhoneNumber;
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
            if (!this.data.Data.GetPendingCallbacksUrl) {
                this.getPendingCallbacksReq = { loading: false, error: true, msg: 'Missing GetPendingCallbacksUrl in config', data: false };
                return;
            }
            const url = new URL(this.data.Data.GetPendingCallbacksUrl);
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
            this.changeContactStatusReq = { loading: true, error: false, data: callback.Id };
            this.http
                .post(this.data.Data.ChangeContactStatusUrl, {
                    campaignId: callback.CampId,
                    contactIds: [callback.Id],
                    contactStatus: 'Completed',
                    agentStatus: 'Closed',
                    reason: 'Closed',
                    comment: ''
                })
                .subscribe(
                    (res: any) => {
                        if (res.resultCode) {
                            this.changeContactStatusReq = { loading: false, error: false };
                            this.pendingCallbacksTable.source.data = this.pendingCallbacksTable.source.data.filter((x) => x.Id !== callback.Id);
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
