import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to inject the data for widget from App config json
 */
@Injectable({
    providedIn: 'root'
})
export class AppDataService {

    /**
     * Need more Description
     */
    private _configSubject: BehaviorSubject<any>;
    /**
     * App Config Json subject
     */
    private _appConfigSubject: BehaviorSubject<any>;

    constructor() {
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
        config = _.merge({}, config, value);

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
        config = _.merge({}, config, value);

        // Notify the observers
        this._appConfigSubject.next(config);
    }

    /**
     * Get App Config
     */
    get appConfig(): any | Observable<any> {
        return this._appConfigSubject.asObservable();
    }
}
