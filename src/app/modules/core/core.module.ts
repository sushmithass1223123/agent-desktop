import { NgModule } from '@angular/core';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';
import { SharedModule } from '@modules/shared/shared.module';
import { LayoutModule } from 'app/layout/layout.module';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { TwPreviewComponent } from './tw-preview/tw-preview.component';
import { TWidgetsModule } from '@modules/t-widgets/t-widgets.module';

@NgModule({
    declarations: [LoginComponent, MainComponent, TwPreviewComponent],
    imports: [
        // Fuse modules
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,

        SharedModule,
        LayoutModule,
        TWidgetsModule
    ]
})
export class CoreModule { }
