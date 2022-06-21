import { Widget } from '..';

/**
 * Gamification widget is used to show all the gamification related stats of the agent.
 * It contains:
 * - Leader board
 * - Agent progress info
 * - Agent's Quiz info
 * - Agent level info
 * Example config:
 * ```json
 * {
 *       "Name": "Gamification Leaderboard",
 *       "Description": "",
 *       "Key": "Gamification",
 *       "Type": "tw-gamification",
 *       "Config": {
 *           "Enabled": true,
 *           "Hidden": false,
 *           "Static": false,
 *           "Anchor": false,
 *           "AOT": true,
 *           "AutoOpen": false,
 *           "Icon": "extension",
 *           "Class": "",
 *           "Position": { "X": 4, "Y": 2, "W": 1200, "H": 700 },
 *           "Actions": ["maximize", "destroy"],
 *           "ViewState": "restore",
 *           "Header": true,
 *           "Pinned": false
 *       },
 *       "Data": {
 *           "GamificationProxyUrl": "https://dice.tetherfi.cloud/GamificationProxy/Proxy.asmx",
 *           "TVirtualStoreUrl": "https://dice.tetherfi.cloud/TVirtualStore"
 *       }
 *   }
 * ```
 */
export interface TwSuGamification extends Widget<TwSuGamificationData> {};

export type TwSuGamificationData = {
    /**
     * Gamification API's proxy url
     */
    GamificationProxyUrl: string;
    /**
     * Virtual store is shown in an iframe. The url for the iframe should be given here.
     */
    TVirtualStoreUrl:  string;
}
