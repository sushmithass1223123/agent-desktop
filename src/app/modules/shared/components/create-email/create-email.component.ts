import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { TwEmailTemplatePreviewComponent } from '@modules/t-widgets/tw-collections/tw-email-template-preview/tw-email-template-preview.component';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { QUILL_EDITOR_CONFIG } from 'app/constants';
import { CreateEmailInfo, TwWidgetModel } from 'app/models';
import { merge } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { EmailTemplate, SDKClient } from 'tmac-sdk';

/**
 * Email creation component view only
 */
@Component({
    selector: 'create-email',
    templateUrl: './create-email.component.html',
    styleUrls: ['./create-email.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CreateEmailComponent implements OnInit, OnDestroy {
    @Output() sendEmail = new EventEmitter();
    /**
     * Template preview data
     */
    templatePreview = {
        aots: []
    };

    /**
     * Show toolbar flag
     */
    showToolbar = false;

    /**
     * Config for quill editor
     */
    editorConfig = QUILL_EDITOR_CONFIG;

    /**
     * Suggested users for autocomplete
     */
    suggestedUsers: string[];
    allUsers = ['rahil@email.com', 'rahil2@email.com', 'rahil3@email.com'];

    /**
     * Email form control
     */
    emailCtrl = new FormGroup({
        To: new FormControl('', [Validators.required]),
        CC: new FormControl(''),
        BCC: new FormControl(''),
        Subject: new FormControl('')
    });

    /**
     * Separator code keys
     */
    separatorKeysCodes: number[] = [ENTER, COMMA];
    /**
     * Recipient input ref
     */
    @ViewChild('recipientsInput') recipientsInput: ElementRef<HTMLInputElement>;

    /**
     * Available templates
     */
    availableTemplates = {
        departments: {}
    };

    /**
     * Files currently uploadeng
     */
    uploadingFiles = [];

    /**
     * Show CC / BCC
     */
    showCcBcc = false;

    /**
     * Email Info
     */
    email: CreateEmailInfo;

    /**
     * Email info received from parent
     */
    @Input() emailInfo?: CreateEmailInfo;

    constructor(private appUiService: AppUiService, private matDialog: MatDialog, private aotService: AOTWidgetService) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.suggestedUsers = this.allUsers;
        this.emailCtrl.setValue({
            To: this.emailInfo?.To || '',
            CC: this.emailInfo?.CC || '',
            BCC: this.emailInfo?.BCC || '',
            Subject: this.emailInfo?.Subject || ''
        });
        this.email = {
            // To: this.emailCtrl.value.To,
            // CC: this.emailCtrl.value.CC,
            // BCC: this.emailCtrl.value.BCC,
            // Subject: this.emailCtrl.value.Subject,
            Body: this.emailInfo?.Body || '',
            Files: this.emailInfo?.Files || [],
            ...this.emailCtrl.value
        };

        merge(this.emailCtrl.controls.To.valueChanges, this.emailCtrl.controls.CC.valueChanges, this.emailCtrl.controls.BCC.valueChanges)
            .pipe(
                debounceTime(1000),
                map((val) => val.split(';').pop()?.toLowerCase())
            )
            .subscribe((val) => {
                if (val) {
                    this.suggestedUsers = this.allUsers.filter((x) => x.includes(val));
                } else {
                    this.suggestedUsers = [];
                }
            });

        SDKClient.getEmailTemplateDepartments()
            .then((res) => {
                this.availableTemplates.departments = this.getDropdownKeyvaluePair(res.response, 'ID');
            })
            .catch((err) => {
                console.error(err);
                this.appUiService.showSnackbar('Something went wrong while fetching departments', 'failure');
            });
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        this.closeTemplatePreview();
    }

    /**
     * Selects User from list of email interactions
     * @param {String} key
     * @param {MatAutocompleteSelectedEvent} evt
     */
    selectUser(key: string, evt: MatAutocompleteSelectedEvent): void {
        const missingColon = this.email[key] && this.email[key].slice(-1) !== ';' ? ';' : '';
        this.email[key] += missingColon + evt.option.value + ';';
        this.emailCtrl.patchValue({ [key]: this.email[key] });
        this.removePrevSuggestions();
    }

    /**
     * Remove User / Interaction
     * @param {String} key
     * @param {String} user
     */
    removeUser(key: string, user: string): void {
        this.email[key] = this.email[key].filter((x) => x !== user);
    }

    /**
     * Remove Previous Suggestions
     */
    removePrevSuggestions(): void {
        // if (!this.suggestedUsers) {
        //     this.suggestedUsers.filtered = [];
        // }
        this.suggestedUsers = this.allUsers;
    }

    /**
     * test functionn for quill editor
     * @param {any} evt
     */
    onContentChanged(evt: any): void {}

    /**
     * Attach files to email
     * @param {Event} evt
     */
    async onFileInput(evt: Event): Promise<void> {
        try {
            const input = evt.target as HTMLInputElement;
            if (input.files && input.files.length) {
                this.uploadingFiles.push(input.files[0].name);
                const Base64 = await this.convertToBase64(input.files[0]);
                const { response } = await SDKClient.uploadFiles({
                    files: [
                        {
                            Base64,
                            FileName: input.files[0].name,
                            RelativePath: '',
                            Status: 0,
                            Type: '',
                            Url: ''
                        }
                    ]
                });

                this.email.Files.push({ Id: response[0].RelativePath, Direction: 'OUT', Name: response[0].FileName, URL: response[0].Url });
                this.uploadingFiles.pop();
            }
        } catch (e) {
            console.error(e);
            this.appUiService.showSnackbar('Failed to upload file', 'failure');
        }
    }

    /**
     * Remove files from attachment
     * @param {String} fileId
     */
    removeFiles(fileId: string): void {
        this.email.Files = this.email.Files.filter((x) => x.Id !== fileId);
    }

    /**
     * Convert file to base64
     * @param {File} file
     */
    convertToBase64(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    /**
     * Adds template to editor
     */
    useTemplate(template: EmailTemplate): void {
        this.email.Body = `${template.BodyHTML} ${this.email.Body}`;
        this.closeTemplatePreview();
        // if (this.templatePreview.ref) {
        //     this.templatePreview.ref.close();
        // }
    }

    /**
     * Closes tempate preview
     */
    closeTemplatePreview(): void {
        this.matDialog.closeAll();
        this.templatePreview.aots.forEach((aotID) => {
            this.aotService.destroyWidget(aotID);
        });
        // if (this.templatePreview.ref) {
        //     this.templatePreview.ref.close();
        // }
    }

    /**
     * Select template for email
     * @param {EmailTemplate} preview
     */
    selectTemplate(preview: EmailTemplate): void {
        // this.templatePreview.preview = preview.BodyHTML;
        const data = {
            info: preview,
            useTemplate: (info: EmailTemplate) => this.useTemplate(info),
            closeTemplate: () => this.closeTemplatePreview()
        };
        if (preview.ID === 4) {
            const widget = new TwWidgetModel('Template', 'tw-email-template-preview');
            widget.Config.Anchor = true;
            widget.Config.Position.W = 800;
            widget.Config.Position.H = 300;
            widget.Config.Actions = ['maximize', 'collapse', 'destroy'];
            widget.Data = data;
            this.aotService.addWidget(widget);
            this.templatePreview.aots.push(widget.ID);
        } else {
            this.matDialog.open(TwEmailTemplatePreviewComponent, { data });
            // ref.afterClosed().subscribe(() => {
            // this.templatePreview.preview = '';
            // });
            // this.templatePreview.ref = ref;
            // this.email.Body = `${html} ${this.email.Body}`;
        }
    }

    /**
     * Set groups for selected department
     * @param {String} departmentId Department's Id
     */
    setGroups(departmentId: string): void {
        if (!this.availableTemplates.departments[departmentId]?.groups) {
            SDKClient.getEmailTemplateGroups(departmentId)
                .then((res) => {
                    if (res.response && res.response.length) {
                        this.availableTemplates.departments[departmentId].groups = this.getDropdownKeyvaluePair(res.response, 'ID');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    this.appUiService.showSnackbar('Something went wrong while fetching groups', 'failure');
                });
        }
    }

    /**
     * Set Templates for the group
     * @param {String} departmentId  selected department Id
     * @param {String} groupId selected group Id
     */
    setTemplates(departmentId: string, groupId: string): void {
        const groups = this.availableTemplates.departments[departmentId].groups;
        if (!groups[groupId].templates) {
            SDKClient.getEmailTemplates({ groupId, type: '' })
                .then((templateRes) => {
                    if (templateRes.response && templateRes.response.length) {
                        groups[groupId].templates = this.getDropdownKeyvaluePair(templateRes.response, 'ID');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    this.appUiService.showSnackbar('Something went wrong while fetching templates', 'failure');
                });
        }
    }

    /**
     * Groups by id and returns the value
     */
    private getDropdownKeyvaluePair(records: any[], idKey: string): any {
        const keyVal = {};
        records.forEach((r) => {
            keyVal[r[idKey]] = r;
        });
        return keyVal;
    }

    /**
     * Focuses the editor
     * @param {any} editor
     */
    setFocus(editor: any): void {
        if (editor) {
            editor.focus();
        }
    }

    /**
     * Triggers email send action
     */
    triggerEmailSend(): void {
        if (!this.emailCtrl.valid) {
            return;
        }
        this.sendEmail.emit();
    }
}
