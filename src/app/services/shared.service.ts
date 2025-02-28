import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
    providedIn: 'root'
})
export class SharedService {
    constructor() {}

    private holdMethodSubject = new Subject<void>();
    private changeStatusSubject = new Subject<any>();
    private tabSelect = new Subject<string>();
    private emailErrorNotifySubject = new Subject<number>();
    private appConfirmDialog = new Subject<void>();
    private whiteboardOpenSubject = new BehaviorSubject<boolean>(false);
    whiteboardOpen$ = this.whiteboardOpenSubject.asObservable();

    triggerTabSelect(tabPath: string) {
        this.tabSelect.next(tabPath);
    }

    getTabSelectTrigger(): Observable<string> {
        return this.tabSelect.asObservable();
    }

    triggerEmailFailure(interactionId: number) {
        this.emailErrorNotifySubject.next(interactionId);
    }
    
    triggerChangeStatus(auxData: any): void {
    this.changeStatusSubject.next(auxData);
    }

    getChangeStatus(): Observable<any> {
    return this.changeStatusSubject.asObservable();
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
    triggerAppConfirmDialogClose(){
        this.appConfirmDialog.next();
    }
    getAppConfirmDialogClose() {
        return this.appConfirmDialog.asObservable();
    }
    setWhiteboardState(open: boolean) {
        this.whiteboardOpenSubject.next(open);
      }
}

