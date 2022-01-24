import { SSOAuthSettings } from 'app/interfaces';

declare const ssoAuthSettings: SSOAuthSettings;

export const MsTeamsOAuthSettings = {
    appId: ssoAuthSettings.msTeams.clientId ?? '7d503b82-ae8a-41e9-b570-8c4d403794c9',
    redirectUri: ssoAuthSettings.msTeams.redirectUri ?? location.origin,
    subscriptionUri: ssoAuthSettings.msTeams.subscriptionUri ?? location.origin,
    tetherfiOrganization: 'DICE',
    scopes: ssoAuthSettings.msTeams.scopes ?? ['user.read', 'mailboxsettings.read', 'calendars.readwrite']
};
