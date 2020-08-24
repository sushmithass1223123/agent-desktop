import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AvatarModule } from 'ngx-avatar';
import { TwWrapperModule } from '../tw-wrapper/tw-wrapper.module';
import { TwAdCallbacksComponent } from './tw-ad-callbacks/tw-ad-callbacks.component';
import { TwAdInteractionDetailsComponent } from './tw-ad-interaction-details/tw-ad-interaction-details.component';
import { TwAdTotalAvComponent } from './tw-ad-total-av/tw-ad-total-av.component';
import { TwAdTotalCallsComponent } from './tw-ad-total-calls/tw-ad-total-calls.component';
import { TwAdTotalChatsComponent } from './tw-ad-total-chats/tw-ad-total-chats.component';
import { TwAdTotalInteractionsComponent } from './tw-ad-total-interactions/tw-ad-total-interactions.component';
import { TwChatControlsComponent } from './tw-chat-controls/tw-chat-controls.component';
import { TwChatPanelComponent } from './tw-chat-panel/tw-chat-panel.component';
import { TwCustomComponent } from './tw-custom/tw-custom.component';
import { TwCustomerDetailsComponent } from './tw-customer-details/tw-customer-details.component';
import { TwCustomerJourneyComponent } from './tw-customer-journey/tw-customer-journey.component';
import { TwHeatMapComponent } from './tw-heat-map/tw-heat-map.component';
import { TwInteractionSelectorComponent } from './tw-interaction-selector/tw-interaction-selector.component';
import { TwSampleComponent } from './tw-sample/tw-sample.component';
import { TwSuAverageHandleTimeComponent } from './tw-su-average-handle-time/tw-su-average-handle-time.component';
import { TwSuCallsInQueueComponent } from './tw-su-calls-in-queue/tw-su-calls-in-queue.component';
import { TwSuChannelsStatusComponent } from './tw-su-channels-status/tw-su-channels-status.component';
import { TwSuChannelsComponent } from './tw-su-channels/tw-su-channels.component';
import { TwSuStatusComponent } from './tw-su-status/tw-su-status.component';
import { TwSuTotalCallsComponent } from './tw-su-total-calls/tw-su-total-calls.component';
import { TwSuTransferredConferencedCallsComponent } from './tw-su-transferred-conferenced-calls/tw-su-transferred-conferenced-calls.component';
import { TwUnknownComponent } from './tw-unknown/tw-unknown.component';
import { TwVoiceControlsComponent } from './tw-voice-controls/tw-voice-controls.component';
import { TwVoicePanelComponent } from './tw-voice-panel/tw-voice-panel.component';
import { TwWallboardComponent } from './tw-wallboard/tw-wallboard.component';
import { TwSuSkillsDashboardComponent } from './tw-su-skills-dashboard/tw-su-skills-dashboard.component';
import { TwSuActiveAgentsComponent } from './tw-su-active-agents/tw-su-active-agents.component';
import { IconNotifyCountComponent } from './tw-su-active-agents/icon-notify-count/icon-notify-count.component';
import { TwSuWorkCodesComponent } from './tw-su-work-codes/tw-su-work-codes.component';
import { TwSuAgentActivityComponent } from './tw-su-agent-activity/tw-su-agent-activity.component';
import { TwPannelComponent } from './tw-pannel/tw-pannel.component';
import { TwSuAgentActivityDetailsComponent } from './tw-su-agent-activity/tw-su-agent-activity-details/tw-su-agent-activity-details.component';

@NgModule({
    declarations: [
        TwCustomComponent,
        TwUnknownComponent,
        TwSampleComponent,
        TwWallboardComponent,
        TwVoicePanelComponent,
        TwCustomerDetailsComponent,
        TwCustomerJourneyComponent,
        TwVoiceControlsComponent,
        TwChatPanelComponent,
        TwChatControlsComponent,
        TwInteractionSelectorComponent,
        TwHeatMapComponent,
        TwAdTotalCallsComponent,
        TwAdTotalChatsComponent,
        TwAdTotalAvComponent,
        TwAdTotalInteractionsComponent,
        TwAdInteractionDetailsComponent,
        TwAdCallbacksComponent,
        TwSuTotalCallsComponent,
        TwSuCallsInQueueComponent,
        TwSuAverageHandleTimeComponent,
        TwSuTransferredConferencedCallsComponent,
        TwSuChannelsStatusComponent,
        TwSuChannelsComponent,
        TwSuStatusComponent,
        TwSuSkillsDashboardComponent,
        TwSuActiveAgentsComponent,
        IconNotifyCountComponent,
        TwSuWorkCodesComponent,
        TwSuAgentActivityComponent,
        TwPannelComponent,
        TwSuAgentActivityDetailsComponent,
    ],
    imports: [SharedModule, TwWrapperModule, NgxChartsModule, AvatarModule]
})
export class TwCollectionsModule {}
