import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwWrapperModule } from '@modules/t-widgets/tw-wrapper/tw-wrapper.module';
import { ChatAttachmentsComponent } from './chat-attachments/chat-attachments.component';
import { TwChatControlsComponent } from './tw-chat-controls.component';
import { DragScrollModule } from 'ngx-drag-scroll';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { TranslocoRootModule } from '../../../../transloco-root.module';
/**
 * Chat control widget module
 */
@NgModule({
    declarations: [TwChatControlsComponent, ChatAttachmentsComponent],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [CommonModule, TwWrapperModule, SharedModule, DragScrollModule,TranslocoRootModule],
    exports: [TwChatControlsComponent]
})
export class TwChatControlsModule {}
