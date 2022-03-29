import { Widget } from '..';

/**
 * Wallboard widget is used to show the current list of agents statuses and other details displayed in a table.
 * Example json:
 * ```json
 * {
 *     "Name": "Wallboard",
 *     "Description": "",
 *     "Type": "tw-wallboard",
 *     "Config": {
 *         "Enabled": true,
 *         "Hidden": false,
 *         "Static": false,
 *         "Anchor": true,
 *         "AOT": false,
 *         "AutoOpen": false,
 *         "Icon": "dvr",
 *         "Class": "",
 *         "Position": { "X": 2, "Y": 3 },
 *         "Actions": [],
 *         "ViewState": "restore",
 *         "Header": true,
 *         "Pinned": false
 *     },
 *     "Data": { "Role": "agent", "SLEnabled": true }
 * }
 * ```
 */
export type TwWallboard = Widget<TwWallboardData>;

export interface TwWallboardData {
    /**
     * Role of the widget ie whether the wallboard is loaded for agent or supervisor
     */
    Role: 'agent' | 'supervisor';
    /**
     * Flag to add 'ServiceLevel' column in the table
     */
    SLEnabled: boolean;
}
