import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetPreviewComponent } from './widget-preview.component';
import { FuseProgressBarModule } from '@fuse/components';


@NgModule({
    declarations: [WidgetPreviewComponent],
    imports: [
        // Fuse modules
        FuseProgressBarModule,
        CommonModule
    ]
})
export class WidgetPreviewModule { }
