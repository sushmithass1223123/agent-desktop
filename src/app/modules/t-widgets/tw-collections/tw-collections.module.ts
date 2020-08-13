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
    ],
    imports: [
        SharedModule,
        TwWrapperModule
    ]
})
export class TwCollectionsModule { }
