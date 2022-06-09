import { SSOAuthSettings } from 'app/interfaces';

declare const ssoAuthSettings: SSOAuthSettings;

export const MsTeamsOAuthSettings = {
    appId: ssoAuthSettings.msTeams.appId || '',
    redirectUri: ssoAuthSettings.msTeams.redirectUri || location.href,
    subscriptionUri: ssoAuthSettings.msTeams.subscriptionUri || location.origin,
    tetherfiOrganization: ssoAuthSettings.msTeams.tetherfiOrganization || 'Tetherfi',
    scopes: ssoAuthSettings.msTeams.scopes || ['user.read', 'mailboxsettings.read', 'calendars.readwrite']
};
