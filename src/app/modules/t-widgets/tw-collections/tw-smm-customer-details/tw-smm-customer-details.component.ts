import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { TwControlInfo, TwCustomerInfo, TwSmmCustomerDetails } from '@ad/types';
import { SDKClient, TextChatMessageReceivedEvent } from '@tmac/sdk';
import { HttpClient } from '@angular/common/http';
import { AppUiService } from '@services/app-ui.service';

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
     * Current interaction data
     */
    interactionId: number;
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
    constructor(private _tmacEventService: TMACEventService, private httpClient: HttpClient,
        private _appUIService: AppUiService    ) {
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
        
        // call the wrapper init method
        this.initWrapper(this.data);

        SDKClient.events.on("IncomingEmailEvent", this.IncomingEmailEvent);

        SDKClient.events.on("TextChatMessageReceivedEvent", this.TextChatMessageReceivedEvent);

        this.editAllowed = this.data.Data.EditAllowed;        
        try {
            console.log("Controls", this.data.Data.ControlFields);
            console.log("All Data for SMM", this.data.Data);

            this.getCustomerDetails();
        
        } catch (error) {
            console.error('Error in TwSmmCustomerDetails', error);
        }

    }

    updateCustomerDetails() {
        let updateUrl = this.data.Data.SocialMediaAPIs + this.data.Data.UpdateMethodName;
        if(this.test) {
            updateUrl = "https://webhook.site/17f9233b-b42f-4d75-9c2a-5d8740054d95";
        }
        this.formData.lastChangedOn = new Date().toString();
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
        this.formData = {};
        this.data.Data.ControlFields.forEach(control => {
            this.formData[control.id] = '-';
            
        });

        let apiUrl = this.data.Data.SocialMediaAPIs + this.data.Data.ViewMethodName 
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
   
IncomingEmailEvent(evt) {
    console.log("Event: ", evt);    
}

/**
 * TextChatMessageReceivedEvent Handler
 * @param evt
 */
TextChatMessageReceivedEvent = (evt: TextChatMessageReceivedEvent) => {
    console.log("TextChatMessageReceivedEvent", evt)
        
};
}

