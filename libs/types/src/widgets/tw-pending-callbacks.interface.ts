import { InteractionWidget } from '..';

/**
 * Pending callbacks widget displays a list of pending callbacks
 * Example config
 * ```json
 * {
 *   "Name": "Pending Callbacks",
 *   "Description": "",
 *   "Key": "CustomerPendingCallbacks",
 *   "Type": "tw-pending-callbacks",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": false,
 *      "AOT": true,
 *      "AutoOpen": false,
 *      "Icon": "pending_actions",
 *      "Class": "",
 *      "Position": { "X": 0, "Y": 1, "W": 700, "H": 300 },
 *      "Actions": ["maximize", "destroy"],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *   "Data": { "TCMProxyUrl": "http://10.133.146.11:5002" }
 *    }
 * ```
 */
export type TwPendingCallbacks<T> = InteractionWidget<TwPendingCallbacksData, T>;

/**
 * Data config of pending callback widget
 */
export interface TwPendingCallbacksData {
    /**
     * TCM Proxy api URL
     */
    TCMProxyUrl: string;
}
