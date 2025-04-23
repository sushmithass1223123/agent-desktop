import { FormControl, FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { SDKClient } from '@tmac/sdk';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

export const initSmpostsSearchState = {
    // Sent
    sentDateFrom: '',
    sentDateTo: '',
    // Draft
    savedDateFrom: '',
    savedDateTo: '',
    // Inbox
    postText: '',
    hasCommentAttachments: 2,
    hasPostAttachments: 2,
    assignedTo: '',
    replied: 2,
    closed: 2,
    assigned: 2,
    startDateFrom: '',
    startDateTo: '',
    queue: '',
    // Queue
    skills: [],
    Channel: 'SM',
    fromDate: yesterday,
    fromTime: `00:00`,
    toDate: today,
    toTime: `${'23'}:${'59'}`,
    // common
    agent: '',
    commentText: '',
    sessionid: '',
    global: '',
    listOfSocialMediaAccounts: [],
    pageSize: 10,
    pageNumber: 1,
    deviceid: '',
    accountName: ''
};

const searchParams = new FormGroup({
    // Sent
    sentDateFrom: new FormControl(initSmpostsSearchState.sentDateFrom),
    sentDateTo: new FormControl(initSmpostsSearchState.sentDateTo),
  
    // Draft
    savedDateFrom: new FormControl(initSmpostsSearchState.savedDateFrom),
    savedDateTo: new FormControl(initSmpostsSearchState.savedDateTo),
  
    // Inbox
    postText: new FormControl(initSmpostsSearchState.postText),
    hasCommentAttachments: new FormControl(initSmpostsSearchState.hasCommentAttachments),
    hasPostAttachments: new FormControl(initSmpostsSearchState.hasPostAttachments),
    assignedTo: new FormControl(initSmpostsSearchState.assignedTo),
    replied: new FormControl(initSmpostsSearchState.replied),
    closed: new FormControl(initSmpostsSearchState.closed),
    assigned: new FormControl(initSmpostsSearchState.assigned),
    startDateFrom: new FormControl(initSmpostsSearchState.startDateFrom),
    startDateTo: new FormControl(initSmpostsSearchState.startDateTo),
    queue: new FormControl(initSmpostsSearchState.queue),
  
    // Queue
    skills: new FormControl(initSmpostsSearchState.skills),
    Channel: new FormControl(initSmpostsSearchState.Channel),
    fromDate: new FormControl(initSmpostsSearchState.fromDate),
    fromTime: new FormControl(initSmpostsSearchState.fromTime),
    toDate: new FormControl(initSmpostsSearchState.toDate),
    toTime: new FormControl(initSmpostsSearchState.toTime),
  
    // Common
    agent: new FormControl(initSmpostsSearchState.agent),
    commentText: new FormControl(initSmpostsSearchState.commentText),
    sessionid: new FormControl(initSmpostsSearchState.sessionid),
    global: new FormControl(initSmpostsSearchState.global),
    listOfSocialMediaAccounts: new FormControl(initSmpostsSearchState.listOfSocialMediaAccounts),
    pageSize: new FormControl(initSmpostsSearchState.pageSize),
    pageNumber: new FormControl(initSmpostsSearchState.pageNumber),
    deviceid: new FormControl(initSmpostsSearchState.deviceid),
    accountName: new FormControl(initSmpostsSearchState.accountName)
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
            globalSearchKey: new FormControl(''),
            defaultEmail: new FormControl(''),
            availableMailboxes: new FormControl([])
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
                const listOfSocialMediaAccounts =
                    res.response.map((email) => {
                        const [mail] = email.split(',');
                        return mail;
                    }) || [];
                this.globalSmpWorkbenchState$.searchParams.patchValue({ listOfSocialMediaAccounts });
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
            listOfSocialMediaAccounts: this.globalSmpWorkbenchState$.availableMailboxes.value
        });
    }
}
