import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { TMACEventService } from '@services/tmac-event.service';
import { WallboardRefreshEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { CustomSDKEvent, IWidget, TwChartConfig } from 'app/interfaces';
import { formatDuration, intervalToDuration } from 'date-fns';
import { orderBy, sortBy } from 'lodash';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Colors for chart
 */
const multiColors: any = {
    backgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.backgroundColor),
    hoverBackgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.hoverBackgroundColor)
};

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
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget<any, WidgetData>;

    /**
     * Wrapper component ref, to detect change in maximize
     */
    @ViewChild(TwWrapperComponent) wrapperComponent: TwWrapperComponent;

    /**
     * Widget data
     */
    widgetData: WidgetData;

    /**
     * Chart data
     */
    chart: TwChartConfig = {
        datasets: [{ data: [] }],
        options: {
            showLines: false,
            tooltips: {
                callbacks: {
                    title: (item, data) => {
                        return data.datasets[item[0].datasetIndex].label;
                    }
                }
            }
        },
        colors: Array(20)
            .fill(1)
            .map(() => multiColors),
        labels: [],
        legend: false
    };

    /**
     * No data message
     */
    noDataMessage: string;

    /**
     * Subscription for maximize event of tw-wrapper
     */
    wrapperMaxSub$: Subscription;

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
        // get the data from config
        this.widgetData = this.data.Data;
        // append the chart type, default is pie
        this.chart.type = this.widgetData.ChartType || 'pie';

        let eventName: any;
        switch (this.widgetData.Source.toLowerCase()) {
            case 'auxstatus':
                if (this.widgetData.Role === 'agent') {
                    eventName = 'AgentStatusDetailsEvent';
                } else if (this.widgetData.Role === 'supervisor') {
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
                if (this.widgetData.Role === 'agent') {
                    eventName = 'AgentChannelListEvent';
                } else if (this.widgetData.Role === 'supervisor') {
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
            this.logger.warn(`Unable to get event name to regiser, Source=${this.widgetData.Source}`);
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
     * To reduce config data limit of restore view
     *
     * @param datasets
     * @param labels
     */
    private showData(datasets: { [x: string]: any }, labels: any[]): void {
        const limit = this.widgetData.Limit;

        if (!limit) {
            this.chart.datasets = Object.keys(datasets).map((d) => ({
                data: datasets[d],
                label: d
            }));
            this.chart.labels = labels;
            return;
        }

        const allDataSets = {
            datasets: [],
            labels: []
        };

        allDataSets.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        allDataSets.labels = labels;

        const callback = (maximized) => {
            if (maximized) {
                this.chart.datasets = allDataSets.datasets;
                this.chart.labels = allDataSets.labels;
            } else {
                this.chart.datasets = allDataSets.datasets.map((x) => ({ ...x, data: x.data.slice(0, limit) }));
                this.chart.labels = allDataSets.labels.slice(0, limit);
            }
        };

        callback(this.wrapperComponent.maximized);

        if (this.wrapperMaxSub$) {
            this.wrapperMaxSub$.unsubscribe();
        }
        this.wrapperMaxSub$ = this.wrapperComponent.maximizeEvent
            .asObservable()
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((maximized) => callback(maximized));
    }

    /**
     * AgentStatusDetailsEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private AgentStatusDetailsEvent(evt: CustomSDKEvent): void {
        const datasets = { Duration: [] };
        const labels = [];
        sortBy(evt.Data.States, 'Duration')
            .reverse()
            .forEach((c) => {
                const duration = intervalToDuration({ start: 0, end: c.Duration * 1000 });
                datasets.Duration.push(c.Duration);
                const hours = duration.hours + duration.days * 24;
                labels.push(
                    `${c.State} - [${hours < 10 ? '0' : hours}:${duration.minutes < 10 ? '0' + duration.minutes : duration.minutes}:${
                        duration.seconds < 10 ? '0' + duration.seconds : duration.seconds
                    }]`
                );
            });

        this.showData(datasets, labels);
    }

    /**
     * TeamActiveStatusDetailsEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamActiveStatusDetailsEvent(evt: CustomSDKEvent): void {
        const datasets = { Duration: [] };
        const labels = [];
        sortBy(evt.Data.States, 'Duration')
            .reverse()
            .forEach((c) => {
                const duration = intervalToDuration({ start: 0, end: c.Duration * 1000 });
                datasets.Duration.push(c.Duration);
                const hours = duration.hours + duration.days * 24;
                labels.push(
                    `${c.State} - [${hours < 10 ? '0' : hours}:${duration.minutes < 10 ? '0' + duration.minutes : duration.minutes}:${
                        duration.seconds < 10 ? '0' + duration.seconds : duration.seconds
                    }]`
                );
            });

        this.showData(datasets, labels);
    }

    /**
     * WallboardRefreshEvent handler
     * @param {WallboardRefreshEvent} evt
     * @method
     */
    private TeamWallboardRefreshEvent(evt: WallboardRefreshEvent): void {
        const datasets = { 'Calls In Queue': [] };
        const labels = [];
        // filter only CIQ's greater than 0
        const skills = evt.Skills.filter((s) => s.CallsInQueue > 0);

        sortBy(skills, 'CallsInQueue')
            .reverse()
            .forEach((c) => {
                datasets['Calls In Queue'].push(c.CallsInQueue);
                labels.push(c.SkillName);
            });

        datasets['Calls In Queue'] =
            Object.keys(datasets).map((d) => {
                if (datasets[d].every((x: number) => x === 0)) {
                    datasets[d] = [];
                }
                return datasets[d];
            })[0] || [];

        this.showData(datasets, labels);
    }

    /**
     * TeamIntentListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamIntentListEvent(evt: CustomSDKEvent): void {
        const datasets = { Count: [] };
        const labels = [];
        let intents = evt.Data?.Intents || [];
        intents = orderBy(intents, ['Count'], ['desc']);
        intents.forEach((c: any) => {
            datasets.Count.push(c.Count);
            labels.push(c.Intent || 'Unknown');
        });

        this.showData(datasets, labels);
    }

    /**
     * AgentChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private AgentChannelListEvent(evt: CustomSDKEvent): void {
        const datasets = { Count: [] };
        const labels = [];
        sortBy(evt.Data.Channels, 'Total').forEach((c) => {
            datasets.Count.push(c.Total);
            labels.push(`${c.Channel}`);
        });

        this.showData(datasets, labels);
    }

    /**
     * TeamChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamChannelListEvent(evt: CustomSDKEvent): void {
        const datasets = { Count: [] };
        const labels = [];

        evt.Data.Channels.forEach((c: any) => {
            datasets.Count.push(c.Total);
            labels.push(`${c.Channel}`);
        });

        datasets.Count =
            Object.keys(datasets)
                .map((d) => datasets[d])
                .filter((x) => {
                    const sum = x && x.length ? x.reduce((a: number, b: number) => a + b) : null;
                    return !!sum;
                })[0] || [];

        this.showData(datasets, labels);
    }

    /**
     * TeamActiveChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamActiveChannelListEvent(evt: CustomSDKEvent): void {
        const datasets = { Count: [] };
        const labels = [];
        sortBy(evt.Data.Channels, 'Total')
            .reverse()
            .forEach((c) => {
                datasets.Count.push(c.Total);
                labels.push(c.Channel);
            });

        this.showData(datasets, labels);
    }
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
