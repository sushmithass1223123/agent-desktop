import { AppRootConfig } from '@ad/types';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { IResponse, SDKClient, TEnums, TUtils } from '@tmac/sdk';
import { formatJsonData, getFuseConfigByTheme } from 'app/utils';
import { environment } from 'environments/environment';
import { merge } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
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
    private _appConfigSubject: BehaviorSubject<any>;
    /**
     * App version
     */
    private _appVersion: string;

    constructor(
        @Inject(DOCUMENT) private document: any,
        private _titleService: Title,
        private _fuseFacadeService: FuseFacadeService // private _tmacEventService: TMACEventService
    ) {
        // Set the config from the default config
        super('AppDataService');
        this._configSubject = new BehaviorSubject(new Object());
        this._appConfigSubject = new BehaviorSubject(new Object());
        this._appVersion = packageInfo.version;
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

    get config(): any | Observable<AppRootConfig> {
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

        // get the login json from proxy
        const loginJson: IResponse = await TUtils.HttpClient.sendRequest({
            urls: [`${data.ProxyUrl}/GetTmacLoginJson`],
            header: {
                'Content-Type': 'application/json'
            },
            responseType: 'json',
            requestArgs: { id: agentId ? agentId : '' },
            method: 'POST',
            retry: 3
        });

        // parse the json and return
        return loginJson.response ? JSON.parse(loginJson.response.d) : null;
    }

    /**
     * To get development config
     */
    private async getDevelopmentConfig(): Promise<any> {
        // get the config
        const respnse = await fetch(this.devConfigPath);
        return await respnse.json();
    }

    /**
     * To set json config
     */
    private setJsonConfig(config: AppRootConfig): void {
        try {
            // set the title
            if (config.AppConfigs.TitleName) {
                this._titleService.setTitle(config.AppConfigs.TitleName);
            }

            // set the favicon
            if (config.AppConfigs.Logos.Favicon) {
                this.document.getElementById('appFavicon').setAttribute('href', config.AppConfigs.Logos.Favicon);
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
     * To get config for the app
     *
     * @param {string} agentId
     */
    async getJsonConfig(agentId?: string, local?: boolean): Promise<any> {
        let data = null;
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
                let conf = JSON.stringify(data);
                const domain = window.location.hostname || '';
                conf.replaceAll('${domainName}', domain);
                conf = JSON.parse(conf);
                this.config = conf;
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
        const webFont = this._configSubject.getValue().AppConfigs.Font ?? 'wf-muli';
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
}
