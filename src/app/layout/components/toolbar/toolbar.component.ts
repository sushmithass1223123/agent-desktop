import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { AppDataService } from 'app/services/app-data.service';
import { IWidget } from 'app/interfaces';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ToolbarComponent implements OnInit, OnDestroy {
    horizontalNavbar: boolean;
    rightNavbar: boolean;
    hiddenNavbar: boolean;

    selectedLanguage: any;

    navbarWidgets = [];

    activeInteractionWidget = null;
    toolbarMenuWidget = null;

    connectivityStatus: {
        status: -1,
        eventMode: '';
    };

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {AppDataService} _appDataService
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _appDataService: AppDataService
    ) {

        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to the config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((settings: any) => {
                this.horizontalNavbar = settings.layout.navbar.position === 'top';
                this.rightNavbar = settings.layout.navbar.position === 'right';
                this.hiddenNavbar = settings.layout.navbar.hidden === true;
            });

        // Subscribe to config changes
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (config: any) => {
                    // check if the config is not null
                    if (config !== null) {
                        // get the content widgets
                        this.navbarWidgets = config.Main.Toolbar.Widgets || [];
                        // loop and get the widgets
                        this.navbarWidgets.forEach((widget: IWidget) => {
                            if (widget.Type === 'tw-active-interaction' && widget.Config.Enabled) {
                                this.activeInteractionWidget = widget;
                            }
                            else if (widget.Type === 'tw-toolbar-menu' && widget.Config.Enabled) {
                                this.toolbarMenuWidget = widget;
                            }
                        });
                    }
                }
            );

        SDKClient.events.on('connectivityStatus', this.connectivityStatusEvent);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        SDKClient.events.off('connectivityStatus', this.connectivityStatusEvent);
    }

    private connectivityStatusEvent = (data: any) => {
        setTimeout(() => {
            this.connectivityStatus = data;
        }, 100);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key: string): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
