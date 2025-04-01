import { DOCUMENT } from '@angular/common';
import { AfterContentInit, Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { SDKClient } from '@tmac/sdk';
import { AUX_STATUSES } from 'app/constants';
import { environment } from 'environments/environment';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';

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
    customFuse$: any;
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
    agentIdRouteParam: string;
    /**
     * Query params
     */
    queryParams: Params;
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
        /**
         * Check if window is being refreshed on re-login request on agent's consent.
         * if Yes then do not restrict at browser level
         */
         if(this._appUIService._reloginTriggered) {
            return true;
        }

        if (environment.production) {
            event?.preventDefault();
            return false;
        }
        return true;
    }

    appLabelsError;

    /**
     * Constructor
     */
    constructor(
        @Inject(DOCUMENT) private document: any,
        private _fuseFacadeService: FuseFacadeService,
        private _appDataService: AppDataService,
        private _fuseSidebarService: FuseSidebarService,
        private _appUIService: AppUiService,
        private _agentFeaturesService: AgentFeaturesService,
        private _tmacEventService: TMACEventService,
        private _interactionManagerService: InteractionManagerService,
        private _activatedRouter: ActivatedRoute,
        private _titleService: Title,
        private _fuseSplashService: FuseSplashScreenService,
        private translocoService: TranslocoService
    ) {
        this._appDataService.observeAppLabelErrors().subscribe(data => {
            this.appLabelsError = data;
            this._appDataService.setErrorInAppLabels(data);
        });

        this.customFuse$ = this._fuseFacadeService.getConfig({ layoutStyle: 'layout.style' });
        // set the private defaults
        this._unsubscribeAll = new Subject();

        // subscribe to _activatedRouter for loging agent id
        this._activatedRouter.paramMap.subscribe((paramMap) => {
            if (paramMap.has('agentId')) {
                this.agentIdRouteParam = paramMap.get('agentId');
            }
        });

        // subscribe to _activatedRouter for query params
        this._activatedRouter.queryParams.subscribe((params) => {
            this.queryParams = params;
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this._fuseSplashService.hide();
        // subscribe to TMACEventService and InteractionManagerService
        this._tmacEventService.subscribe();
        this._interactionManagerService.subscribe();

        // subscribe to app changes
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            if (Object.keys(config).length) {
                this.appConfig = config;
                this._appDataService.setTheme();
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
        // unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // unsubscribe from TMACEventService and InteractionManagerService
        this._tmacEventService.unsubscribe();
        this._interactionManagerService.unsubscribe();

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
        this._activatedRouter.queryParams
            .pipe(
                takeUntil(this._unsubscribeAll),
                // delay(2000),
                // continue only if userId present
                filter((params) => params['state']),
                map((params) => params['state'].toLowerCase())
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
     * To verify the login
     */
    private async checkLogin(): Promise<any> {
        // get the route history
        const route = history.state?.routeFrom;
        // for production build if the main url is opened directly route to login page
        if (!this.queryParams['msTeams'] && environment.production && (!route || route !== 'login') && (!opener || opener === window)) {
            // we will route to login page
            this.routeToLogin();
            return;
        }

        // get the logging agent id
        const agentId = history.state?.agentId ?? this.agentIdRouteParam;
        // check the agent Id
        if (agentId) {
            if (route !== 'login') {
                const config = await this._appDataService.getJsonConfig(agentId);

                // if the json is not proper then route to not-found page
                if (!config) {
                    // we will route to error page
                    this._appDataService.routeToPath(['not-found'], {
                        state: {
                            subtitle: 'Oops',
                            title: '404',
                            description: this.translocoService.translate('mainComponent.loadConfigFailed'),
                            login: false
                        },
                        queryParamsHandling: 'preserve'
                    });
                    return;
                }

                this.appConfig = config;
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

        // added during upgrade to Angular Material 18 since history.state contained login redirected [routedFrom] data even when reloaded.
        history.replaceState({}, '');
    }

    /**
     * Route to login
     */
    private routeToLogin(): void {
        // we will route to login page
        this._appDataService.routeToPath([`login${this.agentIdRouteParam ? '/' + this.agentIdRouteParam : ''}`]);
    }

    /**
     * To poll for TMAC events
     */
    private pollForEvent(): void {
        this._appUIService.showSnackbar(this.translocoService.translate('mainComponent.welcomeMsg'), 'info');

        // set the loaded to true
        this.loaded = true;

        // process the agent features
        this._agentFeaturesService.subscribe();

        // register for get events
        SDKClient.getEvents();

        this._appUIService.checkForDisplayResolution();
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
