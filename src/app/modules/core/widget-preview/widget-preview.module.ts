import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwContentModule } from '@modules/t-widgets/tw-content/tw-content.module';
import { TwTemplateModule } from '@modules/t-widgets/tw-template/tw-template.module';
import { WidgetPreviewComponent } from './widget-preview.component';

/**
 * Widget preview module
 */
@NgModule({
    declarations: [WidgetPreviewComponent],
    imports: [CommonModule, TwTemplateModule, SharedModule, TwContentModule]
})
export class WidgetPreviewModule {}
