import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';
import { FuseSharedModule } from '@fuse/shared.module';
import { SharedModule } from '@modules/shared/shared.module';
import { AppUiService } from '@services/app-ui.service';
import { LoginComponent } from './login.component';

/**
 * Login Module
 */
@NgModule({
    declarations: [LoginComponent],
    providers: [AppUiService],
    imports: [FuseProgressBarModule, FuseSharedModule, FuseSidebarModule, CommonModule, SharedModule]
})
export class LoginModule {}
