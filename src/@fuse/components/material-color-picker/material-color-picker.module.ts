import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { FuseMaterialColorPickerComponent } from '@fuse/components/material-color-picker/material-color-picker.component';
import { FusePipesModule } from '@fuse/pipes/pipes.module';

@NgModule({
    declarations: [FuseMaterialColorPickerComponent],
    imports: [CommonModule, FlexLayoutModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, FusePipesModule],
    exports: [FuseMaterialColorPickerComponent]
})
export class FuseMaterialColorPickerModule {}
