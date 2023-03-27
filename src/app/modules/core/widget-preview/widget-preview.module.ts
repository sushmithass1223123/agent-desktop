import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwContentModule } from '@modules/t-widgets/tw-content/tw-content.module';
import { TwTemplateModule } from '@modules/t-widgets/tw-template/tw-template.module';
import { WidgetPreviewComponent } from './widget-preview.component';

import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';
/**
 * Widget preview module
 */
@NgModule({
    declarations: [WidgetPreviewComponent],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [CommonModule, TwTemplateModule, SharedModule, TwContentModule,TranslocoRootModule]
})
export class WidgetPreviewModule {}
