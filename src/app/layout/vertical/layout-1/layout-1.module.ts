import { NgModule } from '@angular/core';
import { FuseSidebarModule } from '@fuse/components';
import { SharedModule } from '@modules/shared/shared.module';
import { ChatPanelModule } from 'app/layout/components/chat-panel/chat-panel.module';
import { ContentModule } from 'app/layout/components/content/content.module';
import { FooterModule } from 'app/layout/components/footer/footer.module';
import { NavbarModule } from 'app/layout/components/navbar/navbar.module';
import { QuickPanelModule } from 'app/layout/components/quick-panel/quick-panel.module';
import { AppThemeOptionsModule } from 'app/layout/components/theme-options/theme-options.module';
import { ToolbarModule } from 'app/layout/components/toolbar/toolbar.module';
import { VerticalLayout1Component } from 'app/layout/vertical/layout-1/layout-1.component';

@NgModule({
    declarations: [VerticalLayout1Component],
    imports: [
        FuseSidebarModule,
        ContentModule,
        FooterModule,
        NavbarModule,
        QuickPanelModule,
        ToolbarModule,
        AppThemeOptionsModule,
        ChatPanelModule,
        SharedModule
    ],
    exports: [VerticalLayout1Component]
})
export class VerticalLayout1Module {}
