import { Widget } from '..';

/**
 * Gamification widget shows all the data of the agent from the gmification API
 * Example json:
 * ```json
 * {
 *      "Name": "Gamification Leaderboard",
 *      "Description": "",
 *      "Key": "Gamification",
 *      "Type": "tw-gamification",
 *      "Config": {
 *          "Enabled": true,
 *          "Hidden": false,
 *          "Static": false,
 *          "Anchor": false,
 *          "AOT": true,
 *          "AutoOpen": false,
 *          "Icon": "extension",
 *          "Class": "",
 *          "Position": { "X": 4, "Y": 2, "W": 1200, "H": 700 },
 *          "Actions": ["maximize", "destroy"],
 *          "ViewState": "restore",
 *          "Header": true,
 *          "Pinned": false
 *       },
 *      "Data": {
 *          "GamificationProxyUrl": "https://dice.tetherfi.cloud/GamificationProxy/Proxy.asmx",
 *          "TVirtualStoreUrl": "https://dice.tetherfi.cloud/TVirtualStore"
 *       }
 *    }
 * ```
 */
export interface TwGamification extends Widget<TwGamificationData> {}

/**
 * tw-gamification widget's Data object
 */
export type TwGamificationData = {
    /**
     * gamification api server's proxy url
     */
    GamificationProxyUrl: string;
    /**
     * Tvirtual store's url
     */
    TVirtualStoreUrl: string;
    /**
     * gamification leaderboard api's url
     */
    LeaderBoardUrl: string;
    /**
     * gamifictaion server's agent progress api url
     */
    AgentProgressUrl: string;
};
