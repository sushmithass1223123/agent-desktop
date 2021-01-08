import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { environment } from 'environments/environment';
import { merge } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { IResponse, SDKClient, TEnums, TUtils } from 'tmac-sdk';

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

    constructor(@Inject(DOCUMENT) private document: any, private _titleService: Title) {
        // Set the config from the default config
        this._configSubject = new BehaviorSubject(new Object());
        this._appConfigSubject = new BehaviorSubject(new Object());
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
     * To get config for the app
     *
     * @param {string} agentId
     */
    async getConfig(agentId?: string): Promise<any> {
        let data = null;
        try {
            // check the environment and load config
            if (environment.production) {
                // get the config from server for production
                data = await this.getProductionConfig(agentId);
                TUtils.Logger.console('info', 'App config loaded');
            } else {
                // get the config from local for development
                data = await this.getDevelopmentConfig();
                TUtils.Logger.console('info', 'App config loaded', data);
            }

            // set the config to service
            if (data) {
                this.config = data;
                this.setAppConfig(data);
                return data;
            }
        } catch (error) {
            TUtils.Logger.log('Exception in AppDataService.getConfig', error);
        }
        return null;
    }

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
     * To set app config
     */
    private setAppConfig(config: any): void {
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
                enabled: config.AppConfigs.SDK.SignalRProxy.enabled || true,
                logging: config.AppConfigs.SDK.SignalRProxy.Logging || false,
                protocol: config.AppConfigs.SDK.SignalRProxy?.Protocol,
                timeout: config.AppConfigs.SDK.SignalRProxy.Timeout || 30,
                fallback: false
            },
            logging: {
                enabled: config.AppConfigs.SDK.Logging.Enabled || false,
                remote: config.AppConfigs.SDK.Logging.Remote || false,
                remoteThreshold: config.AppConfigs.SDK.Logging.RemoteThreshold || 15
            },
            customScripts: [...config.AppConfigs.SDK.CustomSripts]
        });
    }
}
