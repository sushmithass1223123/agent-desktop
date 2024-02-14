import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    constructor() {}

    private holdMethodSubject = new Subject<void>();
    private transferMethodSubject = new Subject<number>();
    private emailErrorNotifySubject = new Subject<number>();
    private appConfirmDialog = new Subject<void>();

    triggerEmailFailure(interactionId: number) {
        this.emailErrorNotifySubject.next(interactionId);
    }

    getEmailFailure() {
        return this.emailErrorNotifySubject.asObservable();
    }

    triggerHoldMethod() {
        this.holdMethodSubject.next();
    }

    triggerTransferMethod(interactionId: number): void {
        this.transferMethodSubject.next(interactionId);
    }

    getTransferMethod(): Observable<any> {
        return this.transferMethodSubject.asObservable();
    }

    getHoldMethod() {
        return this.holdMethodSubject.asObservable();
    }
    triggerAppConfirmDialogClose(){
        this.appConfirmDialog.next();
    }
    getAppConfirmDialogClose() {
        return this.appConfirmDialog.asObservable();
    }
}

