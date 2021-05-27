import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { IResponse, SDKClient, TEnums, TUtils } from '@tmac/sdk';
import { getFuseConfigByTheme } from 'app/utils';
import { environment } from 'environments/environment';
import { merge } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { version } from '../../../package.json';
import { FuseFacadeService } from './fuse-facade.service';

/**
 * Service to inject the data for widget from App config json
 */
@Injectable({
    providedIn: 'root'
})
export class AppDataService {
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
    /**
     * Need more Description
     */
    private _postMessageSubject: Subject<any>;

    constructor(
        @Inject(DOCUMENT) private document: any,
        private _titleService: Title,
        private _fuseFacadeService: FuseFacadeService // private _tmacEventService: TMACEventService
    ) {
        // Set the config from the default config
        this._configSubject = new BehaviorSubject(new Object());
        this._appConfigSubject = new BehaviorSubject(new Object());
        this._postMessageSubject = new Subject();
        this._appVersion = version;
        this.registerToPostMessage();
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

    get config(): any | Observable<any> {
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

    /**
     * Get PostMessages
     */
    get postMessage(): any | Observable<any> {
        return this._postMessageSubject.asObservable();
    }

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
            TUtils.Logger.console('info', 'Config mode=local, load config from development.json');
            // get the config from local for development
            return await this.getDevelopmentConfig();
        }

        TUtils.Logger.console('info', 'Config mode=remote, load config from server');

        // get the login json from proxy
        const loginJson: IResponse = await TUtils.HttpClient.sendRequest({
            url: `${data.ProxyUrl}/GetTmacLoginJson`,
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
    private setJsonConfig(config: any): void {
        try {
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
                customScripts: [...config.AppConfigs.SDK.CustomSripts]
            });
        } catch (error) {
            TUtils.Logger.console('error', 'Exception in AppDataService.setJsonConfig', null, error);
        }
    }

    /**
     * To register to post message
     */
    private registerToPostMessage(): void {
        try {
            window.addEventListener(
                'message',
                (evt: any) => {
                    // if event data is null then return
                    if (!evt.data) {
                        return;
                    }

                    let data: any = {};
                    if (typeof evt.data === 'string') {
                        try {
                            data = JSON.parse(evt.data);
                        } catch (error) {
                            data = {};
                        }
                    } else if (typeof evt.data === 'object') {
                        data = evt.data;
                    }

                    // check if destination is tmac
                    if (data.destination?.toLowerCase() === 'tmac') {
                        // notify the observers
                        this._postMessageSubject.next(data);
                    }
                },
                false
            );
        } catch (error) {
            TUtils.Logger.console('error', 'Exception in registerToPostMessage', null, error);
        }
    }

    /**
     * To get config for the app
     *
     * @param {string} agentId
     */
    async getJsonConfig(agentId?: string): Promise<any> {
        let data = null;
        try {
            // check the environment and load config
            if (environment.production) {
                // get the config from server for production
                data = await this.getProductionConfig(agentId);
                TUtils.Logger.console('info', 'Production config loaded');
            } else {
                // get the config from local for development
                data = await this.getDevelopmentConfig();
                TUtils.Logger.console('info', 'Development config loaded', data);
            }

            // set the config to service
            if (data) {
                let conf = JSON.stringify(data);
                const domain = window.location.hostname || '';
                conf.replaceAll('${domainName}', domain);
                conf = JSON.parse(conf);
                this.config = conf;
                this.setJsonConfig(data);
                return {
                    ...data,
                    ConfigMode: this._appConfigSubject.getValue().ConfigMode
                };
            }
        } catch (error) {
            TUtils.Logger.console('error', 'Exception in AppDataService.getJsonConfig', null, error);
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
        const themeName = this._configSubject.getValue().AppConfigs.Theme || '';
        const webFont = this._configSubject.getValue().AppConfigs.Font || 'wf-muli';
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
}
