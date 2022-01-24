import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
import * as microsoftTeams from '@microsoft/teams-js';
import { SharedWrapper } from '@modules/t-widgets/utils';
import { TUtils } from '@tmac/sdk';
import { MsTeamsOAuthSettings } from 'app/constants';
import { MsTeamAuthSettings } from 'app/interfaces';
/**
 * Microsoft teams authentication service
 */
@Injectable({
    providedIn: 'root'
})
export class MsTeamsAuthService extends SharedWrapper {
    private _context: microsoftTeams.Context;
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
    authSettings: MsTeamAuthSettings;

    constructor(private _msalService: MsalService) {
        // intialize
        super('MsTeamsAuthService');

        this.authSettings = MsTeamsOAuthSettings;

        /* const accounts = this._msalService.instance.getAllAccounts();
        this.authSettings = MsTeamsOAuthSettings;
        this.authenticated = accounts.length > 0;
        if (this.authenticated) {
            this._msalService.instance.setActiveAccount(accounts[0]);
        }

        this.getUser().then((user) => {
            this.user = user;
        }); */
    }

    /**
     * To set subscriptions
     *
     * @param userId
     * @param userName
     *  @param token
     * @returns
     */
    async setSubscriptions(userId: string, userName: string, token: string, organization: string): Promise<Results> {
        try {
            this.logger.debug(`setSubscriptions: userId : ${userId}, userName : ${userName} , organization : ${organization}`, false);

            const { response } = await TUtils.HttpClient.sendRequest({
                urls: [`${this.authSettings.subscriptionUri}/omini/${organization}/subscribe/user/${userId}`],
                header: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                requestArgs: {
                    userName
                }
            });

            return new Results(true, 'setSubscriptions', response);
        } catch (error) {
            this.logger.error(`setSubscriptions`, error, false);
            return new Results(false, 'setSubscriptions');
        }
    }

    /**
     * Prompt the user to sign in and grant consent to the requested permission scopes
     * @returns
     */
    async signIn(): Promise<Results> {
        this.logger.debug(`signIn`, false);
        return new Promise<Results>((resolve, reject) => {
            try {
                this.logger.debug(`signIn.initialize`, false);
                microsoftTeams.initialize(() => {
                    this.logger.debug(`signIn.getContext`, false);
                    microsoftTeams.getContext((context: microsoftTeams.Context) => {
                        this._context = context;
                        // try to haddle this with bindCallback
                        const _this = this;
                        microsoftTeams.authentication.getAuthToken({
                            successCallback: (result) => {
                                this.logger.debug(`signIn.successCallback: result=${result}`, false);
                                const lanId = _this._context?.userPrincipalName?.split('@')[0];
                                _this
                                    .setSubscriptions(_this._context.userObjectId ?? '', lanId, result, _this.authSettings.tetherfiOrganization)
                                    .then((res) => {
                                        this.logger.debug(`signIn.setSubscriptions: result=${res}`, false);
                                    })
                                    .catch((error) => {
                                        this.logger.error(`signIn.setSubscriptions`, error, false);
                                    });
                                resolve(
                                    new Results(true, 'authenticated', {
                                        user: { email: _this._context.userPrincipalName, ..._this._context },
                                        token: result
                                    })
                                );
                            },
                            failureCallback: (error) => {
                                this.logger.error(`signIn.failureCallback`, error, false);
                                reject(
                                    new Results(false, 'fail to authenticate', {
                                        user: { email: _this._context.userPrincipalName, ..._this._context },
                                        error
                                    })
                                );
                            }
                        });
                    });
                });
            } catch (error) {
                this.logger.error(`signIn`, error, false);
                reject(new Results(false, 'fail to authenticate', error));
            }
        });
    }

    /**
     * To sign out the user
     */
    async signOut(): Promise<void> {
        try {
            this.logger.debug(`signOut`, false);
            await this._msalService.logoutPopup().toPromise();
            this.user = undefined;
            this.authenticated = false;
        } catch (error) {
            this.logger.error(`signOut`, error, false);
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
