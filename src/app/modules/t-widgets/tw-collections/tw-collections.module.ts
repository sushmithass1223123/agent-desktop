import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwWrapperModule } from '../tw-wrapper/tw-wrapper.module';
import { TwAccountInformationComponent } from './tw-account-information/tw-account-information.component';
import { TwAdCallbacksComponent } from './tw-ad-callbacks/tw-ad-callbacks.component';
import { TwAdFeedbackComponent } from './tw-ad-feedback/tw-ad-feedback.component';
import { TwAdGamificationComponent } from './tw-ad-gamification/tw-ad-gamification.component';
import { TwAdInteractionDetailsComponent } from './tw-ad-interaction-details/tw-ad-interaction-details.component';
import { TwAdPerformanceComponent } from './tw-ad-performance/tw-ad-performance.component';
import { TwAdScoreComponent } from './tw-ad-score/tw-ad-score.component';
import { TwAdTotalAvComponent } from './tw-ad-total-av/tw-ad-total-av.component';
import { TwAdTotalCallsComponent } from './tw-ad-total-calls/tw-ad-total-calls.component';
import { TwAdTotalChatsComponent } from './tw-ad-total-chats/tw-ad-total-chats.component';
import { TwAdTotalInteractionsComponent } from './tw-ad-total-interactions/tw-ad-total-interactions.component';
import { TwAgentAssistComponent } from './tw-agent-assist/tw-agent-assist.component';
import { TwAmdocsBccComponent } from './tw-amdocs-bcc/tw-amdocs-bcc.component';
import { TwAudioControlsComponent } from './tw-audio-controls/tw-audio-controls.component';
import { TwCannedResponsesComponent } from './tw-canned-responses/tw-canned-responses.component';
import { TwChatControlsComponent } from './tw-chat-controls/tw-chat-controls.component';
import { TwChatPanelComponent } from './tw-chat-panel/tw-chat-panel.component';
import { TwCustomComponent } from './tw-custom/tw-custom.component';
import { TwCustomerDetailsComponent } from './tw-customer-details/tw-customer-details.component';
import { TwCustomerJourneyComponent } from './tw-customer-journey/tw-customer-journey.component';
import { TwCustomerSentimentComponent } from './tw-customer-sentiment/tw-customer-sentiment.component';
import { TwHeatMapComponent } from './tw-heat-map/tw-heat-map.component';
import { TwInteractionSelectorComponent } from './tw-interaction-selector/tw-interaction-selector.component';
import { TwPanelComponent } from './tw-panel/tw-panel.component';
import { TwSampleComponent } from './tw-sample/tw-sample.component';
import { TwSuActiveAgentsComponent } from './tw-su-active-agents/tw-su-active-agents.component';
import { TwSuAgentActivityDetailsComponent } from './tw-su-agent-activity/tw-su-agent-activity-details/tw-su-agent-activity-details.component';
import { TwSuAgentActivityComponent } from './tw-su-agent-activity/tw-su-agent-activity.component';
import { TwSuCallsInQueueComponent } from './tw-su-calls-in-queue/tw-su-calls-in-queue.component';
import { TwSuChannelsStatusComponent } from './tw-su-channels-status/tw-su-channels-status.component';
import { TwSuChannelsComponent } from './tw-su-channels/tw-su-channels.component';
import { TwSuGamificationComponent } from './tw-su-gamification/tw-su-gamification.component';
import { TwSuStatusComponent } from './tw-su-status/tw-su-status.component';
import { TwSuTotalCallsComponent } from './tw-su-total-calls/tw-su-total-calls.component';
import { TwSuTransferredConferencedCallsComponent } from './tw-su-transferred-conferenced-calls/tw-su-transferred-conferenced-calls.component';
import { TwWorkCodesComponent } from './tw-work-codes/tw-work-codes.component';
import { TwUnknownComponent } from './tw-unknown/tw-unknown.component';
import { TwVideoControlsComponent } from './tw-video-controls/tw-video-controls.component';
import { TwVoiceControlsComponent } from './tw-voice-controls/tw-voice-controls.component';
import { TwVoicePanelComponent } from './tw-voice-panel/tw-voice-panel.component';
import { TwWallboardComponent } from './tw-wallboard/tw-wallboard.component';
import { TwAuxStatusChartComponent } from './tw-aux-status-chart/tw-aux-status-chart.component';
import { TwAhtTcComponent } from './tw-aht-tc/tw-aht-tc.component';
import { TwSuIntentListComponent } from './tw-su-intent-list/tw-su-intent-list.component';
import { TwRegisterCallbackComponent } from './tw-register-callback/tw-register-callback.component';
const collectionComponents = [
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
    TwSuTransferredConferencedCallsComponent,
    TwSuChannelsStatusComponent,
    TwSuChannelsComponent,
    TwSuStatusComponent,
    TwAdFeedbackComponent,
    TwAdGamificationComponent,
    TwAdPerformanceComponent,
    TwAdScoreComponent,
    TwSuGamificationComponent,
    TwSuActiveAgentsComponent,
    TwWorkCodesComponent,
    TwSuAgentActivityComponent,
    TwPanelComponent,
    TwSuAgentActivityDetailsComponent,
    TwAmdocsBccComponent,
    TwAccountInformationComponent,
    TwCannedResponsesComponent,
    TwAgentAssistComponent,
    TwCustomerSentimentComponent,
    TwAudioControlsComponent,
    TwVideoControlsComponent,
    TwAuxStatusChartComponent,
    TwAhtTcComponent,
    TwSuIntentListComponent,
    TwRegisterCallbackComponent
];

@NgModule({
    declarations: collectionComponents,
    imports: [SharedModule, TwWrapperModule],
    exports: collectionComponents
})
export class TwCollectionsModule {}
