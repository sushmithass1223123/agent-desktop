import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, shareReplay } from 'rxjs/operators';

/**
 * Content Page Service
 */
@Injectable({
    providedIn: 'root'
})
export class ContentPageService {
    /**
     * View Mode Subject
     * Need More Description
     */
    private _viewModeSubject: BehaviorSubject<string>;

    constructor() {
        // Set the config from the default config
        this._viewModeSubject = new BehaviorSubject('');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter for mode
     */
    set mode(value) {
        // Notify the observers
        this._viewModeSubject.next(value);
    }

    /**
     * Getter for mode
     */
    get mode(): any | Observable<any> {
        return this._viewModeSubject.asObservable();
    }

    /**
     * To get the current page
     */
    getCurrentMode(): string {
        return this._viewModeSubject.getValue();
    }

    /**
     * To get response on all registered view
     *
     * @param {String[]} modes
     */
    getActive(modes: string[]): Observable<string> {
        return this._viewModeSubject.pipe(
            filter((f) => modes.includes(f)),
            shareReplay()
        );
    }
}
