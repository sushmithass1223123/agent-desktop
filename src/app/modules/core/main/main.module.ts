import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';
import { SharedModule } from '@modules/shared/shared.module';
import { TWidgetsModule } from '@modules/t-widgets/t-widgets.module';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { LayoutModule } from 'app/layout/layout.module';
import { MainComponent } from './main.component';

@NgModule({
    declarations: [MainComponent],
    providers: [AOTWidgetService, AppUiService, AgentFeaturesService, InteractionManagerService],
    imports: [
        // Fuse modules
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,

        CommonModule,
        SharedModule,
        LayoutModule,
        TWidgetsModule
    ]
})
export class MainModule {}
