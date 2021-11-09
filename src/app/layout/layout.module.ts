import { NgModule } from '@angular/core';
import { FuseSidebarModule } from '@fuse/components';
import { SharedModule } from '@modules/shared/shared.module';
import { ContentModule } from 'app/layout/components/content/content.module';
import { InstantMessagingModule } from 'app/layout/components/instant-messaging/instant-messaging.module';
import { NavbarModule } from 'app/layout/components/navbar/navbar.module';
import { QuickPanelModule } from 'app/layout/components/quick-panel/quick-panel.module';
import { ToolbarModule } from 'app/layout/components/toolbar/toolbar.module';
import { VerticalLayoutComponent } from 'app/layout/vertical/vertical-layout.component';

@NgModule({
    declarations: [VerticalLayoutComponent],
    imports: [FuseSidebarModule, ContentModule, NavbarModule, QuickPanelModule, ToolbarModule, InstantMessagingModule, SharedModule],
    exports: [VerticalLayoutComponent]
})
export class LayoutModule {}
