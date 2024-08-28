import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwActiveInteractionsComponent } from './tw-active-interactions/tw-active-interactions.component';
import { TwAgentDetailsComponent } from './tw-agent-details/tw-agent-details.component';
import { TwAuxCodesComponent } from './tw-aux-codes/tw-aux-codes.component';
import { TwAuxTimerComponent } from './tw-aux-timer/tw-aux-timer.component';
import { TwToolbarCustomComponent } from './tw-toolbar-custom/tw-toolbar-custom.component';
import { TwAvailableMediaDeviceComponent } from './tw-available-media-device/tw-available-media-device.component';
import { TwBroadcastComponent } from './tw-broadcast/tw-broadcast.component';
import { TwCreateInteractionComponent } from './tw-create-interaction/tw-create-interaction.component';
import { TwInstantMessagingComponent } from './tw-instant-messaging/tw-instant-messaging.component';
import { TwLogoutComponent } from './tw-logout/tw-logout.component';
import { TwNotificationsComponent } from './tw-notifications/tw-notifications.component';
import { TwToolbarMenuComponent } from './tw-toolbar-menu/tw-toolbar-menu.component';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';
/**
 * Toolbar compoents
 */
const toolbarComponents = [
    TwActiveInteractionsComponent,
    TwAgentDetailsComponent,
    TwAuxCodesComponent,
    TwAuxTimerComponent,
    TwToolbarMenuComponent,
    TwNotificationsComponent,
    TwInstantMessagingComponent,
    TwLogoutComponent,
    TwBroadcastComponent,
    TwCreateInteractionComponent,
    TwAvailableMediaDeviceComponent,
    TwToolbarCustomComponent
];

/**
 * All components in Toolbar
 */
@NgModule({
    declarations: toolbarComponents,
    providers: [
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'default'
        }],
    imports: [TranslocoRootModule, SharedModule],
    exports: toolbarComponents
})
export class TwToolbarModule {}
