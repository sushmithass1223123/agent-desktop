import { NgModule } from '@angular/core';
import { FuseMaterialColorPickerModule } from '@fuse/components/material-color-picker/material-color-picker.module';
import { FuseSidebarModule } from '@fuse/components/sidebar/sidebar.module';
import { SharedModule } from '@modules/shared/shared.module';
import { AppThemeOptionsComponent } from './theme-options.component';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';

@NgModule({
    declarations: [AppThemeOptionsComponent],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [SharedModule, FuseMaterialColorPickerModule, FuseSidebarModule,TranslocoRootModule],
    exports: [AppThemeOptionsComponent]
})
export class AppThemeOptionsModule {}
