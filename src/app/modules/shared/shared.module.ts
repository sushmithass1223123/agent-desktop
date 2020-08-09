import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FuseSharedModule } from '@fuse/shared.module';

import { MaterialModule } from './material.module';

const sharedModules = [
    MaterialModule,
    FuseSharedModule
];

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        ...sharedModules
    ],
    exports: [
        sharedModules
    ]
})
export class SharedModule { }
