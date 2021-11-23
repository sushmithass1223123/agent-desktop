export interface TwAgentDetails {
    /**
     * To show profile picture
     */
    ProfilePicture: boolean;
    /**
     * To show agent status
     */
    Status: boolean;
    /**
     * Auxcodes ref
     */
    AuxCodes: TwAgentDetailsAuxCodeConfig;
}

export interface TwAgentDetailsAuxCodeConfig {
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
}
