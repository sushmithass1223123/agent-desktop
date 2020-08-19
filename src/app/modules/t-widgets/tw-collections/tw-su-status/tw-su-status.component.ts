import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'tw-su-status',
    templateUrl: './tw-su-status.component.html',
    styleUrls: ['./tw-su-status.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuStatusComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    @ViewChild('chartContainerRef') chartContainerRef: ElementRef;

    widget = {
        view: [],
        state: {
            maximized: false
        }
    };

    pieChat = {
        legend: false,
        doughnut: true,
        gradient: true,
        legendPosition: 'below',
        scheme: {
            domain: [
                '#91359f',
                '#a24fad',
                '#b26cbc',
                '#c895cf',
                '#ddbfe2',
            ]
        },
        data: [
            {
                name: 'Voice',
                value: 10
            },
            {
                name: 'Chat',
                value: 20
            },
            {
                name: 'Email',
                value: 40
            },
            {
                name: 'SMS',
                value: 20
            }
        ],
        onSelect: (ev: any) => {
            console.log(ev);
        },
        onActivate: (ev: any) => {
            console.log(ev);
        },
        onDeactivate: (ev: any) => {
            console.log(ev);
        }
    };

    barChart = {
        showXAxis: true,
        showYAxis: true,
        gradient: false,
        showLegend: false,
        showXAxisLabel: false,
        xAxisLabel: 'Country',
        showYAxisLabel: false,
        yAxisLabel: 'Population',
        animations: false,
        colorScheme: {
            domain: [
                '#91359f',
                '#ddbfe2'
            ]
        },
        dataSource: [
            {
                name: 'Chat',
                series: [
                    {
                        name: 'transfered',
                        value: 5
                    },
                    {
                        name: 'conferenced',
                        value: 3
                    }
                ]
            },
            {
                name: 'Voice',
                series: [
                    {
                        name: 'transfered',
                        value: 7
                    },
                    {
                        name: 'conferenced',
                        value: 4
                    }
                ]
            },
            {
                name: 'EMAIL',
                series: [
                    {
                        name: 'transfered',
                        value: 3
                    },
                    {
                        name: 'conferenced',
                        value: 8
                    }
                ]
            },
            {
                name: 'SMS',
                series: [
                    {
                        name: 'transfered',
                        value: 6
                    },
                    {
                        name: 'conferenced',
                        value: 2
                    }
                ]
            }
        ]
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

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    maximizeEvent(isMaximized: boolean): void {
        // set the maximized state
        this.widget.state.maximized = isMaximized;
        // set it first to avoid widget.view length 0
        this.widget.view = [this.chartContainerRef.nativeElement.offsetWidth / 2, this.chartContainerRef.nativeElement.offsetHeight];
        // setttime is to make sure this event processing will be passed
        setTimeout(() => {
            // this is to avoid "Expression ___ has changed after it was checked" error
            this.widget.view = [this.chartContainerRef.nativeElement.offsetWidth / 2, this.chartContainerRef.nativeElement.offsetHeight];
        }, 100);
    }
}

// for more info visit - https://angular.io/api/core
