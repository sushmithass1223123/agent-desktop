import { ScrollingModule } from '@angular/cdk/scrolling';
import { APP_BASE_HREF, CommonModule, PlatformLocation } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@modules/shared/material.module';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmailComponent } from './email.component';
import { MailboxSettingsComponent } from './mailbox-settings/mailbox-settings.component';
import { EmailTemplateSelectorComponent } from './template-selector/email-template-selector.component';
// import { EmailEditorModule} from './kendo-email.module'
import { EmailEditorModule } from './tinymce-email.module';
import { WorkbenchEmailComponent } from './workbench-email/workbench-email.component';

const shared = [EmailComponent, EmailTemplateSelectorComponent, SkeletonComponent, MailboxSettingsComponent, WorkbenchEmailComponent];

/**
 * Dynamic Email module
 */
@NgModule({
    declarations: shared,
    exports: shared,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, EmailEditorModule, ScrollingModule],
    providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
            deps: [PlatformLocation]
        }
    ]
})
export class EmailModule {}
