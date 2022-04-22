import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';
import { SharedModule } from '@modules/shared/shared.module';
import { TWidgetsModule } from '@modules/t-widgets/t-widgets.module';
import { AppThemeOptionsModule } from 'app/layout/components/theme-options/theme-options.module';
import { LayoutModule } from 'app/layout/layout.module';
import { MainComponent } from './main.component';

@NgModule({
    declarations: [MainComponent],
    providers: [],
    imports: [
        // Fuse modules
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,

        AppThemeOptionsModule,
        CommonModule,
        SharedModule,
        LayoutModule,
        TWidgetsModule
    ]
})
export class MainModule {}
