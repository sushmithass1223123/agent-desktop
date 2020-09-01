import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { TwChartConfig } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';
import { SDKClient, AgentStateDurationList } from 'tmac-sdk';

const multiColors: any = {
    backgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.backgroundColor),
    borderCapStyle: 'butt',
    hoverBackgroundColor: [...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS, ...CHART_COLORS].map((c) => c.hoverBackgroundColor)
};

@Component({
    selector: 'tw-aux-status-chart.component',
    templateUrl: './tw-aux-status-chart.component.html',
    styleUrls: ['./tw-aux-status-chart.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAuxStatusChartComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: FuseConfig;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

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
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService
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

        SDKClient.events.on('AgentStatusDetailsEvent', this.AgentStatusDetailsEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        SDKClient.events.off('AgentStatusDetailsEvent', this.AgentStatusDetailsEvent);
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    AgentStatusDetailsEvent = (evt: AgentStateDurationList) => {
        const datasets = { Duration: [] };
        const labels = [];
        evt.States.forEach((c) => {
            datasets.Duration.push(c.Duration);
            labels.push(c.State);
        });
        this.statusChart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.statusChart.labels = labels;
    };

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
