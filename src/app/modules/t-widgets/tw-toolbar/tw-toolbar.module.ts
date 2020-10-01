import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwActiveInteractionsComponent } from './tw-active-interactions/tw-active-interactions.component';
import { TwAgentDetailsComponent } from './tw-agent-details/tw-agent-details.component';
import { TwAuxCodesComponent } from './tw-aux-codes/tw-aux-codes.component';
import { TwAuxTimerComponent } from './tw-aux-timer/tw-aux-timer.component';
import { TwBroadcastComponent } from './tw-broadcast/tw-broadcast.component';
import { TwCreateInteractionComponent } from './tw-create-interaction/tw-create-interaction.component';
import { TwInstantMessagingComponent } from './tw-instant-messaging/tw-instant-messaging.component';
import { TwLogoutComponent } from './tw-logout/tw-logout.component';
import { TwNotificationsComponent } from './tw-notifications/tw-notifications.component';
import { TwToolbarMenuComponent } from './tw-toolbar-menu/tw-toolbar-menu.component';

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
    TwCreateInteractionComponent
];

@NgModule({
    declarations: toolbarComponents,
    imports: [SharedModule],
    exports: toolbarComponents
})
export class TwToolbarModule {}
