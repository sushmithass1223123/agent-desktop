import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwcCustomComponent } from './twc-custom/twc-custom.component';
import { TwcHomeComponent } from './twc-home/twc-home.component';
import { TwcSupervisorComponent } from './twc-supervisor/twc-supervisor.component';
import { TwcUnknownComponent } from './twc-unknown/twc-unknown.component';
import { TwcVoiceComponent } from './twc-voice/twc-voice.component';

import { TwTemplateModule } from 'app/modules/t-widgets/tw-template/tw-template.module';
import { TwcNoWidgetsComponent } from './twc-no-widgets/twc-no-widgets.component';

@NgModule({
    declarations: [
        TwcUnknownComponent,
        TwcCustomComponent,
        TwcHomeComponent,
        TwcSupervisorComponent,
        TwcVoiceComponent,
        TwcNoWidgetsComponent,
    ],
    imports: [
        SharedModule,
        TwTemplateModule
    ]
})
export class TwContentModule { }
