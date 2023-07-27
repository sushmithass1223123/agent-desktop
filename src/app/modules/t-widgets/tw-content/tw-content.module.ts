import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwTemplateModule } from 'app/modules/t-widgets/tw-template/tw-template.module';
import { TwWrapperModule } from '../tw-wrapper/tw-wrapper.module';
import { TwcCustomComponent } from './twc-custom/twc-custom.component';
import { TwcDockerComponent } from './twc-docker/twc-docker.component';
import { TwcHomeComponent } from './twc-home/twc-home.component';
import { TwcInteractionComponent } from './twc-interaction/twc-interaction.component';
import { TwcNotFoundComponent } from './twc-not-found/twc-not-found.component';
import { TwcSupervisorComponent } from './twc-supervisor/twc-supervisor.component';
import { TwcUnknownComponent } from './twc-unknown/twc-unknown.component';
import { TwcWorkbenchComponent } from './twc-workbench/twc-workbench.component';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';
/**
 * Tw Content Module
 */
@NgModule({
    declarations: [
        TwcHomeComponent,
        TwcSupervisorComponent,
        TwcInteractionComponent,
        TwcWorkbenchComponent,
        TwcCustomComponent,
        TwcDockerComponent,
        TwcUnknownComponent,
        TwcNotFoundComponent
    ],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [SharedModule, TwTemplateModule, TwWrapperModule,TranslocoRootModule],
    exports: [TwcNotFoundComponent]
})
export class TwContentModule {}
