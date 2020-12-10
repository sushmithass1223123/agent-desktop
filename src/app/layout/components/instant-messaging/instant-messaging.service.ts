import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


/**
 * Instant messaging service
 */
@Injectable()
export class InstantMessagingService {
    /**
     * To select a user 
     */
    _userSubject: Subject<string>;

    /**
     * Constructor
     */
    constructor() {
        this._userSubject = new Subject();
    }

    /**
     * To get a user observable
     */
    get getUser(): any | Observable<string> {
        return this._userSubject.asObservable();
    }

    /**
     * To select a user
     * 
     * @param {string} userId
     */
    selectUser(userId: string): void {
        this._userSubject.next(userId);
    }
}
