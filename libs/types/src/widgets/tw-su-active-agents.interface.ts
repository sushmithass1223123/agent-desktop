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
     * Auxcodes ref
     */
    AuxCodes: IAuxCodeConfig;
    /**
     * interactionConstraints for bargin, silent monito, whisper
     */
    InteractionConstraints: TwInteractionConstraints;
    /**
     * [agentStatusChange]
     */
    agentStatusChange:boolean;
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
export type IAuxCodeConfig = {
  /**
   * Enabled flag
   */
  Enabled: boolean;
  /**
   * Load by team flag
   */
  ByTeam: boolean;
  /**
   * To show default ACW status
   */
  DefaultACW: boolean;
  /**
   * To show default Logout status
   */
  DefaultLogout: boolean;
};
/**
 * Constraints for bargin, whisper, silent monitor
 */
 interface TwInteractionConstraints  {
  ValidateFor: string[] ;
  AllowSupervisorToBargeIn: boolean;
  AllowSupervisorToChatSilentMonitor: boolean;
  AllowSupervisorToChatWhisper: boolean;
  AllowSupervisorToChatConference: boolean;
};