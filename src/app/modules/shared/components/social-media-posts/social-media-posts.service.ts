import { FormControl, FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

export const initSmpostsSearchState = {
    fromDate: yesterday,
    fromTime: `00:00`,
    toDate: today,
    toTime: `${'23'}:${'59'}`
};

const searchParams = new FormGroup({
    fromDate: new FormControl(initSmpostsSearchState.fromDate),
    fromTime: new FormControl(initSmpostsSearchState.fromTime),
    toDate: new FormControl(initSmpostsSearchState.toDate),
    toTime: new FormControl(initSmpostsSearchState.toTime)
});

@Injectable({
    providedIn: 'root'
})
export class SocialMediaPostsService {
    /**
     * Internal service state
     */
    private readonly _internal$ = {
        email: {
            searchParams,
            globalSearchKey: new FormControl('')
        }
    };
    /**
     * ReadOnly Observable for email workbench state
     */
    readonly globalEmailWorkbenchState$ = this._internal$.email;

    /**
     * Resets email state
     */
    resetEmailState(update?: any): void {
        this.globalEmailWorkbenchState$.globalSearchKey.reset();
        this.globalEmailWorkbenchState$.searchParams.setValue({
            ...initSmpostsSearchState,
            ...update
        });
    }
}
