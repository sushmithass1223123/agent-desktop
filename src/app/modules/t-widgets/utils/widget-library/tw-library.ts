import { Type } from '@angular/core';
import { TwAccountInformationComponent } from '@modules/t-widgets/tw-collections/tw-account-information/tw-account-information.component';
import { TwAdCallbacksComponent } from '@modules/t-widgets/tw-collections/tw-ad-callbacks/tw-ad-callbacks.component';
import { TwAdFeedbackComponent } from '@modules/t-widgets/tw-collections/tw-ad-feedback/tw-ad-feedback.component';
import { TwAdGamificationComponent } from '@modules/t-widgets/tw-collections/tw-ad-gamification/tw-ad-gamification.component';
import { TwAdInteractionDetailsComponent } from '@modules/t-widgets/tw-collections/tw-ad-interaction-details/tw-ad-interaction-details.component';
import { TwAdPerformanceComponent } from '@modules/t-widgets/tw-collections/tw-ad-performance/tw-ad-performance.component';
import { TwAdScoreComponent } from '@modules/t-widgets/tw-collections/tw-ad-score/tw-ad-score.component';
import { TwAdTotalInteractionsComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-interactions/tw-ad-total-interactions.component';
import { TwAgentAssistComponent } from '@modules/t-widgets/tw-collections/tw-agent-assist/tw-agent-assist.component';
import { TwAhtTcComponent } from '@modules/t-widgets/tw-collections/tw-aht-tc/tw-aht-tc.component';
import { TwAmdocsBccComponent } from '@modules/t-widgets/tw-collections/tw-amdocs-bcc/tw-amdocs-bcc.component';
import { TwAudioControlsComponent } from '@modules/t-widgets/tw-collections/tw-audio-controls/tw-audio-controls.component';
import { TwAuxStatusChartComponent } from '@modules/t-widgets/tw-collections/tw-aux-status-chart/tw-aux-status-chart.component';
import { TwCannedResponsesComponent } from '@modules/t-widgets/tw-collections/tw-canned-responses/tw-canned-responses.component';
import { TwChatPanelComponent } from '@modules/t-widgets/tw-collections/tw-chat-panel/tw-chat-panel.component';
import { TwCustomComponent } from '@modules/t-widgets/tw-collections/tw-custom/tw-custom.component';
import { TwCustomerSentimentComponent } from '@modules/t-widgets/tw-collections/tw-customer-sentiment/tw-customer-sentiment.component';
import { TwPieChartComponent } from '@modules/t-widgets/tw-collections/tw-pie-chart/tw-pie-chart.component';
import { TwRegisterCallbackComponent } from '@modules/t-widgets/tw-collections/tw-register-callback/tw-register-callback.component';
import { TwSampleComponent } from '@modules/t-widgets/tw-collections/tw-sample/tw-sample.component';
import { TwSuActiveAgentsComponent } from '@modules/t-widgets/tw-collections/tw-su-active-agents/tw-su-active-agents.component';
import { TwSuAgentActivityComponent } from '@modules/t-widgets/tw-collections/tw-su-agent-activity/tw-su-agent-activity.component';
import { TwSuAgentInteractionsComponent } from '@modules/t-widgets/tw-collections/tw-su-agent-interactions/tw-su-agent-interactions.component';
import { TwSuCallsInQueueComponent } from '@modules/t-widgets/tw-collections/tw-su-calls-in-queue/tw-su-calls-in-queue.component';
import { TwSuChannelsComponent } from '@modules/t-widgets/tw-collections/tw-su-channels/tw-su-channels.component';
import { TwSuGamificationComponent } from '@modules/t-widgets/tw-collections/tw-su-gamification/tw-su-gamification.component';
import { TwSuIntentListComponent } from '@modules/t-widgets/tw-collections/tw-su-intent-list/tw-su-intent-list.component';
import { TwSuStatusComponent } from '@modules/t-widgets/tw-collections/tw-su-status/tw-su-status.component';
import { TwUnknownComponent } from '@modules/t-widgets/tw-collections/tw-unknown/tw-unknown.component';
import { TwVideoControlsComponent } from '@modules/t-widgets/tw-collections/tw-video-controls/tw-video-controls.component';
import { TwVoiceBotTranscriptsComponent } from '@modules/t-widgets/tw-collections/tw-voice-bot-transcripts/tw-voice-bot-transcripts.component';
import { TwVoicePanelComponent } from '@modules/t-widgets/tw-collections/tw-voice-panel/tw-voice-panel.component';
import { TwWallboardComponent } from '@modules/t-widgets/tw-collections/tw-wallboard/tw-wallboard.component';
import { TwWorkCodesComponent } from '@modules/t-widgets/tw-collections/tw-work-codes/tw-work-codes.component';
import { TwWorkbenchPanelComponent } from '@modules/t-widgets/tw-collections/tw-workbench-panel/tw-workbench-panel.component';
import { TWidget } from '@modules/t-widgets/utils/t-widget';

export class TWLibrary {
    static widgetLibrary: Record<string, Type<any>> = {
        'tw-sample': TwSampleComponent,
        'tw-custom': TwCustomComponent, //
        'tw-wallboard': TwWallboardComponent, //
        'tw-voice-panel': TwVoicePanelComponent, //
        'tw-chat-panel': TwChatPanelComponent, //
        'tw-ad-total-interactions': TwAdTotalInteractionsComponent, //
        // 'tw-ad-total-calls': TwAdTotalCallsComponent,
        // 'tw-ad-total-av': TwAdTotalAvComponent,
        // 'tw-ad-total-chats': TwAdTotalChatsComponent,
        // 'tw-su-total-calls': TwSuTotalCallsComponent,
        'tw-ad-interaction-details': TwAdInteractionDetailsComponent, //
        'tw-ad-callbacks': TwAdCallbacksComponent, //
        'tw-su-calls-in-queue': TwSuCallsInQueueComponent, //
        'tw-su-channels': TwSuChannelsComponent, //
        'tw-su-status': TwSuStatusComponent, //
        'tw-su-active-agents': TwSuActiveAgentsComponent, //
        'tw-work-codes': TwWorkCodesComponent, //
        'tw-su-agent-activity': TwSuAgentActivityComponent,
        'tw-ad-feedback': TwAdFeedbackComponent, //
        'tw-ad-score': TwAdScoreComponent, //
        'tw-ad-performance': TwAdPerformanceComponent, //
        'tw-ad-gamification': TwAdGamificationComponent, //
        'tw-su-gamification': TwSuGamificationComponent, //
        'tw-amdocs-bcc': TwAmdocsBccComponent, //
        'tw-account-information': TwAccountInformationComponent, //
        'tw-canned-responses': TwCannedResponsesComponent, //
        'tw-agent-assist': TwAgentAssistComponent, //
        'tw-customer-sentiment': TwCustomerSentimentComponent, //
        'tw-audio-controls': TwAudioControlsComponent,
        'tw-video-controls': TwVideoControlsComponent,
        'tw-aux-status-chart': TwAuxStatusChartComponent, //
        'tw-aht-tc': TwAhtTcComponent, //
        'tw-su-intent-list': TwSuIntentListComponent, //
        'tw-voice-bot-transcripts': TwVoiceBotTranscriptsComponent, //
        'tw-register-callback': TwRegisterCallbackComponent, //
        'tw-su-agent-interactions': TwSuAgentInteractionsComponent,
        'tw-pie-chart': TwPieChartComponent,
        'tw-workbench-panel': TwWorkbenchPanelComponent
    };

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
