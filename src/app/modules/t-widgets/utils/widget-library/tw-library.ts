import { Type } from '@angular/core';
import { TwAccountInformationComponent } from '@modules/t-widgets/tw-collections/tw-account-information/tw-account-information.component';
import { TwAdCallbacksComponent } from '@modules/t-widgets/tw-collections/tw-ad-callbacks/tw-ad-callbacks.component';
import { TwAdFeedbackComponent } from '@modules/t-widgets/tw-collections/tw-ad-feedback/tw-ad-feedback.component';
import { TwAdGamificationComponent } from '@modules/t-widgets/tw-collections/tw-ad-gamification/tw-ad-gamification.component';
import { TwAdInteractionDetailsComponent } from '@modules/t-widgets/tw-collections/tw-ad-interaction-details/tw-ad-interaction-details.component';
import { TwAdPerformanceComponent } from '@modules/t-widgets/tw-collections/tw-ad-performance/tw-ad-performance.component';
import { TwAdScoreComponent } from '@modules/t-widgets/tw-collections/tw-ad-score/tw-ad-score.component';
import { TwAgentAssistComponent } from '@modules/t-widgets/tw-collections/tw-agent-assist/tw-agent-assist.component';
import { TwAhtTcComponent } from '@modules/t-widgets/tw-collections/tw-aht-tc/tw-aht-tc.component';
import { TwAmdocsBccComponent } from '@modules/t-widgets/tw-collections/tw-amdocs-bcc/tw-amdocs-bcc.component';
import { TwAudioControlsComponent } from '@modules/t-widgets/tw-collections/tw-audio-controls/tw-audio-controls.component';
import { TwCannedResponsesComponent } from '@modules/t-widgets/tw-collections/tw-canned-responses/tw-canned-responses.component';
import { TwChatPanelComponent } from '@modules/t-widgets/tw-collections/tw-chat-panel/tw-chat-panel.component';
import { TwCustomComponent } from '@modules/t-widgets/tw-collections/tw-custom/tw-custom.component';
import { TwCustomerSentimentComponent } from '@modules/t-widgets/tw-collections/tw-customer-sentiment/tw-customer-sentiment.component';
import { TwEmailControlsComponent } from '@modules/t-widgets/tw-collections/tw-email-controls/tw-email-controls.component';
import { TwEmailPanelComponent } from '@modules/t-widgets/tw-collections/tw-email-panel/tw-email-panel.component';
import { TwGamificationComponent } from '@modules/t-widgets/tw-collections/tw-gamification/tw-gamification.component';
import { TwPendingCallbacksComponent } from '@modules/t-widgets/tw-collections/tw-pending-callbacks/tw-pending-callbacks.component';
import { TwPieChartComponent } from '@modules/t-widgets/tw-collections/tw-pie-chart/tw-pie-chart.component';
import { TwRegisterCallbackComponent } from '@modules/t-widgets/tw-collections/tw-register-callback/tw-register-callback.component';
import { TwSampleComponent } from '@modules/t-widgets/tw-collections/tw-sample/tw-sample.component';
import { TwSuActiveAgentsComponent } from '@modules/t-widgets/tw-collections/tw-su-active-agents/tw-su-active-agents.component';
import { TwSuAgentActivityComponent } from '@modules/t-widgets/tw-collections/tw-su-agent-activity/tw-su-agent-activity.component';
import { TwSuAgentInteractionsComponent } from '@modules/t-widgets/tw-collections/tw-su-agent-interactions/tw-su-agent-interactions.component';
import { TwSuGamificationComponent } from '@modules/t-widgets/tw-collections/tw-su-gamification/tw-su-gamification.component';
import { TwUnknownComponent } from '@modules/t-widgets/tw-collections/tw-unknown/tw-unknown.component';
import { TwVideoControlsComponent } from '@modules/t-widgets/tw-collections/tw-video-controls/tw-video-controls.component';
import { TwVoiceBotTranscriptsComponent } from '@modules/t-widgets/tw-collections/tw-voice-bot-transcripts/tw-voice-bot-transcripts.component';
import { TwVoiceCannedResponsesComponent } from '@modules/t-widgets/tw-collections/tw-voice-canned-responses/tw-voice-canned-responses.component';
import { TwVoicePanelComponent } from '@modules/t-widgets/tw-collections/tw-voice-panel/tw-voice-panel.component';
import { TwWallboardComponent } from '@modules/t-widgets/tw-collections/tw-wallboard/tw-wallboard.component';
import { TwWorkCodesComponent } from '@modules/t-widgets/tw-collections/tw-work-codes/tw-work-codes.component';
import { TwWorkbenchPanelComponent } from '@modules/t-widgets/tw-collections/tw-workbench-panel/tw-workbench-panel.component';
import { TWidget } from '@modules/t-widgets/utils/t-widget';

/**
 * Widgets library
 */
export class TWLibrary {
    /**
     * coded components for library
     */
    static widgetLibrary: Record<string, Type<any>> = {
        'tw-sample': TwSampleComponent,
        'tw-custom': TwCustomComponent,
        'tw-wallboard': TwWallboardComponent,
        'tw-voice-panel': TwVoicePanelComponent,
        'tw-chat-panel': TwChatPanelComponent,
        'tw-ad-interaction-details': TwAdInteractionDetailsComponent,
        'tw-ad-callbacks': TwAdCallbacksComponent,
        'tw-su-active-agents': TwSuActiveAgentsComponent,
        'tw-work-codes': TwWorkCodesComponent,
        'tw-su-agent-activity': TwSuAgentActivityComponent,
        'tw-ad-feedback': TwAdFeedbackComponent,
        'tw-ad-score': TwAdScoreComponent,
        'tw-ad-performance': TwAdPerformanceComponent,
        'tw-ad-gamification': TwAdGamificationComponent,
        'tw-su-gamification': TwSuGamificationComponent,
        'tw-amdocs-bcc': TwAmdocsBccComponent,
        'tw-account-information': TwAccountInformationComponent,
        'tw-canned-responses': TwCannedResponsesComponent,
        'tw-agent-assist': TwAgentAssistComponent,
        'tw-customer-sentiment': TwCustomerSentimentComponent,
        'tw-audio-controls': TwAudioControlsComponent,
        'tw-video-controls': TwVideoControlsComponent,
        'tw-aht-tc': TwAhtTcComponent,
        'tw-voice-bot-transcripts': TwVoiceBotTranscriptsComponent,
        'tw-register-callback': TwRegisterCallbackComponent,
        'tw-su-agent-interactions': TwSuAgentInteractionsComponent,
        'tw-pie-chart': TwPieChartComponent,
        'tw-voice-canned-responses': TwVoiceCannedResponsesComponent,
        'tw-workbench-panel': TwWorkbenchPanelComponent,
        'tw-email-panel': TwEmailPanelComponent,
        'tw-email-controls': TwEmailControlsComponent,
        'tw-pending-callbacks': TwPendingCallbacksComponent,
        'tw-gamification': TwGamificationComponent
    };

    /**
     * Get widget by type with added input data
     * @param type
     * @param data
     */

    public static getWidget(type: string, data: any): TWidget {
        const widget = this.widgetLibrary[type];
        // check the widget is found
        if (widget) {
            // retrun the widget
            return new TWidget(widget, data);
        }
        // if widget is not found return unknown widget
        return new TWidget(TwUnknownComponent, data);
    }
}
