export type TwControlInfo = {
    // type: "dropdown",
    //   title: "Salutation",
    //   maxLength: 5,
    //   data: [ "Good", "Hi", "Hello" ],
    //   disabled: false
    //   placeHolder: Mrs.

    /**
     * The id of the field
     */
    id?: string;
    
    /**
     * The type of the field
     */
    type?: string;
    
    /**
     * The title of the field
     */
    title?: string;
    
    /**
     * The maximum value of the field
     */
    maxLength?: number;
    /**
     * Data for drop down field
     */
    data?: string;
    /**
     * Field Enabled or Disabled
     */
    disabled?: string;
    /**
     * place Holder 
     */
    placeHolder?: string;
    
    /**
     * required 
     */
    required?: string;
    
    /**
     * validate 
     */
    validation_regex?: string;
};

export type TwCustomerInfo = {
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

        salutation?: string;
        firstName?: string;
        lastName?: string;
        cif?: string;
        secondaryCIF?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        secondaryPhone?: string;
        secondaryEmail?: string;
        lastChangedBy?: string;
        lastChangedOn?: string;
};

import { InteractionWidget } from '..';


/**
 * Customer details widget is used to display the customer details
 * dynamically during an interaction. Example config:
 * {
 *   "Name": "SMM Customer Details",
 *   "Description": "",
 *   "Type": "tw-smp-customer-details",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": true,
 *      "AOT": false,
 *      "AutoOpen": false,
 *      "Icon": "person",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 1 },
 *      "Actions": ["maximize", "collapse"],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *   "Data": {
 *      "API": "abc",
 *      " ControlFields": [ {
 *            cif: {
 *            type: "label",
 *            title: "CIF",
 *            disabled: true,
 *            placeHolder: "Customer Identification Number"
 *      },
 *            channelid: {
 *            type: "text",
 *            title: "Channel Id",
 *            disabled: true
 *      },
 *            firstname: {
 *            type: "text",
 *            title: "First Name",
 *            maxLength: 100,
 *            disabled: false
 *      },
 *            lastname: {
 *            type: "text",
 *            title: "Last Name",
 *            maxLength: 100,
 *            disabled: false
 *      },
 *      salutation: {
 *            type: "dropdown",
 *            title: "Salutation",
 *            maxLength: 5,
 *            data: [ "Good", "Hi", "Hello" ],
 *            disabled: false
 *      },
 *      email: {
 *            type: "email",
 *            title: "Email",
 *            maxLength: 150,
 *            placeHolder:"xxx@gmail.com",
 *            disabled: false
 *      },
 * phone: {
 *  type: "tel",
 *  title: "Phone Number",
 *  maxLength: 20,
 *  placeHolder: "0123456789",
 *  disabled: false
 * },
 * address: {
 *  type: "text",
 *  title: "Address",
 *  maxLength: 250,
 *  placeHolder:"Church Street",
 *  disabled: false
 * },
 * city: {
 *  type: "text",
 *  title: "City",
 *  maxLength: 50,
 *  placeHolder: "Bangalore",
 *  disabled: false
 * },
 * state: {
 *  type: "text",
 *  title: "State",
 *  maxLength: 50,
 *  placeHolder: "Karnataka",
 *  disabled: false
 * },
 * country: {
 *  type: "text",
 *  title: "Country",
 *      maxLength: 50,
 *      placeHolder: "India",
 *      disabled: false
 *    },
 *    postalcode: {
 *      type: "text",
 *      title: "Postal Code",
 *      maxLength: 20,
 *      placeHolder: "574321",
 *      disabled: false
 *    }
 * }
              ]
 *       }
 *    }
 */
export interface TwSmmCustomerDetails<T> extends InteractionWidget<TwSmmCustomerDetailsData, T> {}

/**
 * The data config of customer details widget
 */
export type TwSmmCustomerDetailsData = {
    
    SocialMediaAPIs: string[];
    UpdateMethodName:string;
    ViewMethodName:string;
    EditAllowed:boolean;
    /**
     * The dynamic list of fields to be displayed in the customer details widget
     */
     ControlFields: TwControlInfo[];
};
