import { NgModule } from '@angular/core';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';
import { SharedModule } from '@modules/shared/shared.module';
import { LayoutModule } from 'app/layout/layout.module';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';

@NgModule({
    declarations: [LoginComponent, MainComponent],
    imports: [
        // Fuse modules
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,

        SharedModule,
        LayoutModule
    ]
})
export class CoreModule { }
