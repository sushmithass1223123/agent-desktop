import { InteractionWidget } from '../core';

/**
 * Workcode widget is used to display a list of workcodes for the agent.
 * Example json:
 * ```json
 *  {
 *      "Name": "Work Codes",
 *      "Description": "",
 *      "Key": "TeamWorkCodes",
 *      "Type": "tw-work-codes",
 *      "Config": {
 *          "Enabled": true,
 *          "Anchor": false,
 *          "AOT": false,
 *          "AutoOpen": false,
 *          "Icon": "",
 *          "Class": "",
 *          "Position": { "X": 2, "Y": 1 },
 *          "Actions": ["maximize", "float"],
 *          "ViewState": "restore",
 *          "Header": true,
 *          "Pinned": false
 *      },
 *      "Data": { "Role": "supervisor", "ByTeam": true, "ByGroup": false }
 *  }
 * ```
 */
export type TwWorkCodes = InteractionWidget<TwWorkCodesData>;

/**
 * Workcode widget's config data
 */
export interface TwWorkCodesData {
    /**
     * Role of the widget depending on whether its loading for supervisor or inside an interaction
     */
    Role: 'interaction' | 'supervisor';
    /**
     * Flag to load team specific workcodes
     */
    ByTeam: boolean;
    /**
     * Flag to display the workcodes group wise
     */
    ByGroup: boolean;
}
