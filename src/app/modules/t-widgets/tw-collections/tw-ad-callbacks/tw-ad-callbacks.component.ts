import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ACTIVE_CALL_STATUSES, COMMON_ERR_MESSAGE, FAILED_CALL_STATUSES, PENDING_CALL_STATUSES } from 'app/constants';
import { CustomSDKEvent, IWidget, ResData } from 'app/interfaces';
import { format, isBefore, isMatch, parse } from 'date-fns';
import { sortBy } from 'lodash';

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
    @Input() data: IWidget;

    /**
     * Data Config
     */
    dataConfig: WidgetData;

    /**
     * Get Dashboard data res
     */
    getDashboardDataRes: ResData<{
        /**
         * Callbacks list
         */
        callbacks: any[];
        /**
         * Complete callbacks list
         */
        complete: any[];
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
        pending: number;
    }> = {
        error: false,
        loading: true,
        msg: '',
        data: {
            callbacks: [],
            complete: [],
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
     * Current filter type
     */
    currentFilter: string;

    /**
     * Constructor
     */
    constructor(private _http: HttpClient, private _tmacEventService: TMACEventService) {
        super();
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

        let url = this.dataConfig.TCMProxyUrl;
        if (!url) {
            this.getDashboardDataRes = {
                error: true,
                loading: false,
                msg: COMMON_ERR_MESSAGE
            };
            return;
        }
        url = url.endsWith('/') ? url : url + '/';

        const { agentId } = SDKClient.getAgentData();

        this._http.get(`${url}/Contact/GetContactSessionByAgent?agentId=${agentId}`).subscribe({
            next: this.addNewCallbacks,
            error: () => {
                this.getDashboardDataRes = {
                    error: true,
                    loading: false,
                    msg: COMMON_ERR_MESSAGE
                };
            }
        });

        // since we get data from api as well as event
        // use 'addTMACEventListener' from _tmacEventService
        // instead of 'getNonInteractionEvents'
        this._tmacEventService.addTMACEventListener([
            {
                label: 'CallbackDataReceivedForAgent',
                callback: this.CallbackDataReceivedForAgent
            }
        ]);
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this._tmacEventService.removeTMACEventListener([
            {
                label: 'CallbackDataReceivedForAgent',
                callback: this.CallbackDataReceivedForAgent
            }
        ]);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * CallbackDataReceivedForAgent Handler
     *
     * @method CallbackDataReceivedForAgent
     * @param {CustomSDKEvent} evt
     */
    CallbackDataReceivedForAgent = (evt: CustomSDKEvent) => {
        const callback = JSON.parse(evt.Data);
        callback.contact.status = callback.contact.Status;
        callback.contact.name = callback.contact.Name;
        callback.contact.directAgentScheduleTime = callback.contact.ScheduleTime;
        this.addNewCallbacks([callback]);
    };

    /**
     * Add Callbacks
     *
     * @method addNewCallbacks
     * @param {any[]} calls
     */
    addNewCallbacks = (calls: any[]): void => {
        let handled = 0;
        let missed = 0;
        let pending = 0;
        let active = 0;

        // add and sort
        const callbacksList = sortBy([...this.getDashboardDataRes.data.complete, ...(calls || [])], 'contact.directAgentScheduleTime');
        const callbacksReversed = callbacksList.reverse();
        const callbacks = callbacksReversed.map((x) => {
            let uiState = 'success';
            const status = x.contact.status;
            let filterStatus = 'handled';
            let scheduleTime = x.contact.scheduledDate ?? x.contact.directAgentScheduleTime;

            // check if the date in 'yyyyMMddHHmmss' format
            if (isMatch(scheduleTime, 'yyyyMMddHHmmss')) {
                // parse the date to yyyyMMddHHmmss and format to 'dd/MM/yyyy hh:mm:ss a'
                const parseDate = parse(scheduleTime, 'yyyyMMddHHmmss', new Date());
                scheduleTime = format(parseDate, 'dd/MM/yyyy hh:mm:ss a');
            }

            // check for pending
            if (PENDING_CALL_STATUSES.includes(status.toLowerCase())) {
                pending += 1;
                uiState = 'warning';
                filterStatus = 'pending';
            }
            // check for active
            if (ACTIVE_CALL_STATUSES.includes(status.toLowerCase())) {
                active += 1;
                uiState = 'success';
            }
            // check for failed
            if (FAILED_CALL_STATUSES.includes(status.toLowerCase())) {
                missed += 1;
                uiState = 'danger';
                filterStatus = 'missed';
            }
            // check for missed
            else if (!uiState && isBefore(parse(scheduleTime, 'dd/MM/yyyy hh:mm:ss a', new Date()), new Date())) {
                missed += 1;
                uiState = 'danger';
                filterStatus = 'missed';
            }

            return {
                ...x,
                contact: {
                    ...x.contact,
                    scheduleTime
                },
                uiState,
                status,
                filterStatus
            };
        });

        handled = callbacks.length - (pending - (active > 0 ? 1 : 0)) - missed;

        this.getDashboardDataRes = {
            error: false,
            loading: false,
            msg: '',
            data: {
                callbacks,
                complete: callbacks,
                handled,
                missed,
                pending
            }
        };

        // if there is a filter, apply
        if (this.currentFilter) {
            this.filterCallbacks('');
        }
    };

    /**
     * To filter callbacks on type
     *
     * @param {String} type
     */
    filterCallbacks(type: string): void {
        let filter = true;

        // check the current filter
        if (this.currentFilter && this.currentFilter === type) {
            filter = false;
        }

        if (!type) {
            type = this.currentFilter;
        }

        // to filter
        if (filter) {
            this.getDashboardDataRes.data.callbacks = this.getDashboardDataRes.data.complete.filter((f) => type === f.filterStatus);
            this.currentFilter = type;
        }
        // to clear filter
        else {
            this.getDashboardDataRes.data.callbacks = this.getDashboardDataRes.data.complete;
            this.currentFilter = '';
        }
    }
}

interface WidgetData {
    /**
     * TCM Proxy api URL
     */
    TCMProxyUrl: string;
}

// for more info visit - https://angular.io/api/core
