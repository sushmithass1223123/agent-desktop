export interface SSOAuthSettings {
    /**
     * Microsoft Teams auth settings
     */
    msTeams: MsTeamAuthSettings;
}

export interface MsTeamAuthSettings {
    /**
     * The client ID is the unique application (client) ID assigned to your app by Azure AD when the app was registered
     */
    clientId: string;
    /**
     * The redirect URI is the URI the identity provider will send the security tokens back to
     */
    redirectUri: string;
    /**
     * subscription Url - tcm_ms_teams_api service endpoint
     */
    subscriptionUri: string;
    /**
     * tetherfi Organization - tetherfi side organization, late we can get this from token
     */
    tetherfiOrganization: string;
    /**
     * The permission scopes
     */
    scopes: string[];
}
