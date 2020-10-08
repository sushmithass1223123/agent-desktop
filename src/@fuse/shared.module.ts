import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FuseDirectivesModule } from '@fuse/directives/directives';
import { FusePipesModule } from '@fuse/pipes/pipes.module';
import { QuillModule } from 'ngx-quill';

/**
 * Shared module list
 */
const modules = [CommonModule, FormsModule, ReactiveFormsModule, FlexLayoutModule, FuseDirectivesModule, FusePipesModule, QuillModule];

/**
 * Shared modules
 */
@NgModule({
    imports: modules,
    exports: modules
})
export class FuseSharedModule {}
