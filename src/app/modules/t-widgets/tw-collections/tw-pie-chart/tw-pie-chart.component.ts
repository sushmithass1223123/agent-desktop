import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { TMACEventService } from '@services/tmac-event.service';
import { TUtils, WallboardRefreshEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { CustomSDKEvent, IWidget, TwChartConfig } from 'app/interfaces';
import { intervalToDuration } from 'date-fns';
import { orderBy, sortBy } from 'lodash';
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
    @Input() data: IWidget;

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
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService) {
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
        // get the data from config
        this.widgetData = this.data.Data;
        // append the chart type, default is pie
        this.chart.type = this.widgetData.ChartType || 'pie';

        let eventName = '';
        switch (this.widgetData.Source) {
            case 'aux-status':
                if (this.widgetData.Role === 'agent') {
                    eventName = 'AgentStatusDetailsEvent';
                }
                else if (this.widgetData.Role === 'supervisor') {
                    eventName = 'TeamActiveStatusDetailsEvent';
                }
                break;

            case 'calls-in-queue':
                eventName = 'TeamWallboardRefreshEvent';
                break;

            case 'intent-list':
                eventName = 'TeamIntentListEvent';
                break;

            case 'total-interactions':
                if (this.widgetData.Role === 'agent') {
                    eventName = 'AgentChannelListEvent';
                }
                else if (this.widgetData.Role === 'supervisor') {
                    eventName = 'TeamChannelListEvent';
                }
                break;

            case 'active-channels':
                eventName = 'TeamActiveChannelListEvent';
                break;
        }

        // if event name register to it
        if (eventName) {
            this._tmacEventService
                .getEvents([eventName])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe(evts => evts.forEach(evt => this[evt.EventName](evt)));
        }
        else {
            TUtils.Logger.warn(`TwPieChartComponent: unable to get event name to regiser, Source=${this.widgetData.Source}`);
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
                labels.push(`${c.State} - [${duration.hours}:${duration.minutes}:${duration.seconds}]`);
            });
        this.chart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.chart.labels = labels;
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
                labels.push(`${c.State} - [${duration.hours}:${duration.minutes}:${duration.seconds}]`);
            });
        this.chart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.chart.labels = labels;
    }

    /**
     * WallboardRefreshEvent handler
     * @param {WallboardRefreshEvent} evt
     * @method
     */
    private TeamWallboardRefreshEvent(evt: WallboardRefreshEvent): void {
        const datasets = { 'Calls In Queue': [] };
        const labels = [];
        sortBy(evt.Skills, 'CallsInQueue')
            .reverse()
            .forEach((c) => {
                datasets['Calls In Queue'].push(c.CallsInQueue);
                labels.push(c.SkillName);
            });
        this.chart.datasets = Object.keys(datasets).map((d) => {
            if (datasets[d].every((x: number) => x === 0)) {
                datasets[d] = [];
            }
            return { data: datasets[d], label: d };
        });
        this.chart.labels = labels;
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

        const allDatasets = {
            datasets: [],
            labels: []
        };

        allDatasets.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        allDatasets.labels = labels;

        if (!this.wrapperComponent.maximized) {
            this.chart.datasets = allDatasets.datasets.map((x) => ({ ...x, data: x.data.slice(0, 5) }));
            this.chart.labels = allDatasets.labels.slice(0, 5);
        }

        this.wrapperComponent.maximizeEvent
            .asObservable()
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((maximized) => {
                if (maximized) {
                    this.chart.datasets = allDatasets.datasets;
                    this.chart.labels = allDatasets.labels;
                } else {
                    this.chart.datasets = allDatasets.datasets.map((x) => ({ ...x, data: x.data.slice(0, 5) }));
                    this.chart.labels = allDatasets.labels.slice(0, 5);
                }
            });
    }

    /**
     * AgentChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private AgentChannelListEvent(evt: CustomSDKEvent): void {
        if (this.data.Data.Role === 'supervisor' && this.data.Data.AgentId !== evt.Data.AgentId) {
            return;
        }

        const datasets = { Count: [] };
        const labels = [];
        sortBy(evt.Data.Channels, 'Total').forEach((c) => {
            // if (c.AverageActiveTime + c.AverageHoldTime > 0) {
            //     datasets.Duration.push(c.AverageActiveTime + c.AverageHoldTime);
            // }

            datasets.Count.push(c.Total);
            labels.push(`${c.Channel}`);

        });
        this.chart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.chart.labels = labels;
    }

    /**
     * TeamChannelListEvent handler
     * @param {CustomSDKEvent} evt
     * @method
     */
    private TeamChannelListEvent(evt: CustomSDKEvent): void {
        const datasets = { Count: [], Duration: [] };
        const labels = [];
        evt.Data.Channels.forEach((c: any) => {
            // if (c.AverageActiveTime + c.AverageHoldTime > 0) {
            //     datasets.Duration.push(c.AverageActiveTime + c.AverageHoldTime);
            // }

            datasets.Count.push(c.Total);
            labels.push(`${c.Channel}`);
        });
        this.chart.datasets = Object.keys(datasets)
            .map((d) => ({
                data: datasets[d],
                label: d
            }))
            .filter((x) => {
                const sum = x.data && x.data.length ? x.data.reduce((a, b) => a + b) : null;
                return !!sum;
            });
        this.chart.labels = labels;
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

        this.chart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.chart.labels = labels;
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
}

