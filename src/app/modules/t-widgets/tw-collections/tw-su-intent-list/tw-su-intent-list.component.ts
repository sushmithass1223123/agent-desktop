import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { TwChartConfig } from 'app/interfaces';
import { ChartDataSets } from 'chart.js';
import { takeUntil } from 'rxjs/operators';
import { SDKClient, TeamIntentDataList } from 'tmac-sdk';
import * as _ from 'lodash';

@Component({
    selector: 'tw-su-intent-list',
    templateUrl: './tw-su-intent-list.component.html',
    styleUrls: ['./tw-su-intent-list.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuIntentListComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    maximized = false;
    intentChart: TwChartConfig = {
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
        colors: CHART_COLORS,
        labels: [],
        legend: false
    };

    allDatasets: { datasets: ChartDataSets[]; labels: string[] } = { datasets: [], labels: [] };

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

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

        SDKClient.events.on('TeamIntentListEvent', this.TeamIntentListEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        SDKClient.events.off('TeamIntentListEvent', this.TeamIntentListEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private TeamIntentListEvent = (intentList: TeamIntentDataList) => {
        const datasets = { Count: [] };
        const labels = [];
        let intents = intentList?.Intents || [];
        intents = _.orderBy(intents, ['Count'], ['desc']);
        intents.forEach((c) => {
            datasets.Count.push(c.Count);
            labels.push(c.Intent || 'Unknown');
        });
        this.allDatasets.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.allDatasets.labels = labels;
        if (this.maximized) {
            this.intentChart.datasets = this.allDatasets.datasets;
            this.intentChart.labels = this.allDatasets.labels;
        } else {
            this.intentChart.datasets = this.allDatasets.datasets.map((x) => ({ ...x, data: x.data.slice(0, 5) }));
            this.intentChart.labels = this.allDatasets.labels.slice(0, 5);
        }
    }
    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    maximizeEvt(state: boolean): void {
        this.maximized = state;
        if (state) {
            this.intentChart.datasets = this.allDatasets.datasets;
            this.intentChart.labels = this.allDatasets.labels;
        } else {
            this.intentChart.datasets = this.allDatasets.datasets.map((x) => ({ ...x, data: x.data.slice(0, 3) }));
            this.intentChart.labels = this.allDatasets.labels.slice(0, 3);
        }
    }
}

// for more info visit - https://angular.io/api/core
