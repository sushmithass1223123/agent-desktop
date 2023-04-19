import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MsalModule, MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { BrowserCacheLocation, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';
import { SharedModule } from '@modules/shared/shared.module';
import { MsTeamsOAuthSettings } from 'app/constants';
import { LoginComponent } from './login.component';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';
let msalInstance: IPublicClientApplication | undefined;

/**
 * Microsoft AL Instance Factory
 * @returns
 */
function MSALInstanceFactory(): IPublicClientApplication {
    msalInstance =
        msalInstance ??
        new PublicClientApplication({
            auth: {
                clientId: MsTeamsOAuthSettings.appId,
                redirectUri: MsTeamsOAuthSettings.redirectUri,
                postLogoutRedirectUri: MsTeamsOAuthSettings.redirectUri
            },
            cache: {
                cacheLocation: BrowserCacheLocation.LocalStorage
            }
        });

    return msalInstance;
}

/**
 * Login Module
 */
@NgModule({
    declarations: [LoginComponent],
    providers: [
        {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory
        },
        MsalService,
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'default'
        }
    ],
    imports: [FuseProgressBarModule, FuseSharedModule, FuseSidebarModule, CommonModule, SharedModule, MsalModule,TranslocoRootModule]
})
export class LoginModule {}
