import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@modules/shared/material.module';
import { EmailTemplateSelectorComponent } from '..';
import { EmailComponent, EmailPreviewerComponent } from './email.component';
// import { EmailEditorModule} from './kendo-email.module'
import { EmailEditorModule } from './tinymce-email.module';

// const shared = [EmailComponent, EmailPreviewerComponent, EmailTemplateSelectorComponent];
/**
 * Dynamic Email module
 */
@NgModule({
    declarations: [EmailComponent, EmailPreviewerComponent, EmailTemplateSelectorComponent],
    exports: [EmailComponent, EmailTemplateSelectorComponent],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, EmailEditorModule]
})
export class EmailModule {}
