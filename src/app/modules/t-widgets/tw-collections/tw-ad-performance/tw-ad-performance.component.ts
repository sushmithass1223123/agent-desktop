import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { TChartConfig, ResStatus } from 'app/models';
import { takeUntil } from 'rxjs/operators';
import { CHART_COLORS } from 'app/constants';
import { BaseChartDirective } from 'ng2-charts';
import { GamificationService } from '@services/gamification.service';

@Component({
    selector: 'tw-ad-performance',
    templateUrl: './tw-ad-performance.component.html',
    styleUrls: ['./tw-ad-performance.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdPerformanceComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    performanceChart: TChartConfig = {
        data: [],
        labels: [],
        options: {
            showLines: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [
                    {
                        stacked: true,
                        ticks: {
                            maxRotation: 90,
                            minRotation: 90
                        },
                        gridLines: {
                            display: false
                        }
                    }
                ],
                yAxes: [
                    {
                        stacked: true,
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            stepSize: 50
                        }
                    }
                ],
                scaleLabel: {
                    display: false
                }
            }
        }
    };

    gamificationReqStatus: ResStatus = {
        error: false,
        loading: true,
        msg: ''
    };

    private performanceChartRef: BaseChartDirective;
    @ViewChild(BaseChartDirective) set setChartRef(content) {
        if (content) {
            this.performanceChartRef = content;
        }
    }

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
        private _appDataService: AppDataService,
        private gamificationService: GamificationService
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

        this.setChartData();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    setChartData(): void {
        if (!this.data.Data.AgentProgressUrl) {
            this.gamificationReqStatus = { loading: false, error: true, msg: 'AgentProgressUrl not provided in app config' };
            return;
        }
        this.gamificationService.getAgentProgress(this.data.Data.AgentProgressUrl, '1014').subscribe(
            (res) => {
                try {
                    this.gamificationReqStatus.loading = false;
                    const metrics = JSON.parse(res.d);
                    let labels = [];
                    let datasets = {
                        PointsAssigned: [],
                        RequiredPointsForNextBadge: []
                    };

                    metrics.forEach((m) => {
                        labels.push(m.MetricName);
                        datasets.PointsAssigned.push(m.PointsAssigned);
                        datasets.RequiredPointsForNextBadge.push(m.PointsAssigned + m.RequiredPointsForNextBadge);
                    });

                    this.performanceChart.labels = labels;
                    Object.keys(datasets).forEach((d, i) => {
                        this.performanceChart.data.push({
                            data: datasets[d],
                            label: d,
                            barPercentage: 0.2,
                            backgroundColor: CHART_COLORS[i].backgroundColor,
                            hoverBackgroundColor: CHART_COLORS[i].hoverBackgroundColor
                        });
                    });

                    setTimeout(() => {
                        (this.performanceChartRef as any).refresh();
                    }, 10);
                } catch (e) {
                    this.gamificationReqStatus = { loading: false, error: true, msg: 'Looks like something went wrong' };
                }
            },
            (err) => {
                this.gamificationReqStatus = { loading: false, error: true, msg: 'Something went wrong while fetching progress' };
            }
        );
    }
}

// for more info visit - https://angular.io/api/core
