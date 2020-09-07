import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ResData } from 'app/interfaces';
import { sortBy } from 'lodash';
import { COMMON_ERR_MESSAGE, ACTIVE_CALL_STATUSES, PENDING_CALL_STATUSES } from 'app/constants';
import * as moment from 'moment';

@Component({
    selector: 'tw-ad-callbacks',
    templateUrl: './tw-ad-callbacks.component.html',
    styleUrls: ['./tw-ad-callbacks.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdCallbacksComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;
    dataConfig: {
        GetCallbacksUrl: string;
    };

    getDashboardDataRes: ResData<{ callbacks: any[]; handled: number; pending: number }> = {
        error: false,
        loading: true,
        msg: '',
        data: {
            callbacks: [],
            handled: 0,
            pending: 0
        }
    };

    sample = Array(20).fill(1);
    maximized = false;
    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
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
        private http: HttpClient
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

        this.dataConfig = this.data.Data;
        const { agentId } = SDKClient.getAgentData();
        this.http.get(`${this.dataConfig.GetCallbacksUrl}?agentId=${agentId}`).subscribe(this.addNewCallbacks, () => {
            this.getDashboardDataRes = {
                error: true,
                loading: false,
                msg: COMMON_ERR_MESSAGE
            };
        });
        SDKClient.events.on('CallbackDataReceivedForAgent', this.CallbackDataReceivedForAgent);
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

    CallbackDataReceivedForAgent = (evt: any) => {
        const callback = JSON.parse(evt);
        callback.contact.status = callback.contact.Status;
        callback.contact.name = callback.contact.Name;
        callback.contact.directAgentScheduleTime = callback.contact.ScheduleTime;
        this.addNewCallbacks([callback]);
    };

    addNewCallbacks = (calls: any[]): void => {
        let handled = 0;
        let missed = 0;
        let pending = 0;
        let activeCalls = 0;

        const callbacks = sortBy([...this.getDashboardDataRes.data.callbacks, ...calls], 'contact.directAgentScheduleTime')
            .reverse()
            .map((x) => {
                if (PENDING_CALL_STATUSES.includes(x.contact.status)) {
                    pending += 1;
                }
                if (ACTIVE_CALL_STATUSES.includes(x.contact.status)) {
                    activeCalls += 1;
                }

                if (parseInt(x.contact.directAgentScheduleTime, 10) < parseInt(moment().format('YYYYMMDDHHmmss'), 10)) {
                    missed += 1;
                }

                return {
                    ...x,
                    contact: {
                        ...x.contact,
                        directAgentScheduleTime: moment(x.contact.directAgentScheduleTime, 'YYYYMMDDHHmmss').format('DD-MM-YYYY hh:mm:ss A')
                    }
                };
            });

        handled = callbacks.length - (pending - (activeCalls > 0 ? 1 : 0));

        this.getDashboardDataRes = {
            error: false,
            loading: false,
            msg: '',
            data: {
                callbacks,
                handled,
                pending
            }
        };
    };

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
    maximizeEvent(state: boolean): void {
        this.maximized = state;
    }
}

// for more info visit - https://angular.io/api/core
