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
import { TwAgentAssistComponent } from './tw-agent-assist/tw-agent-assist.component';
import { TwAhtTcComponent } from './tw-aht-tc/tw-aht-tc.component';
import { TwAmdocsBccComponent } from './tw-amdocs-bcc/tw-amdocs-bcc.component';
import { TwAudioVideoControlsComponent } from './tw-audio-video-controls/tw-audio-video-controls.component';
import { TwCalendarModule } from './tw-calendar/tw-calendar.module';
import { TwCampaignContactComponent } from './tw-campaign-contact/tw-campaign-contact.component';
import { TwCannedResponsesComponent } from './tw-canned-responses/tw-canned-responses.component';
import { TwChatControlsModule } from './tw-chat-controls/tw-chat-controls.module';
import { TwChatPanelComponent } from './tw-chat-panel/tw-chat-panel.component';
import { TwComposeMessagingComponent } from './tw-compose-messaging/tw-compose-messaging.component';
import { TwCustomComponent } from './tw-custom/tw-custom.component';
import { TwCustomerDetailsComponent } from './tw-customer-details/tw-customer-details.component';
import { TwCustomerJourneyComponent } from './tw-customer-journey/tw-customer-journey.component';
import { TwCustomerSentimentComponent } from './tw-customer-sentiment/tw-customer-sentiment.component';
import { TwDeflectToDigitalComponent } from './tw-deflect-to-digital/tw-deflect-to-digital.component';
import { TwEmailControlsComponent } from './tw-email-controls/tw-email-controls.component';
import { TwEmailPanelComponent } from './tw-email-panel/tw-email-panel.component';
import { TwEmailTemplatePreviewComponent } from './tw-email-template-preview/tw-email-template-preview.component';
import { TwEntitiesComponent } from './tw-entities/tw-entities.component';
import { TwFaxControlsComponent } from './tw-fax-controls/tw-fax-controls.component';
import { TwFaxPanelComponent } from './tw-fax-panel/tw-fax-panel.component';
import { RaceCarTrackComponent } from './tw-gamification/race-car-track/race-car-track.component';
import { TwGamificationComponent } from './tw-gamification/tw-gamification.component';
import { TwGenericControlsComponent } from './tw-generic-controls/tw-generic-controls.component';
import { TwGenericPanelComponent } from './tw-generic-panel/tw-generic-panel.component';
import { TwPanelComponent } from './tw-panel/tw-panel.component';
import { TwPendingCallbacksComponent } from './tw-pending-callbacks/tw-pending-callbacks.component';
import { TwPieChartComponent } from './tw-pie-chart/tw-pie-chart.component';
import { TwRegisterCallbackComponent } from './tw-register-callback/tw-register-callback.component';
import { TwSampleComponent } from './tw-sample/tw-sample.component';
import { TwSuActiveAgentsComponent } from './tw-su-active-agents/tw-su-active-agents.component';
import { TwSuAgentActivityDetailsComponent } from './tw-su-agent-activity/tw-su-agent-activity-details/tw-su-agent-activity-details.component';
import { TwSuAgentActivityComponent } from './tw-su-agent-activity/tw-su-agent-activity.component';
import { TwSuAgentInteractionsComponent } from './tw-su-agent-interactions/tw-su-agent-interactions.component';
import { TwSuGamificationComponent } from './tw-su-gamification/tw-su-gamification.component';
import { TwUnknownComponent } from './tw-unknown/tw-unknown.component';
import { TwUserLocationComponent } from './tw-user-location/tw-user-location.component';
import { TwVoiceBotTranscriptsComponent } from './tw-voice-bot-transcripts/tw-voice-bot-transcripts.component';
import { TwVoiceCannedResponsesComponent } from './tw-voice-canned-responses/tw-voice-canned-responses.component';
import { TwVoiceControlsComponent } from './tw-voice-controls/tw-voice-controls.component';
import { TwVoicePanelComponent } from './tw-voice-panel/tw-voice-panel.component';
import { TwWallboardComponent } from './tw-wallboard/tw-wallboard.component';
import { TwWorkCodesComponent } from './tw-work-codes/tw-work-codes.component';
import { TwWorkbenchPanelModule } from './tw-workbench-panel/tw-workbench-panel.module';

/**
 * Collections components
 */
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
    TwAdInteractionDetailsComponent,
    TwAdCallbacksComponent,
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
    TwAhtTcComponent,
    TwVoiceBotTranscriptsComponent,
    TwRegisterCallbackComponent,
    TwSuAgentInteractionsComponent,
    TwPieChartComponent,
    TwVoiceCannedResponsesComponent,
    TwEmailPanelComponent,
    TwEmailControlsComponent,
    TwPendingCallbacksComponent,
    TwGamificationComponent,
    RaceCarTrackComponent,
    TwEntitiesComponent,
    TwEmailTemplatePreviewComponent,
    TwUserLocationComponent,
    TwFaxPanelComponent,
    TwFaxControlsComponent,
    TwGenericPanelComponent,
    TwGenericControlsComponent,
    TwAudioVideoControlsComponent,
    TwCampaignContactComponent,
    TwComposeMessagingComponent,
    TwDeflectToDigitalComponent
];

/**
 * Widgets Collections Module
 */
@NgModule({
    declarations: collectionComponents,
    imports: [SharedModule, TwWrapperModule, TwChatControlsModule, TwWorkbenchPanelModule, TwCalendarModule],
    exports: collectionComponents
})
export class TwCollectionsModule {}
