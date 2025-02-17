import { AppRootConfig } from '@ad/types';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { NavigationExtras, Router } from '@angular/router';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { IResponse, SDKClient, TEnums, TUtils } from '@tmac/sdk';
import { AppConfigsModel, LoginWidgetModel } from 'app/models';
import { formatJsonData, getFuseConfigByTheme } from 'app/utils';
import { environment } from 'environments/environment';
import { merge } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import packageInfo from '../../../package.json';
import { FuseFacadeService } from './fuse-facade.service';

/**
 * Service to inject the data for widget from App config json
 */
@Injectable({
    providedIn: 'root'
})
export class AppDataService extends SharedWrapper {
    /**
     * Production conofig path
     */
    prodConfigPath = 'assets/production.json';
    /**
     * Dev config path
     */
    devConfigPath = 'assets/development.json';
    /**
     * Need more Description
     */
    private _configSubject: BehaviorSubject<any>;
    /**
     * App Config Json subject
     */
    private _appConfigSubject: BehaviorSubject<AppRootConfig>;
    /**
     * App version
     */
    private _appVersion: string;
    /**
     * 
    To detect label config errors
    */
   appLabelSubject = new Subject();

   appLabelError: any;

   private externalAVWidgetOTP: string | number;

    constructor(
        @Inject(DOCUMENT) private document: any,
        private _titleService: Title,
        private _fuseFacadeService: FuseFacadeService, // private _tmacEventService: TMACEventService
        private _router: Router,
        private _domSanitizer: DomSanitizer,
    ) {
        // Set the config from the default config
        super('AppDataService');
        this._configSubject = new BehaviorSubject(new Object());
        this._appConfigSubject = new BehaviorSubject(new Object()) as BehaviorSubject<AppRootConfig>;
        this._appVersion = packageInfo.version;
        this.externalAVWidgetOTP = '';
    }

    set setExternalAVWidgetOTP(otp: string | number) {
        this.externalAVWidgetOTP = otp;
    }

    get getExternalAVWidgetOTP(): string | number {
        return this.externalAVWidgetOTP;
    }

