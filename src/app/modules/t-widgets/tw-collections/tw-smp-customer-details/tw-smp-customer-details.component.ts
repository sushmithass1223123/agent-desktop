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
import { validateEmail, validatePhone } from 'app/utils';
import { TranslocoService } from '@ngneat/transloco';

/**
 * Customer details widget
 */
@Component({
    selector: 'tw-smp-customer-details',
    templateUrl: './tw-smp-customer-details.component.html',
    styleUrls: ['./tw-smp-customer-details.component.scss'],
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

    customerId: string;
    editAllowed: boolean = false;
    formData: TwCustomerInfo;
    test: boolean = false;
     /**
      * Current intreaction id
      */
     interactionId: number;

     defaultControlFields = [
                                                        {
                                                            "id": "customerID",
                                                            "type": "text",
                                                            "title": "Customer Id",
                                                            "maxValue": 100,
                                                            "disabled": true,
                                                            "placeHolder": "Customer ID",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "salutation",
                                                            "type": "text",
                                                            "title": "Salutation",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Salutation",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "firstName",
                                                            "type": "text",
                                                            "title": "First Name",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "First Name",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "lastName",
                                                            "type": "text",
                                                            "title": "Last Name",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Last Name",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "cif",
                                                            "type": "text",
                                                            "title": "CIF",
                                                            "disabled": false,
                                                            "placeHolder": "Customer Identification Number",
                                                            "maxValue": 100,
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "secondaryCIF",
                                                            "type": "text",
                                                            "title": "Secondary Cif",
                                                            "disabled": false,
                                                            "maxValue": 100,
                                                            "placeHolder": "Secondary CIF",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "email",
                                                            "type": "email",
                                                            "title": "Email",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Email",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "phone",
                                                            "type": "tel",
                                                            "title": "Phone",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Phone",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "address",
                                                            "type": "text",
                                                            "title": "Address",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Address",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "city",
                                                            "type": "text",
                                                            "title": "City",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "City",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "state",
                                                            "type": "text",
                                                            "title": "State",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "State",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "country",
                                                            "type": "text",
                                                            "title": "Country",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Country",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "postalCode",
                                                            "type": "text",
                                                            "title": "Phone",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Postal Code",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "secondaryPhone",
                                                            "type": "tel",
                                                            "title": "Secondary Phone",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Secondary Phone",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "secondaryEmail",
                                                            "type": "email",
                                                            "title": "Secondary Email",
                                                            "maxValue": 100,
                                                            "disabled": false,
                                                            "placeHolder": "Secondary Email",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "lastChangedBy",
                                                            "type": "text",
                                                            "title": "Last Changed By",
                                                            "maxValue": 100,
                                                            "disabled": true,
                                                            "placeHolder": "Last Changed By",
                                                            "visible": true
                                                        },
                                                        {
                                                            "id": "lastChangedOn",
                                                            "type": "text",
                                                            "title": "Last Changed On",
                                                            "maxValue": 100,
                                                            "disabled": true,
                                                            "placeHolder": "Last Changed On",
                                                            "visible": false
                                                        }
                                                    ];
    receivedData: TwCustomerInfo;
 
    constructor(private _tmacEventService: TMACEventService, private httpClient: HttpClient,
        private _appUIService: AppUiService, 
        private _interactionManagerService: InteractionManagerService ,
        private translocoService: TranslocoService,
    ) {
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
        if(this.data.InteractionDetails.interactionId) {
            this.interactionId = this.data.InteractionDetails.interactionId;
            this.getCustomerDetails();
        }
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
                    if(i.isActive) {
                        this.interactionId = i.interactionId;
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
    
    //set customerId & interactionId
    IncomingEmailEvent(evt) {
        if(evt.EmailType === 'NewSocialMediaItemFromMakerQueue') {
        console.log("Event: ", evt);  
        if(JSON.parse(evt.JsonData)?.CustomerId) {
            this.customerId = JSON.parse(evt.JsonData).CustomerId;
            this.interactionId = this.data?.InteractionDetails?.interactionId;
            this.getCustomerDetails(); 
        } else {
            return;
        }
    }
    }

    updateCustomerDetails() {
        let updateUrl = this.data.Data.SocialMediaAPIs[0] + this.data.Data.UpdateMethodName;
        if(this.test) {
            updateUrl = "https://webhook.site/17f9233b-b42f-4d75-9c2a-5d8740054d95";
        }
       if(this.formData.email) {
        if (!validateEmail(this.formData.email)) {
            this.formData.email = '';            
            // "InvalidEmail": "Please enter a valid email address",
            this._appUIService.showSnackbar(this.translocoService
                .translate('sharedComponents.socialMediaPosts.InvalidEmail'), 'failure');
            return false;
        }
       }
       
       if(this.formData.phone) {
        if (!validatePhone(this.formData.phone)) {
            this.formData.phone = '';
            
            // "InvalidPhoneNumber": "Please enter a valid 10 digit phone number",
            this._appUIService.showSnackbar(this.translocoService
                .translate('sharedComponents.socialMediaPosts.InvalidPhoneNumber'), 'failure');            return false;
        }
    }

        if(this.formData.secondaryEmail) {
        if (!validateEmail(this.formData.secondaryEmail)) {
            this.formData.secondaryEmail = '';
            
        // "InvalidSecondaryEmail": "Please enter a valid secondary email address",
            this._appUIService.showSnackbar(
                this.translocoService.translate('sharedComponents.socialMediaPosts.InvalidSecondaryEmail'), 
                'failure');
            return false;
        }
        }
        // "InvalidSecondaryPhoneNumber": "Please enter a valid 10 digit secondary phone number",
        
           
        if(this.formData.secondaryPhone) {
            if (!validatePhone(this.formData.secondaryPhone)) {
                this.formData.secondaryPhone = '';
                this._appUIService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.InvalidSecondaryPhoneNumber'),
                    'failure');
                return false;
            }
       }
       // used to check if the data is changed
       //if not then update is not called
       let changed = false;
        Object.entries(this.formData).forEach(element => {
            if(this.receivedData[element[0]] != element[1]) {
                changed = true;
            }            
        });
        if(!changed) {
            console.log("Nothing Changed");
            // "NothingHasChanged": "Nothing to update!",
            this._appUIService.showSnackbar(this.translocoService
                .translate('sharedComponents.socialMediaPosts.NothingHasChanged'),
            'failure');
            return;
        }
       
        console.log("Updating with data", this.formData)
        
        //lastChangedon is updated in backend code to DateTime.UtcNow; so we dont have to send it
        // let date = moment().format('yyyy-MM-DDThh:mm:ssZ');
        // this.formData.lastChangedOn = date.toString();
        // data['lastChangedOn'] = date.toString();
        delete this.formData.lastChangedOn;
        this.receivedData = this.formData;
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

                this._appUIService.showSnackbar(
                    this.translocoService
                    .translate('sharedComponents.socialMediaPosts.UpdatedCustomerDetails'));
          // "UpdatedCustomerDetails": "Updated details Successfully"

                console.log("Updated Successfully Details for: ", this.formData["firstName"]);
                this.getCustomerDetails();
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
        this.formData = {};
        this.data.Data.ControlFields.forEach(control => {
            this.formData[control.id + '_' + this.interactionId] = ' ';  
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
                    if(!this.formData[element[1]]) {
                        this.formData[element[1]] = ' ';
                    }
                });

                // convert time to UTC Format with 'Z'
                let lastChangedOn = new Date(this.formData.lastChangedOn + 'Z');

                this.formData.lastChangedOn = moment(lastChangedOn)
                .format('DD-MM-YYYY hh:mm a');
                console.log("this.formData.lastChangedOn", this.formData.lastChangedOn)
                console.log("this.formData.normal", lastChangedOn.toDateString() + ' - ' + lastChangedOn.toTimeString());
                console.log("LastChangedOn new Date().toString(): ", this.formData.lastChangedOn);
                // console.log("LastChangeOn new Date().toISOString(): ", new Date(res.data.lastChangedOn).toISOString())
                
                this.receivedData =  { ...this.formData };
            }
        });
        return this.formData;
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }
}

