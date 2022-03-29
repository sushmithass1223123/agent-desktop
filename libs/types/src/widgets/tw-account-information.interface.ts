import { InteractionWidget } from '..';

/**
 * Account information widget. Config example:
 * ```json
 * {
 *     "Name": "Account Information",
 *     "Description": "",
 *     "Key": "CustomerAccountInfo",
 *     "Type": "tw-account-information",
 *     "Config": {
 *     "Enabled": true,
 *     "Hidden": false,
 *     "Static": false,
 *     "Anchor": false,
 *     "AOT": false,
 *     "AutoOpen": false,
 *     "Icon": "",
 *     "Class": "",
 *     "Position": { "X": 2, "Y": 1 },
 *     "Actions": ["maximize", "float"],
 *     "ViewState": "restore",
 *     "Header": true,
 *     "Pinned": false
 *      },
 *     "Data": { "IsAuthenticated": true }
 *  }
 * ```
 * @ignore
 */
export interface TwAccountInformation<T = any> extends InteractionWidget<TwAccountInformationData, T> {}

/**
 * Data config of tw-account-information widget
 * @ignore
 */
export type TwAccountInformationData = {
    IsAuthenticated: boolean;
};