    /**
     * Method to get specific widget data
     * @param obj Full configuration
     * @param targetType Target widget type
     * @returns Requested widget data
     */
    public findWidgetDataByType(obj: any, targetType: any): any {
        try {
            if (!obj) return null;

            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const result = this.findWidgetDataByType(item, targetType);
                    if (result) return result;
                }
            } else if (typeof obj === 'object') {
                if (obj.Type === targetType) {
                    return obj.Data;
                }
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const result = this.findWidgetDataByType(obj[key], targetType);
                        if (result) return result;
                    }
                }
            }
            return null;
        } catch (ex) {
            console.error(ex);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set and Get the config
     */
    set config(value) {
        // Get the value from the behavior subject
        let config = this._configSubject.getValue();

        // Merge the new config
        config = merge({}, config, value);

        // Notify the observers
        this._configSubject.next(config);
    }

    get config(): Observable<AppRootConfig> {
        return this._configSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------

    /**
     * Set and Get the appConfig
     */
    set appConfig(value) {
        // Get the value from the behavior subject
        let config = this._appConfigSubject.getValue();

        // Merge the new config
        config = merge({}, config, value);

        // Notify the observers
        this._appConfigSubject.next(config);
    }

    /**
     * Get App Config
     */
    get appConfig(): any | Observable<any> {
        return this._appConfigSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------

    /**
     * To get production config
     *
     * @param {string} agentId
     */
    private async getProductionConfig(agentId?: string): Promise<any> {
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
            this.appConfig = data;
        }

        // check the config mode
        if (data.ConfigMode === 'local') {
            this.logger.info('Config mode=local, load config from development.json', false);
            // get the config from local for development
            return await this.getDevelopmentConfig();
        }

        this.logger.info('Config mode=remote, load config from server', false);

        const proxyURLs =  data.ProxyUrl?.split(',');
        let loginJson: IResponse;

        // get the login json from proxy
        for (let index = 0; index < proxyURLs.length; index++) {
            try{
                loginJson = await TUtils.HttpClient.sendRequest({
                    urls: [`${proxyURLs[index]}/GetTmacLoginJson`],
                    header: {
                        'Content-Type': 'application/json'
                    },
                    responseType: 'json',
                    requestArgs: { id: agentId ? agentId : '' },
                    method: 'POST',
                    retry: 3,
                });
                if(loginJson.response) {
                    break;
                }
            } catch(e) {
                console.log('Erro occured on executing', proxyURLs[index]);
            }
        }
        this.logger.info(JSON.stringify(loginJson), true);
        // parse the json and return
        return loginJson.response ? JSON.parse(loginJson.response.d) : null;
    }

    /**
     * To get development config
     */
    private async getDevelopmentConfig(): Promise<AppRootConfig> {
        // get the config
        const respnse = await fetch(this.devConfigPath);
        return await respnse.json();
    }
    /**
     * Method to modify / validate dynamic widgets config
     * @param {any} config
     */
    validateDynamicWidgets(config: any) {
        try {
            if(config?.Main?.Content?.Widgets?.length) {
                config.Main.Content.Widgets.forEach((Widget: any) => {
                    if(Widget?.Data?.Widgets?.Dynamic?.length) {
                        let hasNoStaticWidgets = Boolean(Widget?.Data?.Widgets?.Static?.length);
                        Widget.Data.Widgets.Dynamic.forEach((WidgetDynamic: any) => {
                            WidgetDynamic.Config.HasNoStaticWidgets = !hasNoStaticWidgets;
                        });
                    }
                });
            }
        } catch (e) {
           console.error(e)
        }
    }
    /**
     * To set json config
     */
    private setJsonConfig(config: AppRootConfig): void {
        try {
            this.validateDynamicWidgets(config);
            // set the title
            if (config.AppConfigs.TitleName) {
                this._titleService.setTitle(config.AppConfigs.TitleName);
            }

            // set the favicon
            if (config.AppConfigs?.Logos?.Favicon) {
                this.document.getElementById('appFavicon').setAttribute('href', this.transformResourceURL(config.AppConfigs.Logos.Favicon));
            }

            // check the casing of SDK properties if smaller case then append directly
            // NOTE:: we need to have backward compatibility for few versions so keep the Pascal case code
            if (typeof config.AppConfigs.SDK.proxy === 'object') {
                // set the SDK config
                SDKClient.setConfig(config.AppConfigs.SDK);
                return;
            }

            this.logger.warn(
                'AppConfigs.SDK accepts camel casing to support TMAC SDK case, please change to camel casing as per relase [5.0.6.30]!',
                false
            );

            // backward compatibility for CustomScripts
            let customScripts = [];
            if (Array.isArray(config.AppConfigs.SDK.CustomSripts)) {
                customScripts = config.AppConfigs.SDK.CustomSripts;
                this.logger.warn('AppConfigs.SDK.CustomSripts is depricated, please correct the spelling in config to -> CustomScripts', false);
            } else {
                customScripts = config.AppConfigs.SDK.CustomScripts;
            }

            // set the SDK config
            SDKClient.setConfig({
                proxy: {
                    urls: config.AppConfigs.SDK.Proxy.Urls || [],
                    type: config.AppConfigs.SDK.Proxy.Type || TEnums.ProxyType.SOAP,
                    timeout: config.AppConfigs.SDK.Proxy.Timeout || 30000
                },
                signalRProxy: {
                    enabled: config.AppConfigs.SDK.SignalRProxy.enabled ?? true,
                    logging: config.AppConfigs.SDK.SignalRProxy.Logging ?? false,
                    protocol: config.AppConfigs.SDK.SignalRProxy?.Protocol,
                    timeout: config.AppConfigs.SDK.SignalRProxy.Timeout || 30,
                    fallback: config.AppConfigs.SDK.SignalRProxy.Fallback ?? true
                },
                logging: {
                    enabled: config.AppConfigs.SDK.Logging.Enabled ?? false,
                    level: {
                        debug: config.AppConfigs.SDK.Logging.Level?.Debug ?? false,
                        info: config.AppConfigs.SDK.Logging.Level?.Info ?? false,
                        warn: config.AppConfigs.SDK.Logging.Level?.Warn ?? false,
                        error: config.AppConfigs.SDK.Logging.Level?.Error ?? false
                    },
                    remote: {
                        enabled: config.AppConfigs.SDK.Logging.Remote?.Enabled ?? false,
                        timeout: config.AppConfigs.SDK.Logging.Remote?.Timeout || 30,
                        count: config.AppConfigs.SDK.Logging.Remote?.Count || 10
                    },
                    sdkMethods: config.AppConfigs.SDK.Logging.SDKMethods ?? false,
                    sdkEvents: config.AppConfigs.SDK.Logging.SDKEvents ?? false
                },
                customScripts: [...customScripts]
            });
        } catch (error) {
            this.logger.error('Error in setJsonConfig', error, false);
        }
    }

    /**
     * method to sanitize URL
     * @param url - external url / path to a file
     * @returns sanitized url in string format
     */
    transformResourceURL(url: string): any {
        return this._domSanitizer.sanitize(SecurityContext.RESOURCE_URL, this._domSanitizer.bypassSecurityTrustResourceUrl(url));
    }

    /**
     * To get config for the app
     *
     * @param {string} agentId
     */
    async getJsonConfig(agentId?: string, local?: boolean): Promise<AppRootConfig> {
        let data: AppRootConfig = null;
        try {
            // check the environment and load config
            if (!local && environment.production) {
                // get the config from server for production
                data = await this.getProductionConfig(agentId);
                this.logger.info('Production config loaded', false);
                console.log(data);
            } else {
                // get the config from local for development
                data = await this.getDevelopmentConfig();
                this.logger.info('Development config loaded', false);
                console.log(data);
            }

            // set the config to service
            if (data) {
                // apply the defaults to make sure no undefined exception
                data.Login = merge({}, new LoginWidgetModel(), data.Login);
                data.AppConfigs = merge({}, new AppConfigsModel(), data.AppConfigs);

                let conf = JSON.stringify(data);
                const domain = window.location.hostname || '';
                conf.replaceAll('${domainName}', domain);
                conf = JSON.parse(conf);
                this.config = conf as any;
                this.setJsonConfig(data);
                this.setTheme();
                return {
                    ...data,
                    ConfigMode: this._appConfigSubject.getValue().ConfigMode
                };
            }
        } catch (error) {
            this.logger.error('Error in getJsonConfig', error, false);
        }
        return null;
    }

    /**
     * To get app version
     *
     * @returns {String} app version
     */
    getAppVersion(): string {
        return this._appVersion;
    }

    /**
     * Set the app config
     */
    setTheme(): void {
        // apply the theme
        const themeName = this._configSubject.getValue().AppConfigs.Theme ?? '';
        const webFont = this._configSubject.getValue().AppConfigs.Font ?? 'wf-roboto';
        const flatTheme = this._configSubject.getValue().AppConfigs.FlatTheme ?? false;
        if (themeName) {
            const theme = getFuseConfigByTheme(themeName, false);
            this._fuseFacadeService.setConfig = {
                ...theme,
                flatTheme,
                webFont
            };
        }
    }

    /**
     * Gets app specific keys from app config
     *
     * @param {Record<string , string>} json
     * @returns {Observable<Partial<AppRootConfig>>}
     */
    public getConfig(json?: Record<string, string>): Observable<Partial<AppRootConfig> | any> {
        if (json) {
            return this._configSubject.pipe(map((conf) => formatJsonData(conf, json)));
        }
        return this._configSubject;
    }

    /**
     * Route to a path
     *
     * @param commands
     * @param extras
     */
    public routeToPath(commands: any[], extras?: NavigationExtras) {
        // check if the route is to login page
        if (commands.some((s) => s.includes('login'))) {
            // check if any logout Url is configured
            const logoutUrl = this._configSubject.value?.Login?.LogoutUrl;
            if (logoutUrl) {
                // route to logout url
                location.href = logoutUrl;
                return;
            }
        }
        this._router.navigate(commands, extras);
    }

    getUpdatedLabel(msg, labels = []) {
        let updatedLabel = msg;
        labels?.forEach(ele => {
            updatedLabel = updatedLabel.replace(ele.key,ele.value);
        });
        return updatedLabel;
    }

    public observeAppLabelErrors(): Observable<any>{
      return  this.appLabelSubject.asObservable();
    }

    public getErrorInAppLabels(){
        return  this.appLabelError;
    }
  
      public setErrorInAppLabels(error) {
          this.appLabelError = error;
      }

}
