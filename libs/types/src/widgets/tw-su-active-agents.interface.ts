import { Widget } from '..';

/**
 * This widget shows the list of active agents and allows supervisor
 * to perform some actions on the agents like changing their aux status etc
 * ```json
 * {
 *   "Name": "Active Agents",
 *   "Description": "",
 *   "Type": "tw-su-active-agents",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": false,
 *      "AOT": false,
 *      "AutoOpen": false,
 *      "Icon": "vertical_split",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 3 },
 *      "Actions": [],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *      "Data": { "TASUrl": "https://dice.tetherfi.cloud/TAS/Quiz/Index" }
 *}
 * ```
 */
export interface TwSuActiveAgents extends Widget<TwSuActiveAgentsData> {}

/**
 * Data config for active agents widget
 */
export type TwSuActiveAgentsData = {
    /**
     * [need more info]
     */
    TASUrl: string;
    /**
     * Key to sort the agents list by
     */
    SortBy: string;
    /**
     * Direction of the sort
     */
    SortType: 'desc' | 'asc';
};
