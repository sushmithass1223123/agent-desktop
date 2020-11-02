import { DOCUMENT } from '@angular/common';
import { AfterContentInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { ThemeSelector } from 'app/layout/utils/theme-selector';
import { environment } from 'environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentForcedLogoffEvent, SDKClient } from 'tmac-sdk';

/**
 * MainComponent
 */
@Component({
    selector: 'main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy, AfterContentInit {
    /**
     * Fuse config
     */
    fuseConfig: FuseConfig;
    /**
     * App config
     */
    appConfig: any;
    /**
     * Loaded flag
     */
    loaded = false;
    /**
     * Logging agent Id
     */
    agentId: string;
    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     * 
     * @param {DOCUMENT} document 
     * @param {FuseConfigService} _fuseConfigService 
     * @param {AppDataService} _appDataService 
     * @param {FuseSidebarService} _fuseSidebarService 
     * @param {Router} _router 
     * @param {AppUiService} _appUIService 
     * @param {AgentFeaturesService} _agentFeaturesService 
     * @param {TMACEventService} _tmacEventsService 
     * @param {ActivatedRoute} _activatedRouter 
     */
    constructor(
        @Inject(DOCUMENT) private document: any,
        private _fuseConfigService: FuseConfigService,
        private _appDataService: AppDataService,
        private _fuseSidebarService: FuseSidebarService,
        private _router: Router,
        private _appUIService: AppUiService,
        private _agentFeaturesService: AgentFeaturesService,
        // this service must not be removed, this will listen to some TMAC events
        private _tmacEventsService: TMACEventService,
        private _activatedRouter: ActivatedRoute,
        private _titleService: Title
    ) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // subscribe to _activatedRouter for loging agent id
        this._activatedRouter.paramMap
            .subscribe(paramMap => {
                // check if agentId in param
                if (paramMap.has('agentId')) {
                    this.agentId = paramMap.get('agentId');
                }
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // register to all the tmac events in service
        this._tmacEventsService.subscribe();

        // subscribe to config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {
                this.fuseConfig = config;
            });

        // subscribe to app changes
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {
                if (Object.keys(config).length) {
                    this.appConfig = config;
                    this.setTheme();
                }
            });
    }

    /**
     * AfterContentInit
     */
    ngAfterContentInit(): void {
        // check the login
        this.checkLogin();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        // de-register the TMAC events in service
        this._tmacEventsService.unsubscribe();

        // remove the processed features
        this._agentFeaturesService.unsubscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set the app config
     */
    private setTheme(): void {
        // apply the theme
        const themeName = this.appConfig.AppConfigs.Theme || '';
        if (themeName) {
            const theme = ThemeSelector.getFuseConfigByTheme(themeName, false);
            this._fuseConfigService.config = {
                ...theme
            };
        }
    }

    /**
     * To verify the login
     */
    private async checkLogin(): Promise<any> {

        // get the route history
        const route = history.state?.routeFrom;
        // for production build if the main url is opened directly route to login page
        if (environment.production && (!route || route !== 'login')) {
            // we will route to login page
            this.routeToLogin();
            return;
        }

        // get the logging agent id
        const agentId = history.state?.agentId || this.agentId;
        // check the agent Id
        if (agentId) {
            if (route !== 'login') {
                const config = await this._appDataService.getConfig(agentId);
                this.appConfig = config;
                this.setTheme();
            }
            // get the login data
            const loginData = await SDKClient.getLoginData(agentId);
            // check if the login data is available, if not route back to login page
            if (loginData === null || !loginData.agentData.isLoggedIn) {
                // we will route to login page
                this.routeToLogin();
                return;
            }
            else {
                const stationEnabled = loginData.agentData.lanId !== loginData.agentData.deviceId;
                const station = loginData.agentData.deviceId;
                const title = this._titleService.getTitle();
                this._titleService.setTitle(title + ' - A: ' + agentId + (stationEnabled ? '/ S: ' + station : ''));
                this.pollForEvent();
            }
            // print the agent data and sdk client
            if (!environment.production) {
                console.log('LoginData: ', loginData);
            }
        }
        else {
            // we will route to login page
            this.routeToLogin();
        }
    }

    /**
     * Route to login
     */
    private routeToLogin(): void {
        const route = `login${this.agentId ? '/' + this.agentId : ''}`;
        // we will route to login page
        this._router.navigate([`${route}`]);
    }

    /**
     * To poll for TMAC events
     */
    private pollForEvent(): void {
        this._appUIService.showSnackbar('Hello, welcome to TMAC', 'info');

        // set the loaded to true
        this.loaded = true;

        // process the agent features
        this._agentFeaturesService.subscribe();

        // register for get events
        SDKClient.getEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key: any): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
