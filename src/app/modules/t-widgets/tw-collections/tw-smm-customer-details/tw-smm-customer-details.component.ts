import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { TwControlInfo, TwCustomerInfo, TwSmmCustomerDetails } from '@ad/types';
import { IUIEvent, SDKClient } from '@tmac/sdk';
import { HttpClient } from '@angular/common/http';
import { AppUiService } from '@services/app-ui.service';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { InteractionRef } from 'app/interfaces';

/**
 * Custommer details widget
 */
@Component({
    selector: 'tw-smm-customer-details',
    templateUrl: './tw-smm-customer-details.component.html',
    styleUrls: ['./tw-smm-customer-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSmmCustomerDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config data
     */
    @Input() data: TwSmmCustomerDetails<any>;

    /**
     * Customer info
     */
    ControlFields: TwControlInfo[] = [];
    /**
     * Maximised event emitter
     */
    @Output() maximizeEvent = new EventEmitter();
    /**
     * Float event emitter
     */
    @Output() floatEvent = new EventEmitter();
    /**
     * Collapsed event emitter
     */
    @Output() collapseEvent = new EventEmitter();
    /**
     * User preferences API Urls
     */
    apiUrls: string[] = [];

    customerId: string = '19';
    editAllowed: boolean = false;
    formData: TwCustomerInfo;
    test: boolean = false;
     /**
      * Current intreaction id
      */
     interactionId: number;
 
    constructor(private _tmacEventService: TMACEventService, private httpClient: HttpClient,
        private _appUIService: AppUiService, 
        private _interactionManagerService: InteractionManagerService    ) {
        super('TwSmmCustomerDetailsComponent');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit() {              
        try {
        // call the wrapper init method
        this.initWrapper(this.data);
        console.log("this.data", this.data);
        this.interactionId = this.data.InteractionDetails.InteractionID;

        this.getCustomerDetails();
        this._tmacEventService
        .getAllSubscribedEvents<IUIEvent>(['IncomingEmailEvent'])
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe((evts) =>
            evts.forEach((evt) => {
                console.log("Event:", evt);
                this[evt.EventName](evt);
            })
        );
        
        this._interactionManagerService.interactions
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe((interactions: InteractionRef[]) => {
            interactions
                .filter((i: InteractionRef) => i.type === 'smp')
                .map((i) => {
                    if(this.interactionId === i.interactionId) {
                        console.log("This.interactionId: ", this.interactionId, i)
                        this.customerId = JSON.parse(i.otherData?.JsonData).CustomerId;
                        this.getCustomerDetails();
                    }
                });
        });
        // SDKClient.events.on("IncomingEmailEvent", this.IncomingEmailEvent);
        this.editAllowed = this.data.Data.EditAllowed;             
        } catch (error) {
            console.error('Error in TwSmmCustomerDetails', error);
        }
    }
    
    IncomingEmailEvent(evt) {
        if(evt.EmailType === 'NewSocialMediaItemFromMakerQueue') {
        console.log("Event: ", evt);   
        this.customerId = JSON.parse(evt.JsonData).CustomerId;
        this.getCustomerDetails(); 
    }
    }

    updateCustomerDetails() {
        let updateUrl = this.data.Data.SocialMediaAPIs[0] + this.data.Data.UpdateMethodName;
        if(this.test) {
            updateUrl = "https://webhook.site/17f9233b-b42f-4d75-9c2a-5d8740054d95";
        }
        let date = moment().format('yyyy-MM-DDThh:mm:ssZ');
        this.formData.lastChangedOn = date.toString();
        this.formData.lastChangedBy = SDKClient.getAgentData().agentName;

        this.httpClient.post(updateUrl, this.formData)
        .subscribe((res: any) => {            
            console.log("Update Status: ", res);
            // {
            //     "errCode": 1,
            //     "errMsg": "Success",
            //     "data": 1
            //   }
            if(res.errCode == 1 && res.errMsg == "Success" && res.data == 1) {
                this._appUIService.showSnackbar("Updated Successfully Details for: " + 
                    this.formData["firstName"]);
                console.log("Updated Successfully Details for: ", this.formData["firstName"]);
            }
        });
    }

    getCustomerDetails() {
        {   
         // formData = {
        //     "customerID": "19",
        //     "salutation": "",
        //     "firstName": "Hardcoded",
        //     "lastName": "Hardcoded",
        //     "cif": "H1001",
        //     "secondaryCIF": "",
        //     "email": "",
        //     "phone": "",
        //     "address": "",
        //     "city": "",
        //     "state": "",
        //     "country": "",
        //     "postalCode": "",
        //     "secondaryPhone": "",
        //     "secondaryEmail": "",
        //     "lastChangedBy": "devbox\\select_starsh",
        //     "lastChangedOn": "2024-01-22T17:11:47"
        //   };
       }
       console.log("Getting Data for Customer ID: ", this.customerId)
          if(!this.customerId) return;
        this.formData = {};
        this.data.Data.ControlFields.forEach(control => {
            this.formData[control.id + '_' + this.interactionId] = '-';  
            this.formData["fieldId"] = this.formData[control.id + '_' + this.interactionId];  
        });

        let apiUrl = this.data.Data.SocialMediaAPIs[0] + this.data.Data.ViewMethodName 
          + this.customerId; 
       if(this.test) {
        apiUrl = "https://webhook.site/efc14eee-2fb5-468c-8a90-6e0edf9ff441";
       }
        this.httpClient.post(apiUrl, {})
        .subscribe((res: any) => {
            console.log("Response", res)
             if(res.errCode == 0 && res.errMsg == "Success") {
                 this.formData = res.data;               
                Object.keys(this.formData).forEach(element => {
                    if(this.formData[element] == '')
                        this.formData[element] = '-';
                });
                 this.formData.lastChangedOn = new Date(this.formData.lastChangedOn).toString();
            }
        });
        return this.formData;
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }
}

