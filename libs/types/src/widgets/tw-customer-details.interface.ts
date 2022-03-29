/**
 * Customer details info field's config that needs to be displayed dynamically
 */
export type TwCustomerDetailsCustomerInfo = {
    /**
     * The title of the field
     */
    Title: string;
    /**
     * The value source that needs to be displayed as the value for the field
     */
    ValueSource: string;
    /**
     * Unit of the value. 's' for time stamp of the '10:30:29' format
     */
    Unit: string;
    /**
     * Default value of the field
     */
    DefaultValue: string;
    /**
     * Some data might need to be redacted. This is achieved by this field.
     */
    MaskData: TwCustomerDetailsMaskData;
};

/**
 * Customer details value masking config
 */
export type TwCustomerDetailsMaskData = {
    /**
     * This is used to replace or redact parts of the string that are displayed
     */
    MaskWith: string;
    /**
     * The number of characters to be masked
     */
    MaxMaskedChars: number;
    /**
     * Where should the unmasking start from
     */
    UnMaskedStartChars: number;
    /**
     * Where should the unmasked characters end
     */
    UnMaskedEndChars: number;
};

import { InteractionWidget } from '..';

/**
 * Customer details widget is used to display the customer details
 * dynamically during an interaction. Example config:
 * {
 *   "Name": "Customer Details",
 *   "Description": "",
 *   "Type": "tw-customer-details",
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
 *      "CustomerInfo": [
 *           {
 *              "Title": "Mobile",
 *              "ValueSource": "CCLDataEvent.RegisteredPhone",
 *              "Unit": "",
 *              "DefaultValue": "",
 *              "MaskData": true
 *           },
 *           { "Title": "Name", "ValueSource": "CCLDataEvent.CallerName", "Unit": "", "DefaultValue": "" },
 *           { "Title": "Email", "ValueSource": "CCLDataEvent.Email", "Unit": "", "DefaultValue": "" },
 *           { "Title": "Address", "ValueSource": "CCLDataEvent.Address", "Unit": "", "DefaultValue": "" },
 *           { "Title": "NRIC", "ValueSource": "CCLDataEvent.NRIC", "Unit": "", "DefaultValue": "" },
 *           {
 *              "Title": "Account Number",
 *              "ValueSource": "CCLDataEvent.AccountNumber",
 *              "Unit": "",
 *              "DefaultValue": "",
 *              "MaskData": {
 *                  "MaskWith": "*",
 *                  "MaxMaskedChars": 14,
 *                  "UnMaskedStartChars": 0,
 *                  "UnMaskedEndChars": 4
 *               }
 *            },
 *            {
 *                   "Title": "Queue time",
 *                   "ValueSource": "IVRDataEvent.NA",
 *                   "Unit": "s",
 *                   "DefaultValue": "00:00:00"
 *             }
 *           ]
 *       }
 *    }
 */
export interface TwCustomerDetails<T> extends InteractionWidget<TwCustomerDetailsData, T> {}

/**
 * The data config of customer details widget
 */
export type TwCustomerDetailsData = {
    /**
     * The dynamic list of fields to be displayed in the customer details widget
     */
    CustomerInfo: TwCustomerDetailsCustomerInfo[];
};
