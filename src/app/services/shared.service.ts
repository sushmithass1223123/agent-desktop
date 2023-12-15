import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    constructor() {}

    private holdMethodSubject = new Subject<void>();
    private emailErrorNotifySubject = new Subject<number>();

    triggerEmailFailure(interactionId: number) {
        this.emailErrorNotifySubject.next(interactionId);
    }

    getEmailFailure() {
        return this.emailErrorNotifySubject.asObservable();
    }

    triggerHoldMethod() {
        this.holdMethodSubject.next();
    }

    getHoldMethod() {
        return this.holdMethodSubject.asObservable();
    }
}
