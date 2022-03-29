import { Widget } from '..';

/**
 * Chat panel widget houses the chat control widget, customer journey and customer details
 * The config example:
 * ```json
 * {
 *  "Name": "Chat-Panel",
 *  "Description": "",
 *  "Type": "tw-chat-panel",
 *  "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": true,
 *      "Anchor": false,
 *      "AOT": false,
 *      "AutoOpen": false,
 *      "Icon": "",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 3 },
 *      "Actions": [],
 *      "ViewState": "restore",
 *      "Header": false,
 *      "Pinned": false
 *  },
 *  "Data": {
 *      "Widgets": []
 *  }
 * }
 * ```
 */
export interface TwChatPanel extends Widget<TwChatPanelData> {}

/**
 * Chat panel widget data config.
 */
export type TwChatPanelData = {
    /**
     * List of widget to be displayed inside the chat panel widgets
     */
    Widgets: any[];
};
