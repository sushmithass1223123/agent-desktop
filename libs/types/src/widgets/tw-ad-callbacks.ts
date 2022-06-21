import { Widget } from '..';

/**
 * tw-ad-callback widget provides list of upcoming callbacks that a user has. It's config can be provided as follows:
 * ```json
 * {
 *       "Name": "Call-back Details",
 *       "Description": "",
 *       "Key": "AgentPendingCallbacks",
 *       "Type": "tw-ad-callbacks",
 *       "Config": {
 *           "Enabled": true,
 *           "Hidden": false,
 *           "Static": false,
 *           "Anchor": false,
 *           "AOT": false,
 *           "AutoOpen": false,
 *           "Icon": "phone_callback",
 *           "Class": "",
 *           "Position": { "X": 2, "Y": 1 },
 *           "Actions": ["maximize", "float"],
 *           "ViewState": "restore",
 *           "Header": true,
 *           "Pinned": false
 *       },
 *       "Data": { "TCMProxyUrl": "http://10.133.146.11:5002" }
 *   }
 * ```
 */
export interface TwAdCallbacks extends Widget<TwAdCallbacksData> {}

/**
 * Data + Config for the tw-ad-callback widget
 */
export type TwAdCallbacksData = {
    /**
     * TCM proxy server url
     */
    TCMProxyUrl: string;
};

/**
 * tw-ad-callback Widget's data
 */
export type TwAdCallbacksInteraction = {};
