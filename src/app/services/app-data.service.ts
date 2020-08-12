import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as _ from 'lodash';

@Injectable({
    providedIn: 'root'
})
export class AppDataService {
    // Private
    private _configSubject: BehaviorSubject<any>;

    constructor() {
        // Set the config from the default config
        this._configSubject = new BehaviorSubject(new Object());
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set and get the config
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
}
