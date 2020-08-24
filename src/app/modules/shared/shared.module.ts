import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FuseSharedModule } from '@fuse/shared.module';
import { AvatarComponent } from './avatar/avatar.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { MaterialModule } from './material.module';
import { ResourceNotFoundComponent } from './resource-not-found/resource-not-found.component';

const sharedModules = [MaterialModule, FuseSharedModule];

const sharedComponents = [
    ResourceNotFoundComponent,
    ConfirmDialogComponent,
    AvatarComponent
];

@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule { }
