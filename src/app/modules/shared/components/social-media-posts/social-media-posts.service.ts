import { FormControl, FormGroup } from '@angular/forms';
import { Injectable, Input } from '@angular/core';
import { SDKClient } from '@tmac/sdk';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import moment from 'moment'; // Ensure this is imported
import { HttpClient } from '@angular/common/http';
import { TwCustomerInfo,TwSmmCustomerDetails } from '@ad/types';
import { IWidget } from 'app/interfaces';



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
    listOfMailboxes: [],
    SocialMediaAPIs: [
        "https://dicedev.tetherfi.cloud:45201/api/v1/SocialMedia/",
        "https://totally-picked-bengal.ngrok-free.app/api/v1/SocialMedia/"
    ]
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
    SocialMediaAPIs: new FormControl(initSmpostsSearchState.SocialMediaAPIs),
    listOfMailboxes: new FormControl([])
});

@Injectable({
    providedIn: 'root'
})
export class SocialMediaPostsService {
    private _configData: any;
    private _customerInitials: { [key: string]: string } = {};
    
    /**
     * Internal service state
     */
    private readonly _internal$ = {
        email: {
            searchParams,
            globalSearchKey: new FormControl(''),
            defaultEmail: new FormControl(''),
            availableMailboxes: new FormControl([]),

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
       * User preferences API Urls
       */
      apiUrls: string[] = [];
  
      customerId: string;
      /**
      * editAllowed: to perform customer details update
      */
      editAllowed: boolean = false;
      formData: TwCustomerInfo;
      
      /**
      * test: test webhook urls are used if set to true
      */
      test: boolean = false;
       /**
        * Current intreaction id
        */
       interactionId: number;
       formChanged = false;
       customerForm: FormGroup;

   customerData: any = {};
    constructor(private httpClient: HttpClient) {}
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
     * Set the configuration data for the service
     */
    setConfigData(config: TwSmmCustomerDetails<any> | IWidget<any, any>) {
        this._configData = config;
        // Handle both widget types
        if ('Data' in config && 'EditAllowed' in config.Data) {
            this.editAllowed = config.Data.EditAllowed;
        } else {
            this.editAllowed = false;
        }
    }

    /**
     * Get the current configuration data
     */
    getConfigData(): any {
        return this._configData;
    }

    /**
     * Get customer initials for a given customer ID
     */
    getCustomerInitials(customerId: string): string {
        return this._customerInitials[customerId] || '';
    }

    /**
     * Get initials from customer name
     */
    private getInitials(name: string): string {
        if (!name) return '';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase();
    }

    async getCustomerData(customerId: string) {
        console.log('getCustomerData called with ID:', customerId);
        
        if (!customerId) {
            console.warn('getCustomerData: Missing customerId');
            return null;
        }

        if (!this.customerData[customerId]) {
            console.log('Fetching fresh customer data for ID:', customerId);
            const data = await this.fetchCustomerDetails(customerId);
            if (data) {
                this.customerData[customerId] = data;
                console.log('Cached customer data:', this.customerData[customerId]);
            } else {
                console.warn('No data returned from fetchCustomerDetails');
            }
        } else {
            console.log('Using cached customer data for ID:', customerId);
        }

        return this.customerData[customerId];
    }

    async fetchCustomerDetails(customerId: string): Promise<any> {
        console.log('fetchCustomerDetails called with ID:', customerId);
        
        if (!customerId) {
            console.warn("Missing customerId");
            return null;
        }
    
        try {
            const apiUrl = this.getApiUrl();
            if (!apiUrl) {
                console.warn("No API URL available");
                return null;
            }
    
            const res: any = await this.httpClient.post(`${apiUrl}${this.getViewMethodName()}${customerId}`, {}).toPromise();
            console.log("API Response:", res);
    
            if (this.isValidResponse(res)) {
                return this.processCustomerData(res.data, customerId);
            }
            
            console.warn("Invalid response:", res);
            return null;
        } catch (error) {
            console.error("Error in fetchCustomerDetails:", error);
            return null;
        }
    }
    
    private getApiUrl(): string {
        return this.globalSmpWorkbenchState$?.searchParams?.value?.SocialMediaAPIs?.[0] || 
               this._configData?.Data?.SocialMediaAPIs?.[0] || '';
    }
    
    private getViewMethodName(): string {
        return this._configData?.Data?.ViewMethodName || 'GetCustomerDetailsByCustomerId?customerId=';
    }
    
    private isValidResponse(res: any): boolean {
        return res?.errCode === 0 && res?.errMsg === "Success";
    }
    
    private processCustomerData(data: any, customerId: string): any {
        data = data || {};
        data.customerID = data.customerID || customerId;
    
        const requiredFields = [
            'firstName', 'lastName', 'salutation', 'cif', 'email', 
            'phone', 'address', 'city', 'state', 'country', 
            'postalCode', 'secondaryPhone', 'secondaryEmail', 
            'secondaryCIF', 'lastChangedBy'
        ];
    
        requiredFields.forEach(field => {
            data[field] = data[field] || '';
        });
    
        data.lastChangedOn = data.lastChangedOn ? moment(data.lastChangedOn + 'Z').format('DD-MM-YYYY hh:mm:ss a') : '';
        data.CustomerName = [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(' ');
        this._customerInitials[customerId] = this.getInitials(data.CustomerName);
    
        console.log('Processed customer data:', { customerId, name: data.CustomerName, initials: this._customerInitials[customerId], data });
        
        Object.keys(data).forEach(key => {
            if (!data[key]) {
                data[key] = '   ';
            }
        });
    
        return data;
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


