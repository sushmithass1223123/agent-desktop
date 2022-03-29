import { Widget } from '../core';

/**
 * tw-agent-details widget shows the details of the agent informarion
 * ```json
 *  {
 *      "Name": "Agent Details",
 *      "Description": "",
 *      "Type": "tw-agent-details",
 *      "Config": { "Enabled": true },
 *      "Data": {
 *      "ProfilePicture": true,
 *      "Status": true,
 *      "AuxCodes": { "Enabled": true, "ByTeam": true, "DefaultACW": false, "DefaultLogout": false }
 *      }
 *  }
 */
export interface TwAgentDetails extends Widget<TwAgentDetailsData> {}

/**
 * Data config if the tw-agent-details widget
 */
export type TwAgentDetailsData = {
    /**
     * Flag to show profile picture
     */
    ProfilePicture: boolean;
    /**
     * Flag to show agent status
     */
    Status: boolean;
    /**
     * Auxcodes ref
     */
    AuxCodes: TwAgentDetailsAuxCodeConfig;
};

/**
 * Auxcodes ref
 */
export type TwAgentDetailsAuxCodeConfig = {
    /**
     * Flag to enable this config
     */
    Enabled: boolean;
    /**
     * Flag to load aux codes by team
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
