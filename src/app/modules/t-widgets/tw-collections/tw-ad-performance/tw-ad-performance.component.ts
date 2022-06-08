import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { GAMIFICATION_METRIC_LABELS } from 'app/constants';
import { ResData } from 'app/interfaces';
import { interval, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SDKClient } from '@tmac/sdk';
import { TwPerformance } from '@ad/types';

/**
 * Performance chart data
 */
@Component({
    selector: 'tw-ad-performance',
    templateUrl: './tw-ad-performance.component.html',
    styleUrls: ['./tw-ad-performance.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdPerformanceComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwPerformance;

    /**
     * Gamification Metric Label
     */
    GAMIFICATION_METRIC_LABELS = GAMIFICATION_METRIC_LABELS;

    /**
     * performance chart data
     */
    performanceChartProgress = {
        badge: {},
        goal: {}
    };

    /**
     * Gamification Stateful request
     */
    gamificationReqStatus: ResData<null> = {
        error: false,
        loading: true,
        msg: ''
    };

    /**
     * Widget maximized flag
     */
    maximized: boolean;

    /**
     * Constructor
     * @param {HttpClient} _http
     */
    constructor(private _http: HttpClient) {
        super('TwAdPerformanceComponent');
    }

    /**
     * Polling subscription
     */
    pollingSubscription: Subscription;

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

        this.setChartData();
        // SDKClient.events.on('InteractionClosedEvent', this.startPolling);
        this.startPolling();
    }

    /**
     * Starts polling for performance data
     */
    startPolling = () => {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
        this.pollingSubscription = interval(10000).pipe(takeUntil(this.unsubscribeAll)).subscribe(this.setChartData);
    };

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // SDKClient.events.off('InteractionClosedEvent', this.startPolling);
    }

    /**
     * Set Chart Data
     */
    setChartData = (): void => {
        if (!this.data.Data.AgentProgressUrl) {
            this.gamificationReqStatus = { loading: false, error: true, msg: 'AgentProgressUrl is not provided in app config' };
            return;
        }

        const { agentId } = SDKClient.getAgentData();

        this._http
            .post<{
                // tslint:disable-next-line: completed-docs
                d: string;
            }>(this.data.Data.AgentProgressUrl, { agentId })
            .pipe(map((x) => JSON.parse(x.d)))
            .subscribe(
                (metrics) => {
                    try {
                        this.gamificationReqStatus = {
                            loading: false,
                            error: false,
                            msg: ''
                        };
                        (metrics || []).forEach((m: any) => {
                            this.performanceChartProgress.badge[m.Channel + (m.Channel ? '_' : '') + m.MetricName] = {
                                max: m.PointsAssigned + m.RequiredPointsForNextBadge,
                                current: m.PointsAssigned
                            };
                            this.performanceChartProgress.goal[m.Channel + (m.Channel ? '_' : '') + m.MetricName] = {
                                max: parseInt(m.MetricMaxValue, 10),
                                current: parseInt(m.MetricAverageValue, 10)
                            };
                        });
                    } catch (e) {
                        console.error(e);
                        this.gamificationReqStatus = { loading: false, error: true, msg: 'Looks like something went wrong' };
                    }
                },
                (err) => {
                    console.error(err);
                    this.gamificationReqStatus = { loading: false, error: true, msg: 'Something went wrong while fetching progress' };
                }
            );
    };
}

// for more info visit - https://angular.io/api/core
