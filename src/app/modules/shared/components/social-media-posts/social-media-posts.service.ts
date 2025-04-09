import { FormControl, FormGroup } from '@angular/forms';
import { Injectable, Input } from '@angular/core';
import { SDKClient } from '@tmac/sdk';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import moment from 'moment'; // Ensure this is imported
import { HttpClient } from '@angular/common/http';
import { TwCustomerInfo,TwSmmCustomerDetails  } from '@ad/types';



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
     @Input() data: TwSmmCustomerDetails<any>;
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
 // method to fetch customer details based on CustomerID.



//  async fetchCustomerDetails(customerId: string): Promise<any> {
//     if (!customerId || !this.globalSmpWorkbenchState$?.searchParams) {
//         console.warn("Missing customerId or searchParams");
//         return null;
//     }

//     try {
//         let apiUrl = this.globalSmpWorkbenchState$.searchParams.get('SocialMediaAPIs')?.value?.[0] +
//             'ViewMethodName/' + customerId;

//         // Optional testing URL override
//         const isTest = false; // Replace this with a dynamic flag if needed
//         if (isTest) {
//             apiUrl = "https://webhook.site/efc14eee-2fb5-468c-8a90-6e0edf9ff441";
//         }

//         const res: any = await this.httpClient.post(apiUrl, {}).toPromise();
//         console.log("fetchCustomerDetails API Response:", res);

//         if (res?.errCode === 0 && res?.errMsg === "Success") {
//             if (!res.data?.customerID) {
//                 return null;
//             }

//             // Convert time to local time zone
//             res.data.lastChangedOn = moment(res.data.lastChangedOn + 'Z')
//                 .format('DD-MM-YYYY hh:mm a');

//             // Fill blank values for display
//             Object.keys(res.data).forEach((key) => {
//                 if (!res.data[key]) {
//                     res.data[key] = '   ';
//                 }
//             });

//             return res.data;
//         } else {
//             console.warn("Invalid response:", res);
//         }
//     } catch (error) {
//         console.error("Error in fetchCustomerDetails:", error);
//         return null;
//     }
// }
// async fetchCustomerDetails(customerId: string): Promise<any> {
//     if (!customerId || !this.globalSmpWorkbenchState$?.searchParams) {
//         console.warn("Missing customerId or searchParams");
//         return null;
//     }

//     try {
 
      
//         let apiUrl = `${this.globalSmpWorkbenchState$.searchParams.value.SocialMediaAPIs[0]}${this.globalSmpWorkbenchState$.searchParams.value.ViewMethodName}${customerId}`;

//         const isTest = false; 
//         if (isTest) {
//             apiUrl = "https://webhook.site/efc14eee-2fb5-468c-8a90-6e0edf9ff441";
//         }

//         const res: any = await this.httpClient.post(apiUrl, {}).toPromise();
//         console.log("fetchCustomerDetails API Response:", res);

//         if (res?.errCode === 0 && res?.errMsg === "Success") {
//             if (!res.data?.customerID) {
//                 return null;
//             }

//             // Convert time to local time zone
//             res.data.lastChangedOn = moment(res.data.lastChangedOn + 'Z')
//                 .format('DD-MM-YYYY hh:mm a');

//             // Fill blank values for display
//             Object.keys(res.data).forEach((key) => {
//                 if (!res.data[key]) {
//                     res.data[key] = '   ';
//                 }
//             });

//             return res.data;
//         } else {
//             console.warn("Invalid response:", res);
//         }
//     } catch (error) {
//         console.error("Error in fetchCustomerDetails:", error);
//         return null;
//     }
// }

async fetchCustomerDetails(customerId: string): Promise<any> {
    if (!customerId || !this.globalSmpWorkbenchState$?.searchParams) {
        console.warn("Missing customerId or searchParams");
        return null;
    }

    try {
        let apiUrl = this.data.Data.SocialMediaAPIs[0] + this.data.Data.ViewMethodName 
        + this.customerId; 

        // Optional testing URL override
        const isTest = false; // Replace this with a dynamic flag if needed
        if (isTest) {
            apiUrl = "https://webhook.site/efc14eee-2fb5-468c-8a90-6e0edf9ff441";
        }

        const res: any = await this.httpClient.post(apiUrl, {}).toPromise();
        console.log("fetchCustomerDetails API Response:", res);

        if (res?.errCode === 0 && res?.errMsg === "Success") {
            if (!res.data?.customerID) {
                return null;
            }

            // Convert time to local time zone
            res.data.lastChangedOn = moment(res.data.lastChangedOn + 'Z')
                .format('DD-MM-YYYY hh:mm a');

            // Fill blank values for display
            Object.keys(res.data).forEach((key) => {
                if (!res.data[key]) {
                    res.data[key] = '   ';
                }
            });

            return res.data;
        } else {
            console.warn("Invalid response:", res);
        }
    } catch (error) {
        console.error("Error in fetchCustomerDetails:", error);
        return null;
    }
}


async getCustomerData(customerId: string) {
    if (!this.customerData[customerId]) {
        const data = await this.fetchCustomerDetails(customerId);
        if (data) {
            this.customerData[customerId] = data;
        }
    }
    return this.customerData[customerId];
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


