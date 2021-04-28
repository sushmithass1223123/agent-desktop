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
    private _userSubject: Subject<string>;

    /**
     * Config subject
     */
    private _configSubject: ReplaySubject<string>;

    /**
     * Constructor
     */
    constructor() {
        this._userSubject = new Subject();
        this._configSubject = new ReplaySubject();
    }

    /**
     * To get a user observable
     */
    get getUser(): any | Observable<string> {
        return this._userSubject.asObservable();
    }

    /**
     * To get a config observable
     */
    get getConfig(): any | Observable<string> {
        return this._configSubject.asObservable();
    }

    /**
     * To select a user
     * 
     * @param {string} userId
     */
    selectUser(userId: string): void {
        this._userSubject.next(userId);
    }

    /**
     * To pass config between components using this service
     * 
     * @param {Any} config 
     */
    shareConfig(config: any): void {
        this._configSubject.next(config);
    }
}
