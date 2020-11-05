import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { TwChartConfig } from 'app/interfaces';
import { sortBy } from 'lodash';
import { AgentStateDurationList, SDKClient } from 'tmac-sdk';

/**
 * Colors for chart
 */
const multiColors: any = {
    backgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.backgroundColor),
    hoverBackgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.hoverBackgroundColor)
};

/**
 * Supervisor Status
 */
@Component({
    selector: 'tw-su-status.component',
    templateUrl: './tw-su-status.component.html',
    styleUrls: ['./tw-su-status.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuStatusComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: any;

    /**
     * Status Chart Data
     */
    statusChart: TwChartConfig = {
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
    constructor(  ) {
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

        SDKClient.events.on('TeamActiveStatusDetailsEvent', this.TeamActiveStatusDetailsEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        SDKClient.events.off('TeamActiveStatusDetailsEvent', this.TeamActiveStatusDetailsEvent);
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Team active status details evnnt handler
     * @param {AgentStateDurationList} evt 
     * @method
     */
    TeamActiveStatusDetailsEvent = (evt: AgentStateDurationList) => {
        const datasets = { Duration: [] };
        const labels = [];
        sortBy(evt.States, 'Duration')
            .reverse()
            .forEach((c) => {

                const hours = Math.floor(c.Duration / 3600);
                const minutes = Math.floor(c.Duration % 3600 / 60);
                const seconds = Math.floor(c.Duration % 3600 % 60);

                datasets.Duration.push(c.Duration);
                labels.push(`${c.State} - [${hours}:${minutes}:${seconds}]`);

            });
        this.statusChart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.statusChart.labels = labels;
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
