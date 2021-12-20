import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { WallboardRefreshEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { CustomSDKEvent, IWidget } from 'app/interfaces';
import { intervalToDuration } from 'date-fns';
import { orderBy, sortBy } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { TwPieChart } from '@ad/types';

/**
 * Colors for chart
 */
const multiColors: any = {
    backgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.backgroundColor),
    hoverBackgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.hoverBackgroundColor)
};

type Dataset = { category: string; value: number };

/**
 * Common Pie / Doughnut chart component
 */
@Component({
    selector: 'tw-pie-chart.component',
    templateUrl: './tw-pie-chart.component.html',
    styleUrls: ['./tw-pie-chart.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwPieChartComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    multiColors = multiColors;
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwPieChart;

    /**
     * Widget data
     */
    // widgetData: WidgetData;

    /**
     * Stores chart data
     */
    chartData$: Observable<Dataset[]>;

    allData$: BehaviorSubject<Dataset[]> = new BehaviorSubject([]);

    /**
     * Chart type
     */
    chartType = 'pie';

    /**
     * No data message
     */
    noDataMessage: string;

    /**
     * Subscription for maximize event of tw-wrapper
     */
    maximized = false;

    /**
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService) {
        super();
        this.noDataMessage = 'No Data Available';
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.data.Data.Label = this.data.Data.Label ?? true;
        // get the data from config
        const widgetData = this.data.Data;
        // append the chart type, default is pie
        if (widgetData.ChartType) {
            this.chartType = widgetData.ChartType;
        }

        let eventName: any;
        // switch between received event to ececute relevant method
        switch (widgetData.Source.toLowerCase()) {
            case 'auxstatus':
                if (widgetData.Role === 'agent') {
                    eventName = 'AgentStatusDetailsEvent';
                } else if (widgetData.Role === 'supervisor') {
                    eventName = 'TeamActiveStatusDetailsEvent';
                    this.noDataMessage = 'No Active Agents';
                }
                break;

            case 'ciq':
                eventName = 'TeamWallboardRefreshEvent';
                this.noDataMessage = 'No Calls in Queue';
                break;

            case 'intentlist':
                eventName = 'TeamIntentListEvent';
                break;

            case 'totalinteractions':
                if (widgetData.Role === 'agent') {
                    eventName = 'AgentChannelListEvent';
                } else if (widgetData.Role === 'supervisor') {
                    eventName = 'TeamChannelListEvent';
                }
                break;

            case 'activechannels':
                eventName = 'TeamActiveChannelListEvent';
                this.noDataMessage = 'No Active Channels';
                break;
        }

        // if event name register to it
        if (eventName) {
            this._tmacEventService
                .getNonInteractionEvents([eventName])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
        } else {
            this.logger.warn(`Unable to get event name to regiser, Source=${widgetData.Source}`);
        }

        this.chartData$ = this.allData$.pipe(
            takeUntil(this.unsubscribeAll),
            map((ds) => (this.maximized ? ds : ds.slice(0, widgetData.Limit || 5)))
        );
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To reduce config data limit of restore view
     *
     * @param datasets
     * @param labels
     */
    showData(dataset?: Dataset[]): void {
        if (!dataset) {
            dataset = this.allData$.value;
        }
        this.allData$.next(dataset);
    }

    /**
     * AgentStatusDetailsEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private AgentStatusDetailsEvent(evt: CustomSDKEvent): void {
        // sort received States data based on 'Duration'
        const dataset = sortBy(evt.Data.States, 'Duration')
            .reverse()
            .reduce((acc, curr) => {
                // check if the share will be relevant in pie chart and only add that data
                const duration = intervalToDuration({ start: 0, end: curr.Duration * 1000 });
                const share = duration.hours + duration.days * 24 + Math.floor(duration.minutes / 60);
                if (!curr.Duration) {
                    return acc;
                }
                // format the category and push the data to the chart
                const data: Dataset = {
                    category: `${curr.State} \n [${share < 10 ? '0' : share}:${duration.minutes < 10 ? '0' + duration.minutes : duration.minutes}:${
                        duration.seconds < 10 ? '0' + duration.seconds : duration.seconds
                    }]`,
                    value: share
                };
                acc.push(data);
                return acc;
            }, []);
        this.showData(dataset);
    }

    /**
     * TeamActiveStatusDetailsEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamActiveStatusDetailsEvent(evt: CustomSDKEvent): void {
        // sort received States data based on 'Duration'
        const dataset = sortBy(evt.Data.States, 'Duration')
            .reverse()
            .reduce((acc, curr) => {
                const duration = intervalToDuration({ start: 0, end: curr.Duration * 1000 });
                // check if the share will be relevant in pie chart and only add that data
                const share = duration.hours + duration.days * 24 + Math.floor(duration.minutes / 60);
                if (!curr.Duration) {
                    return acc;
                }
                // format the category and push the data to the chart
                const data: Dataset = {
                    category: `${curr.State} \n [${share < 10 ? '0' : share}:${duration.minutes < 10 ? '0' + duration.minutes : duration.minutes}:${
                        duration.seconds < 10 ? '0' + duration.seconds : duration.seconds
                    }]`,
                    value: share
                };
                acc.push(data);
                return acc;
            }, []);
        this.showData(dataset);
    }

    /**
     * WallboardRefreshEvent handler
     * @param {WallboardRefreshEvent} evt
     * @method
     */
    private TeamWallboardRefreshEvent(evt: WallboardRefreshEvent): void {
        // sort received States data based on 'CallsInQueue'
        const dataset = sortBy(evt.Skills, 'CallsInQueue')
            .reverse()
            .reduce((acc, curr) => {
                // check if the share will be relevant in pie chart and only add that data
                if (!curr.CallsInQueue) {
                    return acc;
                }
                // format the category and push the data to the chart
                const data: Dataset = {
                    category: `${curr.SkillName} \n ${curr.CallsInQueue}`,
                    value: curr.CallsInQueue
                };
                acc.push(data);
                return acc;
            }, []);
        this.showData(dataset);
    }

    /**
     * TeamIntentListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamIntentListEvent(evt: CustomSDKEvent): void {
        const intents = evt.Data?.Intents || [];

        // sort received States data based on 'Count'
        const dataset = orderBy(intents, ['Count'], ['desc']).reduce((acc, curr) => {
            // check if the share will be relevant in pie chart and only add that data
            if (!curr.Count) {
                return acc;
            }
            const data: Dataset = {
                category: `${curr.Intent || 'Unknown'} \n ${curr.Count}`,
                value: curr.Count
            };
            // format the category and push the data to the chart
            acc.push(data);
            return acc;
        }, []);
        this.showData(dataset);
    }

    /**
     * AgentChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private AgentChannelListEvent(evt: CustomSDKEvent): void {
        // sort received States data based on 'Total'
        const dataset = sortBy(evt.Data.Channels, 'Total')
            .reverse()
            .reduce((acc, curr) => {
                // check if the share will be relevant in pie chart and only add that data
                if (!curr.Total) {
                    return acc;
                }
                const data: Dataset = {
                    category: `${curr.Channel || 'Unknown'} \n ${curr.Total}`,
                    value: curr.Total
                };
                // format the category and push the data to the chart
                acc.push(data);
                return acc;
            }, []);
        this.showData(dataset);
    }

    /**
     * TeamChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamChannelListEvent(evt: CustomSDKEvent): void {
        // sort received States data based on 'Total'
        const dataset = sortBy(evt.Data.Channels, 'Total')
            .reverse()
            .reduce((acc, curr) => {
                // check if the share will be relevant in pie chart and only add that data
                if (!curr.Total) {
                    return acc;
                }
                const data: Dataset = {
                    category: `${curr.Channel || 'Unknown'} \n ${curr.Total}`,
                    value: curr.Total
                };
                // format the category and push the data to the chart
                acc.push(data);
                return acc;
            }, []);
        this.showData(dataset);
    }

    /**
     * TeamActiveChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamActiveChannelListEvent(evt: CustomSDKEvent): void {
        // sort received States data based on 'Total'
        const dataset = sortBy(evt.Data.Channels, 'Total')
            .reverse()
            .reduce((acc, curr) => {
                // check if the share will be relevant in pie chart and only add that data
                if (!curr.Total) {
                    return acc;
                }
                const data: Dataset = {
                    category: `${curr.Channel || 'Unknown'} \n ${curr.Total}`,
                    value: curr.Total
                };
                // format the category and push the data to the chart
                acc.push(data);
                return acc;
            }, []);
        this.showData(dataset);
    }

    labelContent = (e: any): string => e.category;
}

interface WidgetData {
    /**
     * Source of data to be fetched and shown
     */
    Source: string;
    /**
     * Type of chart
     */
    ChartType: 'pie' | 'doughnut';
    /**
     * To get data based on agent profile
     */
    Role: 'agent' | 'supervisor';
    /**
     * To limit no of data to be shown on restore view
     */
    Limit: number;
}
