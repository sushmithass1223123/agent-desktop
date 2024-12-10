import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfig } from '@fuse/types';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { SDKClient, SDKConnectivityStatusEvent } from '@tmac/sdk';
import { IWidget } from 'app/interfaces';
import { AppDataService } from 'app/services/app-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { TranslocoService } from '@ngneat/transloco';

/**
 * Toolbar component
 */
@Component({
    selector: 'toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ToolbarComponent extends SharedWrapper implements OnInit, OnDestroy {
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
    connectivityStatus: SDKConnectivityStatusEvent;

    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Info loading flag
     */
    private infoLoading: boolean;

    private appConfig;

    private reloginDialog: MatDialogRef<any>;

    private showReloginOnMaxRetryExceed = null;

    private reloginTimerStarted;

    public isForceRelogin = false;

    private isInitial = true;

    connectivityStatusMessages = [];

    private stopTimer = false;

    public isStopRetry;


    /**
     * Constructor
     *
     * @param {FuseFacadeService} _fuseFacadeService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {AppDataService} _appDataService
     */
    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private _fuseSidebarService: FuseSidebarService,
        private _appDataService: AppDataService,
        private _appUIService: AppUiService,
        private translocoService: TranslocoService
    ) {
        super('ToolbarComponent');
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
        // Subscribe to custom fuse config changes
        this._fuseFacadeService
            .getConfig()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                this.horizontalNavbar = config.layout.navbar.position === 'top';
                this.rightNavbar = config.layout.navbar.position === 'right';
                this.hiddenNavbar = config.layout.navbar.hidden === true;
            });

        // Subscribe to config changes
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            // check if the config is not null
            if (config !== null) {
                // get the content widgets
                this.navbarWidgets = config.Main.Toolbar.Widgets || [];
                // loop and get the widgets
                this.navbarWidgets.forEach((widget: IWidget) => {
                    if (widget.Type === 'tw-active-interaction' && widget.Config.Enabled) {
                        this.activeInteractionWidget = widget;
                    } else if (widget.Type === 'tw-toolbar-menu' && widget.Config.Enabled) {
                        this.toolbarMenuWidget = widget;
                    }
                });

                this.appConfig = config?.AppConfigs;
            }
        });

        this.registerToSDKEvents();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        SDKClient.events.off('SDKConnectivityStatusEvent', this.connectivityStatusEvent);
        SDKClient.events.off('SignalRErrorEvent', this.onSignalRError);
        SDKClient.events.off('SignalRConnectedEvent', this.onSignalRConnect);
        SDKClient.events.off('SignalRReconnectedEvent', this.onSignalRConnect);
        SDKClient.events.off('ReloginOnSignalRConnectivityError', this.onForceRelogin);

        this.isForceRelogin = false;
        this.resetAllErrorNotifications();

    }

    registerToSDKEvents() {
        SDKClient.events.on('SDKConnectivityStatusEvent', this.connectivityStatusEvent);
        if(this.appConfig?.EnableReloginOnConnectionError && !this.appConfig?.SDK?.signalRProxy?.fallback) {
            SDKClient.events.on('SignalRErrorEvent', this.onSignalRError);
        }
        SDKClient.events.on('SignalRConnectedEvent', this.onSignalRConnect);
        SDKClient.events.on('SignalRReconnectedEvent', this.onSignalRConnect);
        SDKClient.events.on('ReloginOnSignalRConnectivityError', this.onForceRelogin);
        SDKClient.events.on('MSStatusEvent', this.onMSStatusEvent);
    }

    /**
     * To handle SDKConnectivityStatus
     *
     * @param data
     */
    private connectivityStatusEvent = (evt: SDKConnectivityStatusEvent) => {
        try{
            if(evt.Message?.trim() !== '' && this.appConfig?.Notifications?.AppAlertOnConnectivityStatus && !this.isStopRetry) {
                if(Number(evt.Status) === 1) {
                    this.removeAllErrorMessages();
                }
                this.connectivityStatusMessages.push(evt);
                this.squentialSnackbar();
            }
            setTimeout(() => {
                this.connectivityStatus = evt;
            }, 100);
        } catch(e) {
            this.logger.error('Error occured on setting connectivity status in AD', e);
        }

    };

    removeAllErrorMessages() {
        this.connectivityStatusMessages = this.connectivityStatusMessages.filter(msgEvt => Number(msgEvt.Status) !== 2);
    }


    /**
     * Snackbars to be shown in sequential order which can avoid missing of snackbar display in case of
     * quicker events
     * @returns snackbars in order
     */

     public squentialSnackbar = () => {
        if(this.connectivityStatusMessages[0]['processed']) {
            return
        };
        this.connectivityStatusMessages[0]['processed'] = true;
        const evt = this.connectivityStatusMessages[0];
        this._appUIService.showAppSnackbar({
            'message': evt.Message,
            'state': Number(evt.Status) === 1 ? 'success' : 'warning',
            'vPos':'top',
            'hPos': 'center'
        }).afterDismissed().subscribe(res => {
            this.connectivityStatusMessages.shift();
            if(this.connectivityStatusMessages.length > 0) {
                this.squentialSnackbar();
            }
        })
    };

    /**
     * Method to capture signalR Error event and ask user to relogin to get new connection if fallback is disabled
     */
     private onSignalRError = () => {
        if(!this.reloginTimerStarted && !this.isStopRetry) {
            
            this.reloginTimerStarted = true;
            this.stopTimer = false;
            setTimeout(() => {
                !this.isStopRetry ? this.confirmRelogin('confirm', 'Something went wrong, do you wish to relogin ? <br> [Note: Current session will not be lost on re-login] ') : '';
                this.reloginTimerStarted = false;
                this.isInitial = false;
                if(this.showReloginOnMaxRetryExceed == null) {
                    this.signalRStopRetry(true);
                }
            },this.isInitial ? 10 : this.appConfig?.SDK?.signalRProxy?.timeout*1000);
        }
    }

    /**
     * 
     * @param type Type of custom dialog to be displayed - 'confirm' / 'alert'
     * @param msg  Message to be displayed in custom dialog
     */
    
     private confirmRelogin = (type, msg) => {
        try {
            if(!this.stopTimer) {
                this.reloginDialog?.close();
                this.reloginDialog = this._appUIService.showCustomDialog(type, msg, 'Re-login', {},{disableClose: true});
                this.reloginDialog.afterClosed().subscribe((res) => {
                    if(res) {
                        this.resetAllErrorNotifications();
                        this._appUIService._reloginTriggered = true;
                        location.reload();
                    } 
                });
            }
        } catch(e) {
            this.logger.debug('Error occured on handling SignalRError:' +e);
        }
    }

    private resetAllErrorNotifications() {
        if(!this.isForceRelogin) {
            this.reloginDialog?.close();

            this.stopTimer = true;
            this.isStopRetry = false;
            this.reloginTimerStarted = false;
            this.signalRStopRetry(false);
        }
    }


    /**
     * method to capture if signalR get connected back, so if any error msgs were being displayed 
     * it has to be closed and to stop timer
     */

     private onSignalRConnect = () => {
        this.resetAllErrorNotifications();
    }

    /**
     * 
     * @param isStart - whether to start / stop timer to force UI relogin popup
     */
     private signalRStopRetry = (isStart) => {
        clearTimeout(this.showReloginOnMaxRetryExceed);
        if(isStart) {
            this.showReloginOnMaxRetryExceed = setTimeout(() => {
                    this.confirmRelogin('alert', 'Connection failed, please relogin to continue.<br> [Note: Current session will not be lost on re-login] ');
                    this.isStopRetry = this.stopTimer ? false : true;
            }, this.appConfig?.SDK?.signalRProxy?.maxConnectivityRetryTimeOut*1000);
        } else {
            this.showReloginOnMaxRetryExceed = null;
        }
    };

    private onForceRelogin = () => {
        this.stopTimer = false;
        this.isStopRetry = true;
        this.isForceRelogin = true;
        this.confirmRelogin('alert', 'Observing a connectivity glitch, please relogin to continue. <br> [Note: Current session will not be lost on re-login] ');
    }

    /**
     * Method is to indicate agents about the status of the Media Server
     * @param evt MSStatus event data
     */
    private onMSStatusEvent = (evt) => {
        this._appUIService.showAppSnackbar({
            'message': this.getMSStatusMessage(evt),
            'state': this.getMSStatus(evt),
            'vPos':'top',
            'hPos': 'center'
        });
    }

    private getMSStatus(evt) {
        if(evt?.Status === 'Failed') {
            return 'danger';
        }

        if(evt?.Status === 'Reconnected') {
            return 'success';
        }

        return 'warning';
    }

    private getMSStatusMessage(evt) {
        if(evt?.Status === 'Failed') {
            return this.translocoService.translate('toolbarComponent.msDisconnectedMsg');
        }

        if(evt?.Status === 'Reconnected') {
            return this.translocoService.translate('toolbarComponent.msReconnectedMsg');
        }

        return this.translocoService.translate('toolbarComponent.msStatusWarningMsg');
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
     * To get application information
     */
    async showAppInfo(): Promise<void> {
        try {
            this.infoLoading = true;
            const connectionData = SDKClient.getConnectionData();
            const resp = await SDKClient.getTMACVersion(SDKClient.getAgentData().tmacServer);

            const message = `
            <div><b>Agent Desktop:<b></div>
            <span class="time secondary-text">${this._appDataService.getAppVersion()}</span>
            <br /> <br />   

            <div><b>TMAC Server:<b></div>
            <span class="time secondary-text">${resp.response ?? 'NA'}</span>
            <br /> <br />

            <div><b>Event Mode:<b></div>
            <span class="time secondary-text">${connectionData.eventMode ?? 'NA'}</span>
            <br /> <br />

            <div><b>Proxy URL:<b></div>
            <span class="time secondary-text">${connectionData.connectedProxyUrl ?? 'NA'}</span>
            <br /> <br />

            <div><b>SignalR URL:<b></div>
            <span class="time secondary-text">${connectionData.signalRUrl ?? 'NA'}</span>
            <br /> <br />     
            `;

            // show the dialog
            this._appUIService.showCustomDialog('alert', message, 'Application Information');
        } catch (error) {
            this._appUIService.showSnackbar('Error in fetching application information', 'failure');
        }

        this.infoLoading = false;
    }

    


}
