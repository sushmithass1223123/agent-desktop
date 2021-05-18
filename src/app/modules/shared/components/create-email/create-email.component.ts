import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TwEmailTemplatePreviewComponent } from '@modules/t-widgets/tw-collections/tw-email-template-preview/tw-email-template-preview.component';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { EmailTemplate, SDKClient } from '@tmac/sdk';
import { QUILL_EDITOR_CONFIG } from 'app/constants';
import { CreateEmailInput, CreateEmailOutput, TwWidgetModel } from 'app/models';
import { maticonByExtension } from 'app/utils';
import { merge } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

/**
 * Email creation component view only
 */
@Component({
    selector: 'create-email',
    templateUrl: './create-email.component.html',
    styleUrls: ['./create-email.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CreateEmailComponent implements OnInit, OnDestroy, AfterViewInit {
    /**
     * Send email event emitter
     */
    @Output() sendEmail = new EventEmitter<CreateEmailOutput>();
    /**
     * Template preview data
     */
    templatePreview = {
        aots: []
    };

    /**
     * Suggested users for autocomplete
     */
    suggestedUsers: string[] = [];

    /**
     * Email suggestion all users
     */
    allUsers = [];

    /**
     * Recipient input ref
     */
    @ViewChild('recipientsInput') recipientsInput: ElementRef<HTMLInputElement>;

    /**
     * Flag when currently uploading files
     */
    // uploadingFiles = false;

    /**
     * Show CC / BCC
     */
    showCcBcc = false;

    /**
     * Email info received from parent
     */
    @Input() emailInfo?: CreateEmailInput = null;

    /**
     * Flag for disabling send
     */
    @Input() sendDisabled? = false;

    /**
     * A readonly value for from
     */
    @Input() from = '';

    /**
     * Fuse custom background colors
     */
    customFuse$ = this._fuseFacadeService.widgetBgClasses$;

    /**
     * Controls for email recipients
     */
    emailRecipientFacade = new FormGroup({
        To: new FormControl(''),
        CC: new FormControl(''),
        BCC: new FormControl('')
    });

    /**
     * Email ist
     */
    email: CreateEmailOutput = {
        To: [],
        CC: [],
        BCC: [],
        Subject: '',
        Body: '',
        Files: []
    };

    /**
     * Quill div's ref
     */
    @ViewChild('quillRef') quillRef: ElementRef<HTMLDivElement>;

    /**
     * Quill Editor Config
     */
    editorConfig = QUILL_EDITOR_CONFIG;

    /**
     * Flag to show attachments
     */
    showAttachments = false;
    constructor(
        private appUiService: AppUiService,
        private matDialog: MatDialog,
        private aotService: AOTWidgetService,
        private _fuseFacadeService: FuseFacadeService
    ) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        if (this.emailInfo?.To) {
            this.email.To = this.emailInfo?.To.split(',');
        }
        if (this.emailInfo?.CC) {
            this.email.CC = this.emailInfo?.CC.split(',');
        }
        if (this.emailInfo?.BCC) {
            this.email.BCC = this.emailInfo?.BCC.split(',');
        }
        this.email.Subject = this.emailInfo?.Subject || '';
        this.email.Body = this.emailInfo?.Body || '';
        this.email.Files = this.emailInfo?.Files || [];
        const emailRegex =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        this.addUserSuggestions();
        merge(
            this.emailRecipientFacade.controls.To.valueChanges,
            this.emailRecipientFacade.controls.CC.valueChanges,
            this.emailRecipientFacade.controls.BCC.valueChanges
        )
            .pipe(
                debounceTime(200),
                map((val) => val.toLowerCase())
            )
            .subscribe((val) => {
                if (val) {
                    this.suggestedUsers = this.allUsers.filter((x) => x.toLowerCase().includes(val));
                    if (!this.suggestedUsers.length && emailRegex.test(val)) {
                        this.suggestedUsers = [val];
                    }
                } else {
                    this.suggestedUsers = this.allUsers;
                }
            });
    }

    /**
     * Lifecycle hook
     */
    ngAfterViewInit(): void {
        // if (this.quillRef.nativeElement) {
        //     const quill = new Quill(this.quillRef.nativeElement, QUILL_EDITOR_CONFIG);
        //     quill.root.innerHTML = '';
        //     quill.clipboard.dangerouslyPasteHTML(0, this.email.Body);
        // quill.on('text-change', () => {
        //     this.email.Body = quill.root.innerHTML;
        // });
        // }
    }

    /**
     * Selects user from suggestions
     * @param key
     * @param evt
     */
    select(key: string, evt: MatAutocompleteSelectedEvent): void {
        this.email[key].push(evt.option.value);
        this.emailRecipientFacade.patchValue({ [key]: '' });
    }

    /**
     * Removes user chip
     * @param key
     * @param value
     */
    remove(key: string, value: string): void {
        this.email[key] = this.email[key].filter((x) => x !== value);
    }

    /**
     * Adds user suggestions
     */
    addUserSuggestions(): void {
        SDKClient.getFrequentEmailAddressList()
            .then((res) => {
                this.allUsers = res.response;
            })
            .catch((e) => {
                console.error(e);
            });
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        this.closeTemplatePreview();
    }
    /**
     * Attach files to email
     * @param {Event} evt
     */
    async onFileInput(evt: Event): Promise<void> {
        try {
            const input = evt.target as HTMLInputElement;
            if (input.files && input.files.length) {
                const ref = this.appUiService.showSnackbar(`Uploading ${input.files[0].name || 'File'}`, 'loading');
                // this.uploadingFiles = true;
                // this.uploadingFiles.push(input.files[0].name);
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

                const ext = response[0].FileName.split('.').pop();
                const icon = maticonByExtension(ext);

                this.email.Files.push({
                    Id: response[0].RelativePath,
                    Direction: 'OUT',
                    Name: response[0].FileName,
                    URL: response[0].Url,
                    Ext: ext,
                    Icon: icon
                });
                ref.dismiss();
                // this.uploadingFiles = false;
                // this.uploadingFiles.pop();
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
    }

    /**
     * Closes tempate preview
     */
    closeTemplatePreview(): void {
        this.matDialog.closeAll();
        this.templatePreview.aots.forEach((aotID) => {
            this.aotService.destroyWidget(aotID);
        });
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
            this.matDialog.open(TwEmailTemplatePreviewComponent, {
                data,
                minWidth: '40%',
                panelClass: `email-template-dialog__${data.info?.Type || ''}`
            });
        }
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
        if (!this.emailRecipientFacade.valid) {
            return;
        }
        this.sendEmail.emit(this.email);
    }

    /**
     * Opens a selected attachment file
     * @param {String} fileUrl
     */
    openFile(fileUrl: string): void {
        window.open(fileUrl);
    }
}
