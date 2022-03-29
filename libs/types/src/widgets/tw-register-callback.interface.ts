/**
 * Data map used to use different values for a key during registration
 */
export type TwRegisterCallbackDataMap = {
    /**
     * The config used to use value / default value of the "Name" key while registering a callback
     */
    Name: TwRegisterCallbackName;
    /**
     * The config used to use value / default value of the "Phone" key while registering a callback
     */
    Phone: TwRegisterCallbackName;
};

/**
 * The config used to use value / default value of the fields while registering a callback
 */
export type TwRegisterCallbackName = {
    /**
     * Value to be used while registering a callback
     */
    ValueSource: string;
    /**
     * Default value of the field while registering a callback
     */
    DefaultValue: string;
};

import { Widget } from '..';

/**
 * Register callback widget is used to register callbacks with customers
 * Example config:
 * ```json
 * {
 *   "Name": "Register Callback",
 *   "Description": "",
 *   "Key": "RegisterCallback",
 *   "Type": "tw-register-callback",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": true,
 *      "AOT": true,
 *      "AutoOpen": false,
 *      "Icon": "phone_callback",
 *      "Class": "",
 *      "Position": { "X": 0, "Y": 1, "W": 300, "H": 300 },
 *      "Actions": ["minimize", "destroy", "resize"],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *   "Data": {
 *      "TCMProxyUrl": "https://dice.tetherfi.cloud/TCM_Proxy/api",
 *      "DataMap": {
 *              "Name": { "ValueSource": "CCLDataEvent.CallerName", "DefaultValue": "Mr. Tan" },
 *              "Phone": { "ValueSource": "CCLDataEvent.RegisteredPhone", "DefaultValue": "6596975347" }
 *          }
 *       }
 *    }
 * ```
 */
export interface TwRegisterCallback extends Widget<TwRegisterCallbackData> {}

/**
 * Register callback's config widget
 */
export type TwRegisterCallbackData = {
    /**
     * URL for the TCM Proxy
     */
    TCMProxyUrl: string;
    /**
     * Data map used to use different values for a key during registration
     */
    DataMap: TwRegisterCallbackDataMap;
};
