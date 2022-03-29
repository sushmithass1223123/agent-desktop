import { Widget } from '..';

/**
 *  Score widget is used to show the score of the agent's interactions
 *  Example config:
 * ```json
 * {
 *   "Name": "Call-back Details",
 *   "Description": "",
 *   "Key": "AgentPendingCallbacks",
 *   "Type": "tw-ad-callbacks",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": false,
 *      "AOT": false,
 *      "AutoOpen": false,
 *      "Icon": "phone_callback",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 1 },
 *      "Actions": ["maximize", "float"],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *   "Data": {  }
 * }
 * @ignore
 * ```
 */
export interface TwScore extends Widget<TwScoreData> {}

/**
 * Scroe widget's data config
 * @ignore
 */
export type TwScoreData = {};
