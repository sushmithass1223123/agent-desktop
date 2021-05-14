import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwTemplateModule } from 'app/modules/t-widgets/tw-template/tw-template.module';
import { TwWrapperModule } from '../tw-wrapper/tw-wrapper.module';
import { TwcCustomComponent } from './twc-custom/twc-custom.component';
import { TwcDockerComponent } from './twc-docker/twc-docker.component';
import { TwcEmailComponent } from './twc-email/twc-email.component';
import { TwcFaxComponent } from './twc-fax/twc-fax.component';
import { TwcGenericComponent } from './twc-generic/twc-generic.component';
import { TwcHomeComponent } from './twc-home/twc-home.component';
import { TwcNoInteractionComponent } from './twc-no-interaction/twc-no-interaction.component';
import { TwcNoWidgetsComponent } from './twc-no-widgets/twc-no-widgets.component';
import { TwcSupervisorComponent } from './twc-supervisor/twc-supervisor.component';
import { TwcTextchatComponent } from './twc-textchat/twc-textchat.component';
import { TwcUnknownComponent } from './twc-unknown/twc-unknown.component';
import { TwcVoiceComponent } from './twc-voice/twc-voice.component';
import { TwcWorkbenchComponent } from './twc-workbench/twc-workbench.component';

/**
 * Tw Content Module
 */
@NgModule({
    declarations: [
        TwcUnknownComponent,
        TwcCustomComponent,
        TwcHomeComponent,
        TwcSupervisorComponent,
        TwcVoiceComponent,
        TwcNoWidgetsComponent,
        TwcNoInteractionComponent,
        TwcTextchatComponent,
        TwcWorkbenchComponent,
        TwcEmailComponent,
        TwcDockerComponent,
        TwcFaxComponent,
        TwcGenericComponent
    ],
    imports: [SharedModule, TwTemplateModule, TwWrapperModule],
    exports: [TwcNoWidgetsComponent]
})
export class TwContentModule { }
