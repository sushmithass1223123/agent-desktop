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
import { TranslocoService } from '@ngneat/transloco';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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
     formChanged = false;
     receivedData: TwCustomerInfo;
     customerForm: FormGroup;
     
     error = {
        email: 'Enter a valid email',
        phone: 'Enter a valid phone',
        secondaryEmail: 'Enter a valid s email',
        secondaryPhone: 'Enter a valid s phone',
      };
      validation = ' cannot be empty';
      
     defaultControlFields = [
        {
          id: 'customerID',
          type: 'text',
          title: 'Customer Id',
          maxValue: 100,
          disabled: true,
          placeHolder: 'Customer ID',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'salutation',
          type: 'text',
          title: 'Salutation',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Salutation',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'firstName',
          type: 'text',
          title: 'First Name',
          maxValue: 100,
          disabled: false,
          placeHolder: 'First Name',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'lastName',
          type: 'text',
          title: 'Last Name',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Last Name',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'cif',
          type: 'text',
          title: 'CIF',
          disabled: false,
          placeHolder: 'Customer Identification Number',
          maxValue: 100,
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'secondaryCIF',
          type: 'text',
          title: 'Secondary Cif',
          disabled: false,
          maxValue: 100,
          placeHolder: 'Secondary CIF',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'email',
          type: 'email',
          title: 'Email',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Email',
          visible: true,
          required: false,
          validation_regex: '[a-zA-Z0-9.*%±]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}',
        },
        {
          id: 'phone',
          type: 'tel',
          title: 'Phone',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Phone',
          visible: true,
          required: false,
          validation_regex: '^((\\+91-?)|0)?[0-9]{10}$',
        },
        {
          id: 'address',
          type: 'text',
          title: 'Address',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Address',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'city',
          type: 'text',
          title: 'City',
          maxValue: 100,
          disabled: false,
          placeHolder: 'City',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'state',
          type: 'text',
          title: 'State',
          maxValue: 100,
          disabled: false,
          placeHolder: 'State',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'country',
          type: 'text',
          title: 'Country',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Country',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'postalCode',
          type: 'text',
          title: 'Postal Code',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Postal Code',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'secondaryPhone',
          type: 'tel',
          title: 'Secondary Phone',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Secondary Phone',
          visible: true,
          required: false,
          validation_regex: '^((\\+91-?)|0)?[0-9]{10}$',
        },
        {
          id: 'secondaryEmail',
          type: 'email',
          title: 'Secondary Email',
          maxValue: 100,
          disabled: false,
          placeHolder: 'Secondary Email',
          visible: true,
          required: false,
          validation_regex: '[a-zA-Z0-9.*%±]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}',
        },
        {
          id: 'lastChangedBy',
          type: 'text',
          title: 'Last Changed By',
          maxValue: 100,
          disabled: true,
          placeHolder: 'Last Changed By',
          visible: true,
          required: false,
          validation_regex: '',
        },
        {
          id: 'lastChangedOn',
          type: 'text',
          title: 'Last Changed On',
          maxValue: 100,
          disabled: true,
          placeHolder: 'Last Changed On',
          visible: false,
          validation_regex: '',
        },
      ];
 
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
        
        this.editAllowed = this.data?.Data?.EditAllowed;      
        if(this.data?.InteractionDetails?.InteractionID) {
            this.interactionId = this.data?.InteractionDetails?.InteractionID;
            let customerFormData = {};
            this.data.Data.ControlFields.forEach(control => {
                if(!this.editAllowed) {
                    customerFormData[control.id] = new FormControl('');
                } else {
                  if(control?.validation_regex && control?.required) {
                    
                    customerFormData[control.id] = new FormControl('',
                      [Validators.pattern(control?.validation_regex), Validators.required])
                  } else if(control?.validation_regex) {
                        customerFormData[control.id] = new FormControl('',
                            Validators.pattern(control?.validation_regex))
                    }
                    else if(control?.required) {
                        customerFormData[control.id] = new FormControl('',
                            Validators.required)  
                    } else {
                      customerFormData[control.id] = new FormControl('');
                    }
                }
            });
            this.customerForm = new FormGroup(customerFormData);
            console.log("Controls: ", this.customerForm.controls);
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
                    //if the event is for the current active interaction get the 
                    //customer details
                    if(i.isActive) {
                        this.interactionId = i.interactionId;
                        console.log("This.interactionId: ", this.interactionId, i)
                      
                        this.customerId = JSON.parse(i.otherData?.JsonData).CustomerId;
                        this.getCustomerDetails();
                    }
                });
        });
      this.validation = this.translocoService
                .translate('sharedComponents.socialMediaPosts.fieldValidation');
      this.error.email = this.translocoService
                .translate('sharedComponents.socialMediaPosts.email');        
      this.error.phone = this.translocoService
                .translate('sharedComponents.socialMediaPosts.phone');    
      this.error.secondaryEmail = this.translocoService
                .translate('sharedComponents.socialMediaPosts.secondaryEmail');      
      this.error.secondaryPhone = this.translocoService
                .translate('sharedComponents.socialMediaPosts.secondaryPhone');
        
    this.customerForm.valueChanges.subscribe((val) => {
      this.formChanged = true;
    });
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
      if(!this.formChanged) {
        console.log("Nothing Changed");
        // "NothingHasChanged": "Nothing to update!",
        this._appUIService.showSnackbar(this.translocoService
            .translate('sharedComponents.socialMediaPosts.NothingHasChanged'),
        'failure');
        return;
      }
        let updateUrl = this.data.Data.SocialMediaAPIs[0] + this.data.Data.UpdateMethodName;
        if(this.test) {
            updateUrl = "https://webhook.site/17f9233b-b42f-4d75-9c2a-5d8740054d95";
        } 
        this.customerForm.controls['lastChangedBy'].setValue(SDKClient.getAgentData().agentName);

        let data = { ... this.customerForm.value};
        delete data.lastChangedOn;
       
        this.httpClient.post(updateUrl, data)
        .subscribe((res: any) => {            
            console.log("updateCustomerDetails response: ", res);
            // {
            //     "errCode": 1,
            //     "errMsg": "Success",
            //     "data": 1
            //   }
            if(res.errCode == 1 && res.errMsg == "Success" && res.data == 1) {
                // "UpdatedCustomerDetails": "Updated details Successfully"
                this._appUIService.showSnackbar(
                    this.translocoService
                    .translate('sharedComponents.socialMediaPosts.UpdatedCustomerDetails'));
                console.log("Updated Successfully Details for: ", this.customerForm.value.firstName);
                this.getCustomerDetails();
            }
        });
    }

    getCustomerDetails() {
       console.log("Getting Data for Customer ID: ", this.customerId)
       if(!this.customerForm || !this.customerId) {
        return;
       }

        this.customerForm?.reset;
        let apiUrl = this.data.Data.SocialMediaAPIs[0] + this.data.Data.ViewMethodName 
          + this.customerId; 
       if(this.test) {
        apiUrl = "https://webhook.site/efc14eee-2fb5-468c-8a90-6e0edf9ff441";
       }
        this.httpClient.post(apiUrl, {})
        .subscribe((res: any) => {
          const loader = this._appUIService.showSnackbar(
            this.translocoService.translate('sharedComponents.socialMediaPosts.GetCustomerDetails'),
            'loading'
        );
            console.log("getCustomerDetails Response", res)
             if(res.errCode == 0 && res.errMsg == "Success") {
              loader.dismiss();
                if(!res.data.customerID) {
                    return;
                }

                // convert time to current time zone
                // let lastChangedOn = new Date(this.formData.lastChangedOn + 'Z');
                res.data.lastChangedOn = moment(res.data.lastChangedOn + 'Z')
                .format('DD-MM-YYYY hh:mm a');

                Object.keys(res.data).forEach(element => {  
                    if(!this.editAllowed && !res.data[element]) {
                           this.customerForm.controls[element].setValue('-'); 
                    } else {
                        this.customerForm.controls[element].setValue(res.data[element]);
                    }

                });
                this.formChanged = false;
                console.log("CustomerForm: ", this.customerForm.value)
            }
        });
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }
}

