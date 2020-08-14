import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FuseSharedModule } from '@fuse/shared.module';
import { MaterialModule } from './material.module';
import { ResourceNotFoundComponent } from './resource-not-found/resource-not-found.component';

const sharedModules = [MaterialModule, FuseSharedModule];

const sharedComponents = [ResourceNotFoundComponent];

@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule { }
