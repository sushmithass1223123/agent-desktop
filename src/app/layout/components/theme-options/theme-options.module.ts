import { NgModule } from '@angular/core';
import { FuseMaterialColorPickerModule } from '@fuse/components/material-color-picker/material-color-picker.module';
import { FuseSidebarModule } from '@fuse/components/sidebar/sidebar.module';
import { SharedModule } from '@modules/shared/shared.module';
import { AppThemeOptionsComponent } from './theme-options.component';

@NgModule({
    declarations: [AppThemeOptionsComponent],
    imports: [SharedModule, FuseMaterialColorPickerModule, FuseSidebarModule],
    exports: [AppThemeOptionsComponent]
})
export class AppThemeOptionsModule {}
