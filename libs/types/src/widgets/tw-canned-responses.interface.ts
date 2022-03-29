import { InteractionWidget } from '..';

/**
 * Canned responses widget contains a list of pre defined responses for a particular interaction.
 * The config example:
 * ```json
 * {
 *   "Name": "Canned Responses",
 *   "Description": "",
 *   "Key": "TexCannedResponses",
 *   "Type": "tw-canned-responses",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": false,
 *      "AOT": false,
 *      "AutoOpen": false,
 *      "Icon": "",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 1 },
 *      "Actions": ["maximize", "float"],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *    "Data": { "ResponseMode": "manual", "EditAllowed": false }
 * }
 * ```
 */
export interface TwCannedResponses<T> extends InteractionWidget<TwCannedResponsesData, T> {}

/**
 * Canned responses Config's data
 */
export type TwCannedResponsesData = {
    /**
     * Type of canned response
     */
    ResponseMode: 'auto' | 'manual';
    /**
     * Flag to enable edit of the canned responses
     */
    EditAllowed: boolean;
};
