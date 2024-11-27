import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwWrapperModule } from '@modules/t-widgets/tw-wrapper/tw-wrapper.module';
import { TwWorkbenchPanelComponent } from './tw-workbench-panel.component';
import { WorkbenchChatComponent } from './workbench-chat/workbench-chat.component';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { TranslocoRootModule } from '../../../../transloco-root.module';

/**
 * Workbench Panel Module
 */
@NgModule({
    declarations: [TwWorkbenchPanelComponent, WorkbenchChatComponent],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [CommonModule, TwWrapperModule, SharedModule, TranslocoRootModule],
    exports: [TwWorkbenchPanelComponent]
})
export class TwWorkbenchPanelModule {}
