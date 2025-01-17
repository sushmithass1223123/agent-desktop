import { Injectable } from '@angular/core';
import { MediaChange, MediaObserver } from 'ngx-flexible-layout';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class FuseMatchMediaService {
    activeMediaQuery: string;
    onMediaChange: BehaviorSubject<string> = new BehaviorSubject<string>('');

    /**
     * Constructor
     *
     * @param {MediaObserver} _mediaObserver
     */
    constructor(private _mediaObserver: MediaObserver) {
        // Set the defaults
        this.activeMediaQuery = '';

        // Initialize
        this._init();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Initialize
     *
     * @private
     */
    private _init(): void {
        // this._mediaObserver.media$.pipe(debounceTime(500), distinctUntilChanged()).subscribe((change: MediaChange) => {
        //     if (this.activeMediaQuery !== change.mqAlias) {
        //         this.activeMediaQuery = change.mqAlias;
        //         this.onMediaChange.next(change.mqAlias);
        //     }
        // });

        this._mediaObserver.asObservable().pipe(
            // Optionally use operators like map to transform the MediaChange object
            map((changes: MediaChange[]) => changes[0].mqAlias) // Get the alias of the first media query
          ).subscribe((alias: string) => {
            // React to the media query change (alias can be 'xs', 'sm', 'md', 'lg', etc.)
            this.activeMediaQuery = alias;
            if (this.activeMediaQuery !== alias) {
                        this.activeMediaQuery = alias;
                        this.onMediaChange.next(alias);
            }
          });
    }
}
