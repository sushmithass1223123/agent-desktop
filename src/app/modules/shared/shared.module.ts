import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FuseSharedModule } from '@fuse/shared.module';
import { MaterialModule } from './material.module';
import { ResourceNotFoundComponent } from './resource-not-found/resource-not-found.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

const sharedModules = [MaterialModule, FuseSharedModule, LeafletModule];

const sharedComponents = [ResourceNotFoundComponent];

@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules]
})
export class SharedModule { }
