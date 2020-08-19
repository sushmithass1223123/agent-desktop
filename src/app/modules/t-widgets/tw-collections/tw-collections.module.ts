import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwWrapperModule } from '../tw-wrapper/tw-wrapper.module';
import { TwCustomComponent } from './tw-custom/tw-custom.component';
import { TwCustomerDetailsComponent } from './tw-customer-details/tw-customer-details.component';
import { TwCustomerJourneyComponent } from './tw-customer-journey/tw-customer-journey.component';
import { TwSampleComponent } from './tw-sample/tw-sample.component';
import { TwUnknownComponent } from './tw-unknown/tw-unknown.component';
import { TwVoiceControlsComponent } from './tw-voice-controls/tw-voice-controls.component';
import { TwVoicePanelComponent } from './tw-voice-panel/tw-voice-panel.component';
import { TwWallboardComponent } from './tw-wallboard/tw-wallboard.component';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TwAdTotalCallsComponent } from './tw-ad-total-calls/tw-ad-total-calls.component';
import { TwAdTotalChatsComponent } from './tw-ad-total-chats/tw-ad-total-chats.component';
import { TwAdTotalAvComponent } from './tw-ad-total-av/tw-ad-total-av.component';
import { TwAdTotalInteractionsComponent } from './tw-ad-total-interactions/tw-ad-total-interactions.component';
import { TwAdInteractionDetailsComponent } from './tw-ad-interaction-details/tw-ad-interaction-details.component';
import { TwAdCallbacksComponent } from './tw-ad-callbacks/tw-ad-callbacks.component';
import { TwSuTotalCallsComponent } from './tw-su-total-calls/tw-su-total-calls.component';
import { TwSuCallsInQueueComponent } from './tw-su-calls-in-queue/tw-su-calls-in-queue.component';
import { TwSuAverageHandleTimeComponent } from './tw-su-average-handle-time/tw-su-average-handle-time.component';
import { TwSuTransferredConferencedCallsComponent } from './tw-su-transferred-conferenced-calls/tw-su-transferred-conferenced-calls.component';
import { TwSuChannelsStatusComponent } from './tw-su-channels-status/tw-su-channels-status.component';
import { TwSuChannelsComponent } from './tw-su-channels/tw-su-channels.component';
import { TwSuStatusComponent } from './tw-su-status/tw-su-status.component';

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
    ],
    imports: [
        SharedModule,
        TwWrapperModule,
        NgxChartsModule
    ]
})
export class TwCollectionsModule { }
