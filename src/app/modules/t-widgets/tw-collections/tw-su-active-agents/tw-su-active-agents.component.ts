import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AppDataService } from '@services/app-data.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FuseConfigService } from '@fuse/services/config.service';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-su-active-agents',
    templateUrl: './tw-su-active-agents.component.html',
    styleUrls: ['./tw-su-active-agents.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuActiveAgentsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    agentList = {
        data: [
            {
                name: 'chirag Ramdas',
                status: 'Available',
                channels: [
                    {
                        type: 'voice',
                        notificationCount: 1
                    },
                    {
                        type: 'chat',
                        notificationCount: 2
                    },
                    {
                        type: 'video',
                        notificationCount: 3
                    }
                ],
                connectivity: {
                    type: 'polling',
                    status: ''
                }
            },
            {
                name: 'Kavya Nayak',
                status: 'Available',
                channels: [
                    {
                        type: 'voice',
                        notificationCount: 1
                    },
                    {
                        type: 'chat',
                        notificationCount: 2
                    },
                    {
                        type: 'video',
                        notificationCount: 3
                    }
                ],
                connectivity: {
                    type: 'polling',
                    status: ''
                }
            },
            {
                name: 'Vishal Pinto',
                status: 'Available',
                channels: [
                    {
                        type: 'voice',
                        notificationCount: 1
                    },
                    {
                        type: 'chat',
                        notificationCount: 2
                    },
                    {
                        type: 'video',
                        notificationCount: 3
                    }
                ],
                connectivity: {
                    type: 'polling',
                    status: ''
                }
            }
        ]
    };
    displayedColumns = ['name', 'status', 'channels', 'connectivity'];

    datasource = new MatTableDataSource([]);
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

        // build material table data source
        this.datasource = new MatTableDataSource(this.agentList.data);
        this.datasource.sort = this.sort;
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

    searchAgent(searchValue) {}

    getFirstCharFromName(str) {
        var matches = str.match(/\b(\w)/g); // ['J','S','O','N']
        return matches.join('').toUpperCase(); // JSON
    }

    getChannelIcon(channel) {
        switch (channel) {
            case 'voice':
                return 'call';
            case 'chat':
                return 'chat';
            case 'video':
                return 'duo';
        }
    }
    getConectivityIcon(type) {
        switch (type) {
            case 'polling':
                return 'wifi';
        }
    }
}

// for more info visit - https://angular.io/api/core
