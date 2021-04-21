import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppUiService } from '@services/app-ui.service';
import { IWidget } from 'app/interfaces';
import { AppDataService } from 'app/services/app-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from '@tmac/sdk';

/**
 * Toolbar component
 */
@Component({
    selector: 'toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ToolbarComponent implements OnInit, OnDestroy {
    /**
     * Horizontal Navbar
     */
    horizontalNavbar: boolean;
    /**
     * Right navbar
     */
    rightNavbar: boolean;
    /**
     * Hidden Navbar
     */
    hiddenNavbar: boolean;

    /**
     * Selected Language
     */
    selectedLanguage: any;

    /**
     * Navbar Widgets
     */
    navbarWidgets = [];

    /**
     * Active Interaction Widget
     */
    activeInteractionWidget = null;
    /**
     * Toolbar Widget
     */
    toolbarMenuWidget = null;

    /**
     * Connectivity Status
     */
    connectivityStatus: {
        /**
         * Status 
         */
        status: -1,
        /**
         * Event mode
         */
        eventMode: '';
    };

    /**
     * Unsubscribe all subject
     */
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
        private _appDataService: AppDataService,
        private _appUIService: AppUiService
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

    /**
     * To get SDK connection info
     */
    getSDKConnectionData(): void {
        const connectionData = SDKClient.getConnectionData();
        const message = `
        <div><b>TMAC Server:<b></div>
        <span class="time secondary-text">${connectionData.tmacServer || 'NA'}</span>
        <br /> <br />

        <div><b>Event Mode:<b></div>
        <span class="time secondary-text">${connectionData.eventMode || 'NA'}</span>
        <br /> <br />

        <div><b>Proxy URL:<b></div>
        <span class="time secondary-text">${connectionData.connectedProxyUrl || 'NA'}</span>
        <br /> <br />

        <div><b>SignalR URL:<b></div>
        <span class="time secondary-text">${connectionData.signalRUrl || 'NA'}</span>
        <br /> <br />
        `;

        // show the dialog
        this._appUIService.showCustomDialog('alert', message, 'SDK Connection Info');
    }
}
