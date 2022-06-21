import { InteractionWidget } from '..';

/**
 * Voice panel widget wraps a combination of widgets which needs to be in a static panel.
 * It can contain only tw-voice-controls, tw-customer-details and tw-customer-journey widgets.
 * Example config:
 * ```json
 * {
 *     "Name": "Voice-Panel",
 *     "Description": "",
 *     "Type": "tw-voice-panel",
 *     "Config": {
 *         "Enabled": true,
 *         "Hidden": false,
 *         "Static": true,
 *         "Anchor": false,
 *         "AOT": false,
 *         "AutoOpen": false,
 *         "Icon": "",
 *         "Class": "",
 *         "Position": { "X": 2, "Y": 3 },
 *         "Actions": [],
 *         "ViewState": "restore",
 *         "Header": false
 *     },
 *     "Data": {
 *         "Widgets": [ ... ]
 *     }
 * }```
 *
 */
export interface TwVoicePanel extends InteractionWidget<TwVoicePanelData> {}

/**
 * Voice panel's data config
 */
export type TwVoicePanelData = {
    /**
     * List of widget configs to be displayed inside the config.
     * tw-voice-controls, tw-customer-details and tw-customer-journey widgets are the only ones supported
     * for this field.
     */
    Widgets: any[];
};
