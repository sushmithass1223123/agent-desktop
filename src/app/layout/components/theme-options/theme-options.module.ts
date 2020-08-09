import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FuseMaterialColorPickerModule } from '@fuse/components/material-color-picker/material-color-picker.module';
import { FuseSidebarModule } from '@fuse/components/sidebar/sidebar.module';
import { FuseDirectivesModule } from '@fuse/directives/directives';
import { SharedModule } from '@modules/shared/shared.module';
import { AppThemeOptionsComponent } from './theme-options.component';

@NgModule({
    declarations: [
        AppThemeOptionsComponent
    ],
    imports: [
        FormsModule,
        ReactiveFormsModule,

        FlexLayoutModule,
        SharedModule,

        FuseDirectivesModule,
        FuseMaterialColorPickerModule,
        FuseSidebarModule
    ],
    exports: [
        AppThemeOptionsComponent
    ]
})
export class AppThemeOptionsModule {
}
