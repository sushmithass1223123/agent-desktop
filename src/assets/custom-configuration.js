/**
 * To load window based custom configuration
 */

/**
 * SSO auth mettings
 */
var ssoAuthSettings = {
    msTeams: {
        appId: '6cec53f1-82f1-44ce-92bb-ce5157e3232f',
        redirectUri: 'https://localhost:4200/agent-desktop-dice/sso/msteams',
        subscriptionUri: 'https://tcmmsteamsapi.qa.tetherfi.cloud',
        tetherfiOrganization: 'DICE',
        scopes: [
            'Notifications.ReadWrite.CreatedByApp',
            'Presence.Read',
            'Presence.Read.All',
            'Presence.ReadWrite',
            'TeamsActivity.Read',
            'TeamsActivity.Send',
            'Team.ReadBasic.All',
            'TeamsAppInstallation.ReadForChat',
            'TeamsAppInstallation.ReadForTeam',
            'TeamsAppInstallation.ReadForUser',
            'TeamsAppInstallation.ReadWriteForChat',
            'TeamsAppInstallation.ReadWriteForTeam',
            'TeamsAppInstallation.ReadWriteForUser',
            'TeamsAppInstallation.ReadWriteSelfForChat',
            'TeamsAppInstallation.ReadWriteSelfForTeam',
            'TeamsAppInstallation.ReadWriteSelfForUser',
            'User.Read',
            'User.Read.All',
            'User.ReadBasic.All',
            'User.ReadWrite',
            'User.ReadWrite.All',
            'Group.ReadWrite.All',
            'UserActivity.ReadWrite.CreatedByApp',
            'UserNotification.ReadWrite.CreatedByApp'
        ]
    }
};
