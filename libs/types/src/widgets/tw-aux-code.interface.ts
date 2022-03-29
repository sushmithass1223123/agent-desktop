import { Widget } from '../core';

/**
 * Aux Code widget displays the available list of widgets and allows user to select an aux code
 * as the status. Config example:
 * ```json
 * {
 *      "Name": "Aux Codes",
 *      "Description": "",
 *      "Type": "tw-aux-codes",
 *      "Config": { "Enabled": false },
 *      "Data": { "ByTeam": false, "DefaultACW": false, "DefaultLogout": false }
 * }
 * ```
 */
export interface TwAuxCode extends Widget<TwAuxCodeData> {}

/**
 * Aux code's config data
 */
export type TwAuxCodeData = {
    /**
     * Flag to load by team
     */
    ByTeam: boolean;
    /**
     * Flag to show default ACW status
     */
    DefaultACW: boolean;
    /**
     * Flag to show default Logout status
     */
    DefaultLogout: boolean;
};
