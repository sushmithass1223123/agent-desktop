import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetPreviewComponent } from './widget-preview.component';
import { FuseProgressBarModule } from '@fuse/components';
import { TwTemplateModule } from '@modules/t-widgets/tw-template/tw-template.module';
import { SharedModule } from '@modules/shared/shared.module';
import { TwContentModule } from '@modules/t-widgets/tw-content/tw-content.module';


@NgModule({
    declarations: [WidgetPreviewComponent],
    imports: [
        // Fuse modules
        FuseProgressBarModule,
        CommonModule,
        TwTemplateModule,
        SharedModule,
        TwContentModule
    ]
})
export class WidgetPreviewModule { }
