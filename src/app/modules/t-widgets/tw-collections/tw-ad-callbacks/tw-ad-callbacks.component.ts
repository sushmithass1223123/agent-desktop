import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ACTIVE_CALL_STATUSES, COMMON_ERR_MESSAGE, PENDING_CALL_STATUSES } from 'app/constants';
import { CustomSDKEvent, ResData } from 'app/interfaces';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

/**
 * Agent Callbacks Widget
 */
@Component({
    selector: 'tw-ad-callbacks',
    templateUrl: './tw-ad-callbacks.component.html',
    styleUrls: ['./tw-ad-callbacks.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdCallbacksComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: any;
    /**
     * Data Config
     */
    dataConfig: {
        /**
         * Get Callbacks Url
         */
        GetCallbacksUrl: string;
    };

    /**
     * Get Dashboard data res
     */
    getDashboardDataRes: ResData<{
        /**
         * Callbacks list
         */
        callbacks: any[];
        /**
         * Handled callbacks
         */
        handled: number;
        /**
         * Missed Callbacks
         */
        missed: number;
        /**
         * Pending Callbacks
         */
        pending: number
    }> = {
            error: false,
            loading: true,
            msg: '',
            data: {
                callbacks: [],
                handled: 0,
                missed: 0,
                pending: 0
            }
        };

    /**
     * Maximized state
     */
    maximized = false;

    /**
     * Constructor 
     */
    constructor(
        private _http: HttpClient,
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
        const { agentId } = SDKClient.getAgentData();
        this._http.get(`${this.dataConfig.GetCallbacksUrl}?agentId=${agentId}`).subscribe(this.addNewCallbacks, () => {
            this.getDashboardDataRes = {
                error: true,
                loading: false,
                msg: COMMON_ERR_MESSAGE
            };
        });

        // SDKClient.events.on('CallbackDataReceivedForAgent', this.CallbackDataReceivedForAgent);

        this._tmacEventService.getEvents(['CallbackDataReceivedForAgent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(this.CallbackDataReceivedForAgent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // SDKClient.events.off('CallbackDataReceivedForAgent', this.CallbackDataReceivedForAgent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * CallbackDataReceivedForAgent Handler
     * @method CallbackDataReceivedForAgent
     * @param {CustomSDKEvent} evt 
     */
    CallbackDataReceivedForAgent = (evt: CustomSDKEvent) => {
        const callback = JSON.parse(evt.Data);
        callback.contact.status = callback.contact.Status;
        callback.contact.name = callback.contact.Name;
        callback.contact.directAgentScheduleTime = callback.contact.ScheduleTime;
        this.addNewCallbacks([callback]);
    }

    /**
     * Add Callbacks
     * @method addNewCallbacks 
     * @param {any[]} calls 
     */
    addNewCallbacks = (calls: any[]): void => {
        let handled = 0;
        let missed = 0;
        let pending = 0;
        let activeCalls = 0;

        const callbacksList = sortBy([...this.getDashboardDataRes.data.callbacks, ...(calls || [])], 'contact.directAgentScheduleTime');
        const callbacksReversed = callbacksList.reverse();
        const callbacks = callbacksReversed.map((x) => {
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
                missed,
                pending
            }
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Maximize Event Handler
     * @method maximizeEvent
     * @param {Boolean} state 
     */
    maximizeEvent(state: boolean): void {
        this.maximized = state;
    }
}

// for more info visit - https://angular.io/api/core
