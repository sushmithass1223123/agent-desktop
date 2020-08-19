import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AppDataService } from '@services/app-data.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-su-transferred-conferenced-calls',
    templateUrl: './tw-su-transferred-conferenced-calls.component.html',
    styleUrls: ['./tw-su-transferred-conferenced-calls.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwSuTransferredConferencedCallsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
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

    bar_chart = {
        view: [150, 150],

        // options
        showXAxis: true,
        showYAxis: true,
        gradient: false,
        showLegend: false,
        showXAxisLabel: false,
        xAxisLabel: 'Country',
        showYAxisLabel: false,
        yAxisLabel: 'Population',
        animations: true,

        colorScheme: {
            domain: [
                '#b26cbc',
                '#ddbfe2',
                '#a24fad',
                '#c895cf',
                '#b26cbc',
                '#853199',
                '#732b90',
                '#642687',
                '#481e76',
                '#d2c8d9',
                '#b59ed1',
                '#835ab0',
                '#512b8b'
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
}

// for more info visit - https://angular.io/api/core
