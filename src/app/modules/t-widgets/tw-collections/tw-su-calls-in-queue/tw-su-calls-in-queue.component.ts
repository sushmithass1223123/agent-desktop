import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { TwChartConfig } from 'app/interfaces';
import { sortBy } from 'lodash';
import { SDKClient, WallboardRefreshEvent } from 'tmac-sdk';

/**
 * Colors for chart
 */
const multiColors: any = {
    backgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.backgroundColor),
    hoverBackgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.hoverBackgroundColor)
};

/**
 * Calls in queue component
 */
@Component({
    selector: 'tw-su-calls-in-queue.component',
    templateUrl: './tw-su-calls-in-queue.component.html',
    styleUrls: ['./tw-su-calls-in-queue.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuCallsInQueueComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: any;

    /**
     * Calls in queue Chart info
     */
    ciqChart: TwChartConfig = {
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
    constructor( ) {
        super();
        this.ciqChart.options.plugins = { outlabels: { display: this.ciqChart.legend } };
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

        SDKClient.events.on('TeamWallboardRefreshEvent', this.TeamWallboardRefreshEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        SDKClient.events.off('TeamWallboardRefreshEvent', this.TeamWallboardRefreshEvent);
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * TeamWallboardRefreshEvent handler
     * @param {WallboardRefreshEvent} evt 
     */
    TeamWallboardRefreshEvent = (evt: WallboardRefreshEvent) => {
        const datasets = { 'Calls In Queue': [] };
        const labels = [];
        sortBy(evt.Skills, 'CallsInQueue')
            .reverse()
            .forEach((c) => {
                datasets['Calls In Queue'].push(c.CallsInQueue);
                labels.push(c.SkillName);
            });
        this.ciqChart.datasets = Object.keys(datasets).map((d) => {
            if (datasets[d].every((x) => x === 0)) {
                datasets[d] = [];
            }
            return { data: datasets[d], label: d };
        });
        this.ciqChart.labels = labels;
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
