import { SSOAuthSettings } from 'app/interfaces';

declare const ssoAuthSettings: SSOAuthSettings;

export const MsTeamsOAuthSettings = {
    appId: ssoAuthSettings.msTeams.appId ?? '7d503b82-ae8a-41e9-b570-8c4d403794c9',
    redirectUri: ssoAuthSettings.msTeams.redirectUri ?? location.origin,
    subscriptionUri: ssoAuthSettings.msTeams.subscriptionUri ?? location.origin,
    tetherfiOrganization: ssoAuthSettings.msTeams.tetherfiOrganization ?? 'Tetherfi',
    scopes: ssoAuthSettings.msTeams.scopes ?? ['user.read', 'mailboxsettings.read', 'calendars.readwrite']
};
