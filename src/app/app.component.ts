import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { locale as navigationEnglish } from 'app/navigation/i18n/en';
import { locale as navigationTurkish } from 'app/navigation/i18n/tr';
import { navigation } from 'app/navigation/navigation';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IResponse, SDKClient, TEnums, TUtils } from 'tmac-sdk';
import { environment } from '../environments/environment';
import { AppDataService } from './services/app-data.service';

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    fuseConfig: any;
    navigation: any;
    config: any;

    prodConfigPath = 'assets/app-config.json';
    devConfigPath = 'assets/app-config-dev.json';

    loaded = false;

    // Private
    private _unsubscribeAll: Subject<any>;

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): any {
        if (!this.config) {
            return;
        }
        //  Disables refresh (F5, ctrl + r, ctrl + F5)
        if (this.config.AppConfigs.RefreshDisabled) {
            if (event.key.toUpperCase() === 'F5'
                || (event.key.toUpperCase() === 'R' && event.ctrlKey) ||
                (event.key.toUpperCase() === 'F5' && event.ctrlKey)) {
                event.preventDefault();
                return false;
            }
        }
        //  Disabled dev tools (F12, ctrl + shift + c, ctrl + shift + i)
        if (this.config.AppConfigs.DevToolsDisabled) {
            if (event.key.toUpperCase() === 'F12' ||
                (event.key.toUpperCase() === 'C' && event.ctrlKey && event.shiftKey) ||
                (event.key.toUpperCase() === 'I' && event.ctrlKey && event.shiftKey)) {
                event.preventDefault();
                return false;
            }
        }
    }

    /**
     * Constructor
     *
     * @param {DOCUMENT} document
     * @param {FuseConfigService} _fuseConfigService
     * @param {FuseNavigationService} _fuseNavigationService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseSplashScreenService} _fuseSplashScreenService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     * @param {Platform} _platform
     * @param {TranslateService} _translateService
     */
    constructor(
        @Inject(DOCUMENT) private document: any,
        private _fuseConfigService: FuseConfigService,
        private _fuseNavigationService: FuseNavigationService,
        private _fuseSplashScreenService: FuseSplashScreenService,
        private _fuseTranslationLoaderService: FuseTranslationLoaderService,
        private _translateService: TranslateService,
        private _platform: Platform,
        private _titleService: Title,
        private _appDataService: AppDataService,
        private _router: Router,
    ) {
        // Get default navigation
        this.navigation = navigation;

        // Register the navigation to the service
        this._fuseNavigationService.register('main', this.navigation);

        // Set the main navigation as our current navigation
        this._fuseNavigationService.setCurrentNavigation('main');

        // Add languages
        this._translateService.addLangs(['en', 'tr']);

        // Set the default language
        this._translateService.setDefaultLang('en');

        // Set the navigation translations
        this._fuseTranslationLoaderService.loadTranslations(navigationEnglish, navigationTurkish);

        // Use a language
        this._translateService.use('en');

        /**
         * ----------------------------------------------------------------------------------------------------
         * ngxTranslate Fix Start
         * ----------------------------------------------------------------------------------------------------
         */

        /**
         * If you are using a language other than the default one, i.e. Turkish in this case,
         * you may encounter an issue where some of the components are not actually being
         * translated when your app first initialized.
         *
         * This is related to ngxTranslate module and below there is a temporary fix while we
         * are moving the multi language implementation over to the Angular's core language
         * service.
         */

        // Set the default language to 'en' and then back to 'tr'.
        // '.use' cannot be used here as ngxTranslate won't switch to a language that's already
        // been selected and there is no way to force it, so we overcome the issue by switching
        // the default language back and forth.
        /**
         * setTimeout(() => {
         * this._translateService.setDefaultLang('en');
         * this._translateService.setDefaultLang('tr');
         * });
         */

        /**
         * ----------------------------------------------------------------------------------------------------
         * ngxTranslate Fix End
         * ----------------------------------------------------------------------------------------------------
         */

        // Add is-mobile class to the body if the platform is mobile
        if (this._platform.ANDROID || this._platform.IOS) {
            this.document.body.classList.add('is-mobile');
        }

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // do not load config for preview page
        if (this._router.url === '/preview') {
            return;
        }

        // Get the app config
        this.getConfig();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {

                this.fuseConfig = config;

                // Boxed
                if (this.fuseConfig.layout.width === 'boxed') {
                    this.document.body.classList.add('boxed');
                }
                else {
                    this.document.body.classList.remove('boxed');
                }

                // Color theme - Use normal for loop for IE11 compatibility
                // tslint:disable-next-line: prefer-for-of
                for (let i = 0; i < this.document.body.classList.length; i++) {
                    const className = this.document.body.classList[i];

                    if (className.startsWith('theme-')) {
                        this.document.body.classList.remove(className);
                    }
                }

                this.document.body.classList.add(this.fuseConfig.colorTheme);
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private async getConfig(): Promise<any> {
        let data = null;
        try {
            // check the environment and load config
            if (environment.production) {
                // get the config from server for production
                data = await this.getProductionConfig();
                TUtils.Logger.console('info', 'App config loaded');
            }
            else {
                // get the config from local for developement
                data = await this.getDevelopementConfig();
                TUtils.Logger.console('info', 'App config loaded', data);
            }

            // set the config to service
            if (data) {
                this._appDataService.config = data;
            }

        } catch (error) {
            TUtils.Logger.log('Exception in AppComponent.getConfig', error);
        }
        // set the loaded flag to true
        this.loaded = true;
        // set the TMAC config
        this.setTMACConfig(data);
    }

    private async getProductionConfig(): Promise<any> {
        // get the config
        const respnse = await fetch(this.prodConfigPath);
        // get the json response
        const data = await respnse.json();

        // check if the config is empty or null
        if (data === null || Object.keys(data).length === 0) {
            return null;
        }

        // set the app config to service
        if (data) {
            this._appDataService.appConfig = data;
        }

        // get the login json from proxy
        const loginJson: IResponse = await TUtils.HttpClient.sendRequest({
            url: `${data.ProxyUrl}/GetTmacLoginJson`,
            requestArgs: { id: '' },
            method: 'POST'
        });

        // parse the json and return
        return loginJson.response ? JSON.parse(loginJson.response.d) : null;
    }

    private async getDevelopementConfig(): Promise<any> {
        // get the config
        const respnse = await fetch(this.devConfigPath);
        return await respnse.json();
    }

    private setTMACConfig(config: any): void {
        // check if the config is null
        if (config !== null) {
            // set the title
            if (config.AppConfigs.TitleName) {
                this._titleService.setTitle(config.AppConfigs.TitleName);
            }
            // set the favicon
            if (config.AppConfigs.Logos.Favicon) {
                this.document.getElementById('appFavicon').setAttribute('href', config.AppConfigs.Logos.Favicon);
            }

            // set the SDK config
            SDKClient.setConfig({
                proxy: {
                    urls: config.AppConfigs.SDK.Proxy.Urls || '',
                    type: config.AppConfigs.SDK.Proxy.Type || TEnums.ProxyType.SOAP,
                    timeout: config.AppConfigs.SDK.Proxy.Timeout || 30000
                },
                signalRProxy: {
                    logging: config.AppConfigs.SDK.SignalRProxy.Logging || false,
                    protocol: config.AppConfigs.SDK.SignalRProxy?.Protocol,
                    timeout: config.AppConfigs.SDK.SignalRProxy.Timeout || 30
                },
                logging: {
                    enabled: config.AppConfigs.SDK.Logging.Enabled || false,
                    remote: config.AppConfigs.SDK.Logging.Remote || false,
                    remoteThreshold: config.AppConfigs.SDK.Logging.RemoteThreshold || 15
                },
                customScripts:
                    [...config.AppConfigs.SDK.CustomSripts]
            });
        }
        else {
            // we will route to not-found page
            this._router.navigate(['not-found'],
                {
                    queryParamsHandling: 'preserve',
                    preserveFragment: true,
                    state: {
                        subtitle: 'Oops',
                        title: '',
                        description: 'Config is not found, please contact administrator!',
                        login: false
                    }
                });
        }
    }

}
