import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
import { MsTeamsOAuthSettings } from 'app/constants';

/**
 * Microsoft teams authentication service
 */
@Injectable({
    providedIn: 'root'
})
export class MsTeamsAuthService {
    /**
     * Microsoft graph client ref
     */
    private _graphClient?: Client;
    /**
     * Authenticated flag
     */
    public authenticated: boolean;
    /**
     * User ref
     */
    public user?: User;
    /**
     * Teams auth setting ref
     */
    authSettings: OAuthSettings;

    constructor(private _msalService: MsalService) {
        const accounts = this._msalService.instance.getAllAccounts();
        this.authSettings = MsTeamsOAuthSettings;
        this.authenticated = accounts.length > 0;
        if (this.authenticated) {
            this._msalService.instance.setActiveAccount(accounts[0]);
        }

        this.getUser().then((user) => {
            this.user = user;
        });
    }

    /**
     * Prompt the user to sign in and grant consent to the requested permission scopes
     * @returns
     */
    async signIn(): Promise<Results> {
        try {
            const authDetails = await this._msalService
                .loginPopup(this.authSettings)
                .toPromise()
                .catch((reason) => {
                    throw new Error(JSON.stringify(reason, null, 2));
                });

            if (authDetails) {
                this._msalService.instance.setActiveAccount(authDetails.account);
                this.authenticated = true;
                this.user = await this.getUser();

                return new Results(true, 'authenticated', { authDetails, user: this.user });
            }
            return new Results(false, 'fail to authenticate');
        } catch (error) {
            throw error;
        }
    }

    /**
     * To sign out the user
     */
    async signOut(): Promise<void> {
        try {
            await this._msalService.logoutPopup().toPromise();
            this.user = undefined;
            this.authenticated = false;
        } catch (error) {
            console.error('signOut', error);
        }
    }

    /**
     * To get user
     *
     * @returns
     */
    async getUser(): Promise<User | undefined> {
        if (!this.authenticated) {
            return undefined;
        }

        // Create an authentication provider for the current user
        const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(this._msalService.instance as PublicClientApplication, {
            // tslint:disable-next-line: no-non-null-assertion
            account: this._msalService.instance.getActiveAccount()!,
            scopes: this.authSettings.scopes,
            interactionType: InteractionType.Popup
        });

        // Initialize the Graph client
        this._graphClient = Client.initWithMiddleware({
            authProvider: authProvider
        });

        // Get the user from Graph (GET /me)
        const graphUser: MicrosoftGraph.User = await this._graphClient.api('/me').select('displayName,mail,mailboxSettings,userPrincipalName').get();

        const user = new User();
        user.displayName = graphUser.displayName ?? '';
        // Prefer the mail property, but fall back to userPrincipalName
        user.email = graphUser.mail ?? graphUser.userPrincipalName ?? '';
        user.timeZone = graphUser.mailboxSettings?.timeZone ?? 'UTC';

        // Use default avatar
        user.avatar = '/assets/no-profile-photo.png';

        return user;
    }

    /**
     * To get presence
     *
     * @returns
     */
    async getPresence(): Promise<Results> {
        try {
            if (!this.authenticated) {
                return new Results(false, 'getPresence');
            }

            // Create an authentication provider for the current user
            const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(this._msalService.instance as PublicClientApplication, {
                // tslint:disable-next-line: no-non-null-assertion
                account: this._msalService.instance.getActiveAccount()!,
                scopes: this.authSettings.scopes,
                interactionType: InteractionType.Popup
            });

            // Initialize the Graph client
            this._graphClient = Client.initWithMiddleware({
                authProvider: authProvider
            });

            // Get the user from Graph (GET/me)
            const userPresence: MicrosoftGraph.Presence = await this._graphClient.api('/me/presence').get();

            return new Results(true, 'getPresence', { userPresence, user: this.user });
        } catch (error) {
            return new Results(false, 'getPresence', { error });
        }
    }

    /**
     * To set presence
     *
     * @param userId
     * @param presence
     * @returns
     */
    async setPresence(userId: string, presence: any): Promise<Results> {
        try {
            if (!this.authenticated) {
                return new Results(false, 'setPresence');
            }

            // Create an authentication provider for the current user
            const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(this._msalService.instance as PublicClientApplication, {
                // tslint:disable-next-line: no-non-null-assertion
                account: this._msalService.instance.getActiveAccount()!,
                scopes: this.authSettings.scopes,
                interactionType: InteractionType.Popup
            });

            // Initialize the Graph client
            this._graphClient = Client.initWithMiddleware({
                authProvider: authProvider
            });

            await this._graphClient.api(`/users/${userId}/presence/setPresence`).post(presence);

            return new Results(true, 'setPresence');
        } catch (error) {
            return new Results(false, 'setPresence');
        }
    }
}

/**
 * Microsoft graph client response
 */
class Results {
    /**
     * Success flag
     */
    isSuccess: boolean;
    /**
     * Response message
     */
    message: string;
    /**
     * Response result
     */
    result: any;
    /**
     * Response error
     */
    error: string;
    /**
     * Response type
     */
    type = 'success';

    constructor(isSuccess: boolean, message: string, result?: any, error: any = null, type: string = 'success') {
        this.isSuccess = isSuccess;
        this.message = message;
        this.result = result;
        this.error = error;
    }

    /**
     * To stringify
     * @returns
     */
    ToString(): string {
        return JSON.stringify(this);
    }
}

/**
 * Team user class
 */
class User {
    /**
     * Display name of user
     */
    displayName!: string;
    /**
     * Email id of user
     */
    email!: string;
    /**
     * Avatar of user
     */
    avatar!: string;
    /**
     * User timezone
     */
    timeZone!: string;
}

/**
 * Authentication setting
 */
interface OAuthSettings {
    /**
     * App Id
     */
    appId: string;
    /**
     * Redirect Url
     */
    redirectUri: string;
    /**
     * Scropes
     */
    scopes: string[];
}
