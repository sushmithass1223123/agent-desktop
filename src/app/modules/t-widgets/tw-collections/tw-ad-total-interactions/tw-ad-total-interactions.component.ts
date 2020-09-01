import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { TChartConfig } from 'app/models';
import { takeUntil } from 'rxjs/operators';

const interactionsData = {
    AgentId: '50004',
    Duration: 100,
    Channels: [
        {
            Channel: 'TextChat',
            Total: 81,
            In: 81,
            Out: 0,
            Transfer: 0,
            Conference: 0,
            AverageActiveTime: 20,
            TotalActive: 6743,
            TotalHold: 0,
            AverageHoldTime: 0,
            LongestCall: 1218,
            ShortestCall: 1,
            TotalDuration: 6849,
            AverageInteractionTime: 84.55555555555556
        },
        {
            Channel: 'AV',
            Total: 81,
            In: 81,
            Out: 0,
            Transfer: 0,
            Conference: 0,
            AverageActiveTime: 3,
            TotalActive: 6743,
            TotalHold: 0,
            AverageHoldTime: 100,
            LongestCall: 1218,
            ShortestCall: 1,
            TotalDuration: 6849,
            AverageInteractionTime: 84.55555555555556
        },
        {
            Channel: 'Voice',
            Total: 81,
            In: 81,
            Out: 0,
            Transfer: 0,
            Conference: 0,
            AverageActiveTime: 3,
            TotalActive: 6743,
            TotalHold: 0,
            AverageHoldTime: 0,
            LongestCall: 1218,
            ShortestCall: 1,
            TotalDuration: 6849,
            AverageInteractionTime: 84.55555555555556
        }
    ]
};

const multiColors: any = {
    backgroundColor: CHART_COLORS.map((c) => c.backgroundColor),
    borderCapStyle: 'butt',
    hoverBackgroundColor: CHART_COLORS.map((c) => c.hoverBackgroundColor)
};

@Component({
    selector: 'tw-ad-total-interactions',
    templateUrl: './tw-ad-total-interactions.component.html',
    styleUrls: ['./tw-ad-total-interactions.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdTotalInteractionsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
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

    allInteractionsChart: TChartConfig = {
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
        colors: [multiColors, multiColors],
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

        this.setupTotalInteractionChart();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    setupTotalInteractionChart(): void {
        const datasets = { Total: [], AHT: [] };
        const labels = [];
        interactionsData.Channels.forEach((c) => {
            datasets.Total.push(c.Total);
            datasets.AHT.push(c.AverageActiveTime + c.AverageHoldTime);
            labels.push(c.Channel);
        });
        this.allInteractionsChart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.allInteractionsChart.labels = labels;
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
