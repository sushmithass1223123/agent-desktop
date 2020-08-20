import { Injectable } from '@angular/core';
import { ILoginData } from 'app/interfaces';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AppDataService {
    // Private
    private _configSubject: BehaviorSubject<any>;
    private _loginData: ILoginData;

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

    setLoginData(data: ILoginData): void {
        // check if the data is privided
        if (data) {
            this._loginData = data;
            console.log('Login data binded successfully', data);
        }
    }

    getLoginData(): ILoginData {
        // check if the data is there
        if (this._loginData) {
            return { ...this._loginData };
        }
        return null;
    }
}
