import { FormControl, FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { SDKClient } from '@tmac/sdk';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

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

const searchParams = new FormGroup({
    fromDate: new FormControl(initSmpostsSearchState.fromDate),
    fromTime: new FormControl(initSmpostsSearchState.fromTime),
    toDate: new FormControl(initSmpostsSearchState.toDate),
    toTime: new FormControl(initSmpostsSearchState.toTime),
    email: new FormControl(initSmpostsSearchState.email),
    subject: new FormControl(initSmpostsSearchState.subject),
    content: new FormControl(initSmpostsSearchState.content),
    skills: new FormControl(initSmpostsSearchState.skills),
    agent: new FormControl(initSmpostsSearchState.agent),
    inSessionId: new FormControl(initSmpostsSearchState.inSessionId),
    deviceid: new FormControl(initSmpostsSearchState.deviceid),
    hasAttachments: new FormControl(initSmpostsSearchState.hasAttachments),
    assignedTo: new FormControl(initSmpostsSearchState.assignedTo),
    replied: new FormControl(initSmpostsSearchState.replied),
    closed: new FormControl(initSmpostsSearchState.closed),
    assigned: new FormControl(initSmpostsSearchState.assigned),
    listOfMailboxes: new FormControl([])
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
    // Add these properties to the SocialMediaPostsService class
private _customerDataSubject = new BehaviorSubject<{[key: string]: any}>({});
public customerData$ = this._customerDataSubject.asObservable();
constructor(
    // Add HttpClient to constructor
    private _httpClient: HttpClient,
    // ... other existing parameters
) {
    // Existing constructor code
}
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
/**
 * Fetches customer details from Media Matrix API
 * @param customerId The customer ID to fetch details for
 * @param apiUrl Base API URL from configuration
 * @param viewMethodName View method name from configuration
 */
public fetchCustomerDetails(customerId: string, apiUrl: string, viewMethodName: string): Promise<any> {
    if (!customerId || !apiUrl || !viewMethodName) {
        return Promise.resolve(null);
    }

    // Check if we already have this customer data cached
    const existingData = this._customerDataSubject.getValue()[customerId];
    if (existingData) {
        return Promise.resolve(existingData);
    }

    const fullApiUrl = `${apiUrl}${viewMethodName}${customerId}`;
    
    return this._httpClient.post(fullApiUrl, {})
        .pipe(
            map((response: any) => {
                if (response?.errCode === 0 && response?.errMsg === "Success" && response?.data) {
                    // Update the cache with the new customer data
                    const currentData = this._customerDataSubject.getValue();
                    currentData[customerId] = response.data;
                    this._customerDataSubject.next(currentData);
                    return response.data;
                }
                return null;
            }),
            catchError(error => {
                console.error('Error fetching customer details:', error);
                return Promise.resolve(null);
            })
        ).toPromise();
}

/**
 * Get customer name for a given customer ID
 * @param customerId The customer ID
 */
public getCustomerName(customerId: string): string {
    const customerData = this._customerDataSubject.getValue()[customerId];
    if (customerData?.customerName) {
        return customerData.customerName;
    }
    return customerId; // Fall back to ID if name not available
}

/**
 * Get customer initials based on customer name
 * @param customerId The customer ID
 */
public getCustomerInitials(customerId: string): string {
    const customerName = this.getCustomerName(customerId);
    
    // If the name is just the ID (numeric), return a generic initial
    if (customerName === customerId && /^\d+$/.test(customerId)) {
        return 'CU'; // Customer
    }
    
    return customerName
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
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
