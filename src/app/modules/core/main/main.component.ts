import { DOCUMENT } from '@angular/common';
import { AfterContentInit, Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { SDKClient } from '@tmac/sdk';
import { AUX_STATUSES } from 'app/constants';
import { ThemeSelector } from 'app/layout/utils/theme-selector';
import { environment } from 'environments/environment';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

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
    // fuseConfig: FuseConfig;
    /**
     * Fuse custom config
     */
    customFuse$ = this._fuseFacadeService.getConfig({ layoutStyle: 'layout.style' });
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
     * Disable opening console / refreshing
     * @param {KeyboardEvent} event
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): any {
        if (!this.appConfig) {
            return;
        }
        //  Disables refresh (F5, ctrl + r, ctrl + F5)
        if (this.appConfig.AppConfigs.RefreshDisabled) {
            if (
                event.key.toUpperCase() === 'F5' ||
                (event.key.toUpperCase() === 'R' && event.ctrlKey) ||
                (event.key.toUpperCase() === 'F5' && event.ctrlKey)
            ) {
                event.preventDefault();
                return false;
            }
        }
        //  Disabled dev tools (F12, ctrl + shift + c, ctrl + shift + i)
        if (this.appConfig.AppConfigs.DevToolsDisabled) {
            if (
                event.key.toUpperCase() === 'F12' ||
                (event.key.toUpperCase() === 'C' && event.ctrlKey && event.shiftKey) ||
                (event.key.toUpperCase() === 'I' && event.ctrlKey && event.shiftKey)
            ) {
                event.preventDefault();
                return false;
            }
        }
    }

    /**
     * Page before unload
     */
    @HostListener('window:beforeunload', ['$event'])
    pageBeforeUnload(event: any): boolean {
        if (environment.production) {
            event?.preventDefault();
            return false;
        }
        return true;
    }

    /**
     * Constructor
     *
     * @param {DOCUMENT} document
     * @param {FuseFacadeService} _fuseFacadeService
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
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private _appDataService: AppDataService,
        private _fuseSidebarService: FuseSidebarService,
        private _router: Router,
        private route: ActivatedRoute,
        private _appUIService: AppUiService,
        private _agentFeaturesService: AgentFeaturesService,
        // this service must not be removed, this will listen to some TMAC events
        private _tmacEventsService: TMACEventService,
        private _activatedRouter: ActivatedRoute,
        private _titleService: Title,
        private fuseSpashService: FuseSplashScreenService
    ) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // subscribe to _activatedRouter for loging agent id
        this._activatedRouter.paramMap.subscribe((paramMap) => {
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
        this.fuseSpashService.hide();
        // register to all the tmac events in service
        this._tmacEventsService.subscribe();

        // subscribe to config changes
        // this._fuseConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
        //     this.fuseConfig = config;
        // });

        // subscribe to app changes
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {
                if (Object.keys(config).length) {
                    this.appConfig = config;
                    this.setTheme();
                }
            });

        this.autoStatusChange();
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
     * changes status automatically
     */
    private autoStatusChange(): void {
        /**
         * subscribes to Activated route
         */
        this.route.queryParams
            .pipe(
                takeUntil(this._unsubscribeAll),
                // delay(2000),
                // continue only if userId present
                filter((params) => params.state),
                map((params) => params.state.toLowerCase())
            )
            .subscribe(async (state) => {
                try {
                    const item = AUX_STATUSES[state];
                    // change the status
                    await SDKClient.changeStatus(item);
                } catch (e) {
                    console.error(e);
                }
            });
    }

    /**
     * Set the app config
     */
    private setTheme(): void {
        // apply the theme
        const themeName = this.appConfig.AppConfigs.Theme || '';
        const webFont = this.appConfig.AppConfigs.Font || 'wf-muli';
        const flatTheme = this.appConfig.AppConfigs.FlatTheme ?? false;
        if (themeName) {
            const theme = ThemeSelector.getFuseConfigByTheme(themeName, false);

            // this._fuseConfigService.config = {
            //     ...theme,
            //     flatTheme,
            //     webFont
            // };

            this._fuseFacadeService.setConfig = {
                ...theme,
                flatTheme,
                webFont
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
        if (environment.production && (!route || route !== 'login') && opener && opener === window) {
            // we will route to login page
            this.routeToLogin();
            return;
        }

        // get the logging agent id
        const agentId = history.state?.agentId || this.agentId;
        // check the agent Id
        if (agentId) {
            if (route !== 'login') {
                const config = await this._appDataService.getJsonConfig(agentId);
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
            } else {
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
        } else {
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
        this._router.navigate([`${route}`], { queryParamsHandling: 'preserve' });
    }

    /**
     * To poll for TMAC events
     */
    private pollForEvent(): void {
        this._appUIService.showSnackbar('Hello, Welcome to Agent Desktop', 'info');

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
