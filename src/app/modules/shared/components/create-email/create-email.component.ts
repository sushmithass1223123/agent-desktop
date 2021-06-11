import { APP_BASE_HREF } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { SDKClient, TUtils } from '@tmac/sdk';
import { CreateEmailInput, CreateEmailOutput } from 'app/interfaces';
import { maticonByExtension } from 'app/utils';
import { merge } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import tinyMCE from 'tinymce';

/**
 * Email creation component view only
 */
@Component({
    selector: 'create-email',
    templateUrl: './create-email.component.html',
    styleUrls: ['./create-email.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CreateEmailComponent implements OnInit, AfterViewInit, OnDestroy {
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
     * Id for editor component
     */
    editorState = {
        id: TUtils.Generic.uuid(),
        loading: false
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
     * Flag to show attachments
     */
    showAttachments = false;

    /**
     * This shows the RE: tag when doing an email reply
     */
    replyTag = '';

    constructor(private appUiService: AppUiService, @Inject(APP_BASE_HREF) private baseHref: string, private _fuseFacadeService: FuseFacadeService) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.replyTag = this.emailInfo.Replying ? (this.emailInfo.Subject ? (this.emailInfo.Subject.startsWith('RE:') ? '' : 'RE:') : '') : '';
        if (this.emailInfo?.To) {
            this.email.To = this.emailInfo?.To.split(',').filter((x) => !!x);
        }
        if (this.emailInfo?.CC) {
            this.email.CC = this.emailInfo?.CC.split(',').filter((x) => !!x);
        }
        if (this.emailInfo?.BCC) {
            this.email.BCC = this.emailInfo?.BCC.split(',').filter((x) => !!x);
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
        this.editorState.loading = true;
    }

    /**
     * Lifecycle hook
     */
    ngAfterViewInit(): void {
        setTimeout(() => {
            tinyMCE
                .init({
                    selector: `textarea#${this.editorState.id}`,
                    min_height: 200,
                    height: '100%',
                    menubar: false,
                    fontsize_formats: '8pt 9pt 10pt 11pt 12pt 26pt 36pt',
                    forced_root_block: false,
                    // force_br_newlines: true,
                    // force_p_newlines: false,
                    branding: false,
                    base_url: `${this.baseHref}assets/tinymce/`,
                    content_css: `${this.baseHref}assets/tinymce/editor.css`,
                    plugins: [
                        'advlist autolink lists link image charmap print preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table paste code wordcount'
                    ],
                    toolbar:
                        'undo redo | formatselect | ' +
                        'bold italic backcolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    setup: (editor) => {
                        editor.on('init', () => {
                            this.editorState.loading = false;
                            editor.setContent(this.email.Body || '');
                            editor.on('blur', () => {
                                this.email.Body = editor.getContent();
                            });
                        });
                    }
                })
                .then(() => {
                    console.log('Email editor loaded succesfully');
                })
                .catch((err) => {
                    console.error('Unable to load editor');
                    console.error(err);
                });
        }, 0);
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        tinyMCE.activeEditor.off('blur');
        // tinyMCE.activeEditor.destroy();
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
                    Id: Date.now().toString(),
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
     * Select template for email
     * @param {string} preview
     */
    selectTemplate(html: string): void {
        this.email.Body = `${html} ${this.email.Body}`;
        tinyMCE.activeEditor.setContent(this.email.Body);
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
