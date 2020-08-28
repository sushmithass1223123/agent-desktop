import { Type } from '@angular/core';
import { TwAccountInformationComponent } from '@modules/t-widgets/tw-collections/tw-account-information/tw-account-information.component';
import { TwAdCallbacksComponent } from '@modules/t-widgets/tw-collections/tw-ad-callbacks/tw-ad-callbacks.component';
import { TwAdFeedbackComponent } from '@modules/t-widgets/tw-collections/tw-ad-feedback/tw-ad-feedback.component';
import { TwAdGamificationComponent } from '@modules/t-widgets/tw-collections/tw-ad-gamification/tw-ad-gamification.component';
import { TwAdInteractionDetailsComponent } from '@modules/t-widgets/tw-collections/tw-ad-interaction-details/tw-ad-interaction-details.component';
import { TwAdPerformanceComponent } from '@modules/t-widgets/tw-collections/tw-ad-performance/tw-ad-performance.component';
import { TwAdScoreComponent } from '@modules/t-widgets/tw-collections/tw-ad-score/tw-ad-score.component';
import { TwAdTotalAvComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-av/tw-ad-total-av.component';
import { TwAdTotalCallsComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-calls/tw-ad-total-calls.component';
import { TwAdTotalChatsComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-chats/tw-ad-total-chats.component';
import { TwAdTotalInteractionsComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-interactions/tw-ad-total-interactions.component';
import { TwAmdocsBccComponent } from '@modules/t-widgets/tw-collections/tw-amdocs-bcc/tw-amdocs-bcc.component';
import { TwCannedResponsesComponent } from '@modules/t-widgets/tw-collections/tw-canned-responses/tw-canned-responses.component';
import { TwChatControlsComponent } from '@modules/t-widgets/tw-collections/tw-chat-controls/tw-chat-controls.component';
import { TwChatPanelComponent } from '@modules/t-widgets/tw-collections/tw-chat-panel/tw-chat-panel.component';
import { TwCustomComponent } from '@modules/t-widgets/tw-collections/tw-custom/tw-custom.component';
import { TwCustomerJourneyComponent } from '@modules/t-widgets/tw-collections/tw-customer-journey/tw-customer-journey.component';
import { TwHeatMapComponent } from '@modules/t-widgets/tw-collections/tw-heat-map/tw-heat-map.component';
import { TwSampleComponent } from '@modules/t-widgets/tw-collections/tw-sample/tw-sample.component';
import { TwSuActiveAgentsComponent } from '@modules/t-widgets/tw-collections/tw-su-active-agents/tw-su-active-agents.component';
import { TwSuAgentActivityComponent } from '@modules/t-widgets/tw-collections/tw-su-agent-activity/tw-su-agent-activity.component';
import { TwSuAverageHandleTimeComponent } from '@modules/t-widgets/tw-collections/tw-su-average-handle-time/tw-su-average-handle-time.component';
import { TwSuCallsInQueueComponent } from '@modules/t-widgets/tw-collections/tw-su-calls-in-queue/tw-su-calls-in-queue.component';
import { TwSuChannelsStatusComponent } from '@modules/t-widgets/tw-collections/tw-su-channels-status/tw-su-channels-status.component';
import { TwSuChannelsComponent } from '@modules/t-widgets/tw-collections/tw-su-channels/tw-su-channels.component';
import { TwSuGamificationComponent } from '@modules/t-widgets/tw-collections/tw-su-gamification/tw-su-gamification.component';
import { TwSuStatusComponent } from '@modules/t-widgets/tw-collections/tw-su-status/tw-su-status.component';
import { TwSuTotalCallsComponent } from '@modules/t-widgets/tw-collections/tw-su-total-calls/tw-su-total-calls.component';
import { TwSuTransferredConferencedCallsComponent } from '@modules/t-widgets/tw-collections/tw-su-transferred-conferenced-calls/tw-su-transferred-conferenced-calls.component';
import { TwSuWorkCodesComponent } from '@modules/t-widgets/tw-collections/tw-su-work-codes/tw-su-work-codes.component';
import { TwUnknownComponent } from '@modules/t-widgets/tw-collections/tw-unknown/tw-unknown.component';
import { TwVoiceControlsComponent } from '@modules/t-widgets/tw-collections/tw-voice-controls/tw-voice-controls.component';
import { TwVoicePanelComponent } from '@modules/t-widgets/tw-collections/tw-voice-panel/tw-voice-panel.component';
import { TwWallboardComponent } from '@modules/t-widgets/tw-collections/tw-wallboard/tw-wallboard.component';
import { TWidget } from '@modules/t-widgets/utils/t-widget';

export class TWLibrary {
    static widgetLibrary: Record<string, Type<any>> = {
        'tw-sample': TwSampleComponent,
        'tw-custom': TwCustomComponent,
        'tw-wallboard': TwWallboardComponent,
        'tw-voice-panel': TwVoicePanelComponent,
        'tw-chat-panel': TwChatPanelComponent,
        'tw-chat-controls': TwChatControlsComponent,
        'tw-heat-map': TwHeatMapComponent,
        'tw-ad-total-calls': TwAdTotalCallsComponent,
        'tw-ad-total-interactions': TwAdTotalInteractionsComponent,
        'tw-ad-total-av': TwAdTotalAvComponent,
        'tw-ad-total-chats': TwAdTotalChatsComponent,
        'tw-ad-interaction-details': TwAdInteractionDetailsComponent,
        'tw-ad-callbacks': TwAdCallbacksComponent,
        'tw-su-total-calls': TwSuTotalCallsComponent,
        'tw-su-calls-in-queue': TwSuCallsInQueueComponent,
        'tw-su-average-handle-time': TwSuAverageHandleTimeComponent,
        'tw-su-transferred-conferenced-calls': TwSuTransferredConferencedCallsComponent,
        'tw-su-channels-status': TwSuChannelsStatusComponent,
        'tw-su-channels': TwSuChannelsComponent,
        'tw-su-status': TwSuStatusComponent,
        'tw-voice-controls': TwVoiceControlsComponent,
        'tw-su-active-agents': TwSuActiveAgentsComponent,
        'tw-su-work-codes': TwSuWorkCodesComponent,
        'tw-su-agent-activity': TwSuAgentActivityComponent,
        'tw-ad-feedback': TwAdFeedbackComponent,
        'tw-ad-score': TwAdScoreComponent,
        'tw-ad-performance': TwAdPerformanceComponent,
        'tw-ad-gamification': TwAdGamificationComponent,
        'tw-ad-customer-journey': TwCustomerJourneyComponent,
        'tw-su-gamification': TwSuGamificationComponent,
        'tw-amdocs-bcc': TwAmdocsBccComponent,
        'tw-account-information': TwAccountInformationComponent,
        'tw-canned-responses': TwCannedResponsesComponent,
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
