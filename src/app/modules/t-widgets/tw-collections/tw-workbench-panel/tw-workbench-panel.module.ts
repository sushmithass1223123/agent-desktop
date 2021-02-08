import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwWrapperModule } from '@modules/t-widgets/tw-wrapper/tw-wrapper.module';
import { TwWorkbenchPanelComponent } from './tw-workbench-panel.component';
import { WorkbenchChatComponent } from './workbench-chat/workbench-chat.component';
import { WorkbenchEmailComponent } from './workbench-email/workbench-email.component';

/**
 * Workbench Panel Module
 */
@NgModule({
    declarations: [
        TwWorkbenchPanelComponent,
        WorkbenchEmailComponent,
        WorkbenchChatComponent
    ],
    imports: [
        CommonModule,
        TwWrapperModule,
        SharedModule
    ],
    exports: [
        TwWorkbenchPanelComponent
    ]
})
export class TwWorkbenchPanelModule { }
