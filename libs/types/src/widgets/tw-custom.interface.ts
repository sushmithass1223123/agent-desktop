import { InteractionWidget } from '..';

/**
 * Custom widgets are used to render Iframes developed by developers not working on AD, or maybe some client specific screeens
 * so that the customer has only one place to look at for all the widgets and functionalities.
 * Example config:
 * ```json
 *  {
 *  "Name": "Voice Bio",
 *  "Description": "",
 *  "Key": "VoiceBio",
 *  "Type": "tw-custom",
 *  "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": true,
 *      "AOT": true,
 *      "AutoOpen": false,
 *      "Icon": "mic",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 1, "W": 700, "H": 600 },
 *      "Actions": ["minimize", "destroy"],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *   },
 *  "Data": {
 *      "OpenInNew": false,
 *      "Url": "https://dice.tetherfi.cloud/TVoiceBio/?agentid=${AgentData.agentId}&phoneNumber=${Interaction.PhoneNumber}"
 *   }
 * ```
 */
export interface TwCustom extends InteractionWidget<TwCustomData> {}

/**
 * Custom widget's data config
 */
export type TwCustomData = {
    /**
     * Flag to open the custom widget's iframe in a new tab
     */
    OpenInNew: boolean;
    /**
     * This is the url of the iframe to be loaded.
     * Parts of the url can be replaced with some constants when wrapped with '${}'.
     * For example, https://dice.tetherfi.cloud/TVoiceBio/?agentid=${AgentData.agentId}&phoneNumber=${Interaction.PhoneNumber}.
     * As shown above the synamic parts are ${AgentData.agentId} and ${Interaction.PhoneNumber}
     * AgentData and Interaction are the two constants available and can be used to create dynamic urls
     */
    Url: string;
    /**
     * This is the refresh rate of the Iframe
     * @default 0 which means that refresh is by default disabled
     */
    AutoRefresh: number;
};
