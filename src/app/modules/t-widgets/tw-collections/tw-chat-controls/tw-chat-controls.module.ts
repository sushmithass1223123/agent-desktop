import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwWrapperModule } from '@modules/t-widgets/tw-wrapper/tw-wrapper.module';
import { ChatAttachmentsComponent } from './chat-attachments/chat-attachments.component';
import { TwChatControlsComponent } from './tw-chat-controls.component';
import { DragScrollModule } from 'ngx-drag-scroll';

/**
 * Chat control widget module
 */
@NgModule({
    declarations: [TwChatControlsComponent, ChatAttachmentsComponent],
    imports: [CommonModule, TwWrapperModule, SharedModule, DragScrollModule],
    exports: [TwChatControlsComponent]
})
export class TwChatControlsModule {}
