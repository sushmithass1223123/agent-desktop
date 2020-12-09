import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { CustomSDKEvent, IWidget, TwChartConfig } from 'app/interfaces';
import { orderBy, sortBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { AgentChannelDataList, AgentStateDurationList, SDKClient, TeamIntentDataList, WallboardRefreshEvent } from 'tmac-sdk';


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
        this.chart.type = this.data.Data.ChartType || 'pie';

        if (this.data.Data.Source === 'tw-su-status' || this.data.Data.Source === 'tw-aux-status-chart') {
            // SDKClient.events.on('TeamActiveStatusDetailsEvent', this.TeamActiveStatusDetailsEvent);
            this.registerToEvent('TeamActiveStatusDetailsEvent');

        } else if (this.data.Data.Source === 'tw-su-calls-in-queue') {
            // SDKClient.events.on('TeamWallboardRefreshEvent', this.TeamWallboardRefreshEvent);
            this.registerToEvent('TeamWallboardRefreshEvent');

        } else if (this.data.Data.Source === 'tw-su-intent-list') {
            // SDKClient.events.on('TeamIntentListEvent', this.TeamIntentListEvent);
            this.registerToEvent('TeamIntentListEvent');

        } else if (this.data.Data.Source === 'tw-ad-total-interactions') {
            if (this.data.Data.Role === 'supervisor' && SDKClient.getAgentData().agentProfile === 'S') {
                // SDKClient.events.on('TeamChannelListEvent', this.TeamChannelListEvent);
                this.registerToEvent('TeamChannelListEvent');
            } else {
                // SDKClient.events.on('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);
                this.registerToEvent('AgentChannelDetailsEvent');
            }
        } else if (this.data.Data.Source === 'tw-su-channels') {
            // SDKClient.events.on('TeamActiveChannelListEvent', this.TeamActiveChannelListEvent);
            this.registerToEvent('TeamActiveChannelListEvent');
        }
    }

    /**
     * To register to event
     * 
     * @param {String} eventName
     */
    registerToEvent(eventName: string): void {
        this._tmacEventService.getEvents([eventName])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(evts => this[eventName](evts[0]));
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // SDKClient.events.off('TeamActiveStatusDetailsEvent', this.TeamActiveStatusDetailsEvent);
        // SDKClient.events.off('TeamWallboardRefreshEvent', this.TeamWallboardRefreshEvent);
        // SDKClient.events.off('TeamIntentListEvent', this.TeamIntentListEvent);
        // SDKClient.events.off('TeamChannelListEvent', this.TeamChannelListEvent);
        // SDKClient.events.off('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);
        // SDKClient.events.off('TeamActiveChannelListEvent', this.TeamActiveChannelListEvent);
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * TeamActiveStatusDetailsEvent handler
     * @param {CustomSDKEvent} evt 
     * @method
     */
    private TeamActiveStatusDetailsEvent = (evt: CustomSDKEvent) => {
        const datasets = { Duration: [] };
        const labels = [];
        sortBy(evt.Data.States, 'Duration')
            .reverse()
            .forEach((c) => {
                const hours = Math.floor(c.Duration / 3600);
                const minutes = Math.floor((c.Duration % 3600) / 60);
                const seconds = Math.floor((c.Duration % 3600) % 60);

                datasets.Duration.push(c.Duration);
                labels.push(`${c.State} - [${hours}:${minutes}:${seconds}]`);
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
    private TeamWallboardRefreshEvent = (evt: WallboardRefreshEvent) => {
        const datasets = { 'Calls In Queue': [] };
        const labels = [];
        sortBy(evt.Skills, 'CallsInQueue')
            .reverse()
            .forEach((c) => {
                datasets['Calls In Queue'].push(c.CallsInQueue);
                labels.push(c.SkillName);
            });
        this.chart.datasets = Object.keys(datasets).map((d) => {
            if (datasets[d].every((x) => x === 0)) {
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
    private TeamIntentListEvent = (evt: CustomSDKEvent) => {
        const datasets = { Count: [] };
        const labels = [];
        let intents = evt.Data?.Intents || [];
        intents = orderBy(intents, ['Count'], ['desc']);
        intents.forEach((c: any) => {
            datasets.Count.push(c.Count);
            labels.push(c.Intent || 'Unknown');
        });

        const allDatasets = this.chart;

        allDatasets.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        allDatasets.labels = labels;
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
     * AgentChannelDetailsEvent handler 
     * @param {CustomSDKEvent} evt 
     * @method
     */
    private AgentChannelDetailsEvent = (evt: CustomSDKEvent): void => {
        if (this.data.Data.Role === 'supervisor' && this.data.Data.AgentId !== evt.Data.AgentId) {
            return;
        }

        const datasets = { Count: [], Duration: [] };
        const labels = [];
        sortBy(evt.Data.Channels, 'Total').forEach((c) => {
            datasets.Count.push(c.Total);
            datasets.Duration.push(c.AverageActiveTime + c.AverageHoldTime);
            labels.push(c.Channel);
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
    private TeamChannelListEvent = (evt: CustomSDKEvent) => {
        const datasets = { Total: [] };
        const labels = [];
        evt.Data.Channels.forEach((c: any) => {
            datasets.Total.push(c.Total);
            labels.push(c.Channel);
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
    private TeamActiveChannelListEvent = (evt: CustomSDKEvent) => {
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

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
