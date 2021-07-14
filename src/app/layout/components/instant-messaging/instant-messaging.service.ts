import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';

/**
 * Instant messaging service
 */
@Injectable()
export class InstantMessagingService {
    /**
     * To select a user
     */
    private _user$: Subject<string>;

    /**
     * Config subject
     */
    private _config$: ReplaySubject<string>;

    /**
     * Constructor
     */
    constructor() {
        this._user$ = new Subject();
        this._config$ = new ReplaySubject();
    }

    /**
     * To get a user observable
     */
    get getUser(): any | Observable<string> {
        return this._user$.asObservable();
    }

    /**
     * To get a config observable
     */
    get getConfig(): any | Observable<any> {
        return this._config$.asObservable();
    }

    /**
     * To select a user
     *
     * @param {String} agentId
     */
    selectUser(agentId: string): void {
        this._user$.next(agentId);
    }

    /**
     * To pass config between components using this service
     *
     * @param {Any} config
     */
    shareConfig(config: any): void {
        this._config$.next(config);
    }
}
