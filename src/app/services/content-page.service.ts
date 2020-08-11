import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ContentPageService {

    // Private
    private _viewModeSubject: BehaviorSubject<any>;

    constructor() {
        // Set the config from the default config
        this._viewModeSubject = new BehaviorSubject('');
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set and get the mode
     */
    set mode(value) {
        // Notify the observers
        this._viewModeSubject.next(value);
    }

    get mode(): any | Observable<any> {
        return this._viewModeSubject.asObservable();
    }
}
