import { Widget } from '..';

/**
 * Generic panel widget wraps a combination of widgets which needs to be in a static panel.
 * It can contain only tw-generic-controls, tw-customer-details and tw-customer-journey widgets.
 * Example config:
 * ```json
 * {
 *    "Name": "Generic-Panel",
 *    "Description": "",
 *    "Type": "tw-generic-panel",
 *    "Config": {
 *        "Enabled": true,
 *        "Hidden": false,
 *        "Static": true,
 *        "Anchor": false,
 *        "AOT": false,
 *        "AutoOpen": false,
 *        "Icon": "",
 *        "Class": "",
 *        "Position": { "X": 2, "Y": 3 },
 *        "Actions": [],
 *        "ViewState": "restore",
 *        "Header": false
 *    },
 *    "Data": {
 *        "Widgets": [ ... ]
 *    }
 *}
 * ```
 */
export interface TwGenericPanel extends Widget<TwGenericPanelData> {}

/**
 * Generic panel's data config
 */
export type TwGenericPanelData = {
    /**
     * List of widget configs to be displayed inside the config.
     * tw-generic-controls, tw-customer-details and tw-customer-journey widgets are the only ones supported
     * for this field.
     */
    Widgets: any[];
};
