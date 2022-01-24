/**
 * To load window based custom configuration
 */

/**
 * SSO auth mettings
 */
var ssoAuthSettings = {
    msTeams: {
        clientId: '9403399d-0720-48d4-bf6e-14f0f421007e',
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
