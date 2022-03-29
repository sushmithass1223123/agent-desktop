import { Widget } from '..';

/**
 * Interaction details widget is used to show all the past interactions of the agent,
 * based on the date selected in the dashboard.
 * Tha data loaded here is from the TMAC Data Server (Dashboard SignalR Connection).
 * Example config:
 * ```json
 *  {
 *    "Name": "Interaction Details",
 *    "Description": "",
 *    "Key": "InteractionDetails",
 *    "Type": "tw-ad-interaction-details",
 *    "Config": {
 *        "Enabled": true,
 *        "Hidden": false,
 *        "Static": false,
 *        "Anchor": false,
 *        "AOT": false,
 *        "AutoOpen": false,
 *        "Icon": "format_list_bulleted",
 *        "Class": "",
 *        "Position": { "X": 2, "Y": 1 },
 *        "Actions": ["maximize", "float"],
 *        "ViewState": "restore",
 *        "Header": true,
 *        "Pinned": false
 *    },
 *    "Data": {}
 *  }
 * ```
 */
export interface TwAdInteractionDetails extends Widget<TwAdInteractionDetailsData> {}

export type TwAdInteractionDetailsData = {};
