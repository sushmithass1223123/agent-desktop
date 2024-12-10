import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { SDKClient } from '@tmac/sdk';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

export const initSmpostsSearchState = {
    fromDate: yesterday,
    fromTime: `00:00`,
    toDate: today,
    toTime: `${'23'}:${'59'}`,
    email: '',
    subject: '',
    content: '',
    skills: '',
    agent: '',
    inSessionId: '',
    deviceid: '',
    hasAttachments: 2,
    assignedTo: '',
    replied: 2,
    closed: 2,
    assigned: 2,
    listOfMailboxes: []
};

const searchParams = new UntypedFormGroup({
    fromDate: new UntypedFormControl(initSmpostsSearchState.fromDate),
    fromTime: new UntypedFormControl(initSmpostsSearchState.fromTime),
    toDate: new UntypedFormControl(initSmpostsSearchState.toDate),
    toTime: new UntypedFormControl(initSmpostsSearchState.toTime),
    email: new UntypedFormControl(initSmpostsSearchState.email),
    subject: new UntypedFormControl(initSmpostsSearchState.subject),
    content: new UntypedFormControl(initSmpostsSearchState.content),
    skills: new UntypedFormControl(initSmpostsSearchState.skills),
    agent: new UntypedFormControl(initSmpostsSearchState.agent),
    inSessionId: new UntypedFormControl(initSmpostsSearchState.inSessionId),
    deviceid: new UntypedFormControl(initSmpostsSearchState.deviceid),
    hasAttachments: new UntypedFormControl(initSmpostsSearchState.hasAttachments),
    assignedTo: new UntypedFormControl(initSmpostsSearchState.assignedTo),
    replied: new UntypedFormControl(initSmpostsSearchState.replied),
    closed: new UntypedFormControl(initSmpostsSearchState.closed),
    assigned: new UntypedFormControl(initSmpostsSearchState.assigned),
    listOfMailboxes: new UntypedFormControl([])
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
            globalSearchKey: new UntypedFormControl(''),
            defaultEmail: new UntypedFormControl(''),
            availableMailboxes: new UntypedFormControl([])
        }
    };
    /**
     * ReadOnly Observable for email workbench state
     */
    readonly globalSmpWorkbenchState$ = this._internal$.email;
    /**
     * Object to hold post data
     */
    postBodies: any = {};
    private _postFromNotification: Subject<any> = new Subject<any>();
    private _switchTabFromNotification: Subject<any> = new Subject<string>();
    private _emittedNotificationData: Subject<any> = new Subject<any>();
    /**
     * Service init method
     */
    async init(): Promise<void> {
        await this.setMailboxes();
    }

    setPostFromNotification(data): void {
        this._postFromNotification.next(data);
    }

    triggerEmittedNotificationData(data): void {
        this._emittedNotificationData.next(data);
    }

    get getEmittedNotificationData(): Observable<any> {
        return this._emittedNotificationData.asObservable();
    }

    get getPostFromNotification(): Observable<any> {
        return this._postFromNotification.asObservable();
    }

    setSwitchTabFromNotification(data): void {
        this._switchTabFromNotification.next(data);
    }

    get getSwitchTabFromNotification(): Observable<any> {
        return this._switchTabFromNotification.asObservable();
    }

    async setMailboxes(): Promise<void> {
        try {
            const res = await SDKClient.getMailboxes('agent', undefined, true);
            if (!res.response) {
                throw new Error(`Invalid Server response ${JSON.stringify(res.response, null, 2)}`);
            }
            if (res.response.length) {
                const listOfMailboxes =
                    res.response.map((email) => {
                        const [mail] = email.split(',');
                        return mail;
                    }) || [];
                this.globalSmpWorkbenchState$.searchParams.patchValue({ listOfMailboxes });
                this.globalSmpWorkbenchState$.defaultEmail.setValue(res.response[0]);
                this.globalSmpWorkbenchState$.availableMailboxes.setValue(res.response);
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Resets email state
     */
    resetPostState(update?: any): void {
        this.globalSmpWorkbenchState$.globalSearchKey.reset();
        this.globalSmpWorkbenchState$.searchParams.setValue({
            ...initSmpostsSearchState,
            ...update,
            listOfMailboxes: this.globalSmpWorkbenchState$.availableMailboxes.value
        });
    }
}
