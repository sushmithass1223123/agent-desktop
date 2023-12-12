import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { isStringHtml } from '@tmac/operators';
import { SDKClient, TUtils } from '@tmac/sdk';
import { EmailComponentInputs, EmailComponentMode, EmailFile, MediaStreamerResponse, MediaStreamerSingleResponse } from 'app/interfaces';
import { ADError, maticonByExtension, throwADError, validateEmail } from 'app/utils';
import { merge, Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { UIActionEvent, UIActionEventService } from '@services/ui-action-event.service';

@Component({
    selector: 'email',
    templateUrl: './email.component.html',
    styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit, OnChanges, OnDestroy {
    /**
     * Subject that is used as takeUntil limiter for unsubscribing all subsctiption on destroy
     */
    unsubscribeAll$: Subject<boolean> = new Subject<boolean>();

    /**
     * Shows CC / BCC form inputs
     */
    showCcBcc = false;

    /**
     * email object passsed from parent
     */
    @Input()
    email: EmailComponentInputs;

    /**
     * outputter for the send email method
     */
    @Output()
    sendEmail = new EventEmitter();

    /**
     * mode of the email component
     */
    @Input()
    mode: EmailComponentMode = 'preview';

    /**
     * internal email object
     */
    _email: Partial<EmailComponentInputs> = {};

    /**
     * Controls for email recipients
     */
    _addressFG = new FormGroup({
        To: new FormControl(''),
        CC: new FormControl(''),
        BCC: new FormControl('')
    });

    /**
     * configurations for the preview
     */
    @Input()
    previewConf = {
        /**
         * header state
         */
        headerCollapsed: false
    };

    /**
     * State of the email component
     */
    @Input()
    state: 'loading' | 'error' | 'loaded' = 'loaded';

    /**
     * Maximum file size default 20mbs
     */
    maxFileSize = 20971520;

    /**
     * Suggested users for autocomplete
     */
    suggestedUsers: string[] = [];

    /**
     * Method passed to retry the email loading
     */
    @Output() retry = new EventEmitter();

    /**
     * Email Ref
     */
    @ViewChild('emailRef') private set ref(content: ElementRef<HTMLDivElement>) {
        if (content && this.mode === 'preview') {
            this.emailRef = content;
            this.setEmailBody();
        }
    }

    /**
     * Email Ref
     */
    emailRef: ElementRef<HTMLDivElement>;

    /**
     * The list of key codes that will trigger a chipEnd event
     */
    separatorKeysCodes: number[] = [ENTER, COMMA, SEMICOLON];

    /**
     * File upload url config
     */
    fileUploadUrl: any;

    constructor(
        private _appUiService: AppUiService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appDataService: AppDataService,
        private translocoService: TranslocoService,
        private uiActionEventService: UIActionEventService
    ) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.addUserSuggestions();
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll$)).subscribe((config: any) => {
            this.fileUploadUrl = config.Main.Urls?.FileServerUrl || null;
        });
    }

    /**
     * Lifecycle hook
     */
    ngOnChanges(changes: SimpleChanges): void {
        if ((changes.mode && changes.mode.currentValue) || (changes.email && changes.email.currentValue && this.mode === 'preview')) {
            this._setEditForm();
            // this.setEmailBody();
        }
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // this._email = Object.assign(this.email);
    }

    /**
     * Sets up email preview inside a shadow dom
     * @param {HTMLDivElement} el
     */
    setEmailBody(): void {
        if (this.emailRef) {
            const el = this.emailRef.nativeElement;
            // if email is sent as plain text -> add whitespace:normal else 'pre-line'
            el.style.whiteSpace = isStringHtml(this.email.Body) ? 'normal' : 'pre-line';
            if (!el.shadowRoot) {
                el.attachShadow({ mode: 'open' });
            }
            el.shadowRoot.innerHTML = `
            <style>
                ::-webkit-scrollbar{width:4px !important;height:4px !important;}
                ::-webkit-scrollbar-thumb{box-shadow:inset 0 0 0 4px rgba(0,0,0,0.37) !important}
            </style>
            ${this.email.Body}
            `;
        }
    }

    /**
     * Adds user suggestions
     */
    async addUserSuggestions(): Promise<void> {
        SDKClient.getFrequentEmailAddressList()
            .then((res) => {
                if (!res.response) {
                    throwADError('Error in email.component.addUserSuggestions', 'Unexpected response from server');
                }
                this.suggestedUsers = res.response;
                merge(this._addressFG.controls.To.valueChanges, this._addressFG.controls.CC.valueChanges, this._addressFG.controls.BCC.valueChanges)
                    .pipe(
                        takeUntil(this.unsubscribeAll$),
                        debounceTime(200),
                        map((val) => val.toLowerCase())
                    )
                    .subscribe((val = '') => {
                        const key = val.trim();
                        if (key) {
                            this.suggestedUsers = res.response.filter((x) => x.toLowerCase().includes(key));
                            if (!this.suggestedUsers.length && validateEmail(key)) {
                                this.suggestedUsers = [key];
                            }
                        } else {
                            this.suggestedUsers = res.response;
                        }
                    });
            })
            .catch((e) => {
                console.error(e);
                if (e instanceof ADError) {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.email.getFrequentlyUsedEmailFailed'),
                        'failure'
                    );
                }
            });
    }

    /**
     * Sets edit form
     */
    _setEditForm(): void {
        if (this.email) {
            this.notifyEmailAction();
            const email = JSON.parse(JSON.stringify(this.email));
            const { Body, CC, Files, Subject: subject, To, From, CreatedTime, mailbox, BCC } = email;
            const bodyBreak = `
            <style>
            ${
                !isStringHtml(this.email.Body)
                    ? `body {
                white-space: pre-wrap;
            }`
                    : ''
            }
            </style>
            `;
            switch (this.mode) {
                case 'preview':
                    this._email = email;
                    break;
                case 'quick-reply':
                case 'compose':
                    this._email = {
                        BCC: [],
                        Body: '',
                        CC: [],
                        Files: [],
                        From: mailbox,
                        Subject: '',
                        To: []
                    };
                    break;
                case 'forward':
                    this._email = {
                        BCC: [],
                        Body: `${this.email.prelude || ''} ${bodyBreak} ${Body}`.replaceAll(/(?:\r\n|\r|\n)/g, '<br />'),
                        To: [],
                        From: mailbox,
                        Subject: `FW: ${subject}`,
                        Files,
                        CC: []
                    };
                    break;
                case 'reply':
                    this._email = {
                        BCC: [],
                        Body: `${this.email.prelude || ''} ${bodyBreak} ${Body}`.replaceAll(/(?:\r\n|\r|\n)/g, '<br />'),
                        To: Array.isArray(From) ? From : [From],
                        From: this.email.mailbox,
                        Subject: (subject || '').startsWith('RE:') ? subject : `RE: ${subject}`,
                        Files: [],
                        CC: []
                    };
                    break;
                case 'reply-all':
                    const ToList = (Array.isArray(From) ? From : From.split(',')).concat(To);
                    this._email = {
                        BCC,
                        Body: `${this.email.prelude || ''} ${bodyBreak} ${Body}`.replaceAll(/(?:\r\n|\r|\n)/g, '<br />'),
                        To: Array.from(new Set(ToList.filter((e) => e && e !== mailbox))),
                        From: mailbox,
                        Subject: (subject || '').startsWith('RE:') ? subject : `RE: ${subject}`,
                        Files: [],
                        CC
                    };
                    break;
                case 'draft':
                    this.email.Body = `${bodyBreak} ${Body}`.replaceAll(/(?:\r\n|\r|\n)/g, '<br />');
                    this._email = email;
                    break;
            }
            this.showCcBcc = false;
            // attach to shadow dom only when the email mode is preview
            if (this.mode === 'preview') {
                this.setEmailBody();
            }
        }
    }

    /**
     * Restore method for archived file
     */
    async restoreFromArchive(file: any): Promise<void> {
        try {
            if (file && file.FileId) {
                const { response } = await TUtils.HttpClient.sendRequest<MediaStreamerSingleResponse<any>>({
                    urls: [`${this.fileUploadUrl.MediaStreamer}/meta/restore/${file.FileId}`],
                    method: 'PUT',
                    responseType: 'json'
                });
                if (response && response.isSuccess) {
                    //success
                    file.RestoreStatus = true;
                    this._appUiService.showSnackbar('File restore initiated');
                } else {
                    this._appUiService.showSnackbar('Error occurred restoring file', 'failure');
                }
            } else {
                this._appUiService.showSnackbar('File id not found cannot restore', 'failure');
            }
        } catch (error) {}
    }

    /**
     * Retry method to reload the email
     */
    emitRetry(): void {
        this.retry.emit();
    }

    /**
     * Attach files to email
     * @param {Event} evt
     */
    async onFileInput(evt: Event): Promise<void> {
        try {
            const input = evt.target as HTMLInputElement;
            let resVal: Partial<EmailFile>;
            if (input.files && input.files.length) {
                const f = input.files[0];
                const ref = this._appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.uploadFileLoading'), 'loading');
                if (f.size > this.maxFileSize) {
                    this._appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.uploadFileSizeWarning'), 'failure');
                    return;
                }
                const Base64 = await this.convertToBase64(f);
                if (this.fileUploadUrl?.MediaUploader) {
                    const formData = new FormData();
                    formData.append('file', f);
                    formData.append('interaction_id', TUtils.Generic.uuid());
                    formData.append('organization_id', 'prod');
                    formData.append('conv_id', this.email.SessionID);
                    formData.append('uploaded_by', SDKClient.getAgentData().agentId);
                    formData.append('other', '');

                    // upload the file
                    const { response } = await TUtils.HttpClient.sendRequest<MediaStreamerResponse>({
                        urls: [this.fileUploadUrl.MediaUploader],
                        method: 'POST',
                        responseType: 'json',
                        formData
                    });

                    // check the response from file server
                    if (response?.isSuccess) {
                        resVal = { Name: response.result.original_name, URL: response.result.downloadURL, Source: 'mediastreamer' };
                    } else {
                        throwADError('File not created at server', response);
                    }
                } else {
                    const {
                        response: [res]
                    } = await SDKClient.uploadFiles({
                        files: [
                            {
                                Base64,
                                FileName: f.name,
                                RelativePath: '',
                                Status: 0,
                                Type: '',
                                Url: ''
                            }
                        ]
                    });
                    resVal = { Name: res.FileName, URL: res.Url, Source: 'tmacproxy' };
                }

                const ext = resVal.Name.split('.').pop();

                this._email.Files.push({
                    Id: TUtils.Generic.uuid(),
                    SessionID: this.email.SessionID,
                    Direction: 'OUT',
                    Icon: maticonByExtension(ext),
                    Ext: f.type,
                    Name: resVal.Name,
                    Source: resVal.Source,
                    URL: resVal.URL
                });
                ref.dismiss();
            }
        } catch (e) {
            console.error(e);
            this._appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.uploadFileFailed'), 'failure');
        }
    }

    /**
     * Remove files from attachment
     * @param {String} fileId
     */
    removeFiles(fileId: string): void {
        this._email.Files = this._email.Files.filter((x) => x.Id !== fileId);
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
     * @param {string} html
     */
    selectTemplate(html: string): void {
        this._email.Body = `${html} ${this._email.Body}`;
    }

    /**
     * Selects user from suggestions
     * @param key
     * @param evt
     */
    emailIdSelected(key: string, evt: MatAutocompleteSelectedEvent, chipInput: HTMLInputElement): void {
        const value = (evt.option.viewValue || '').trim();

        if (!this.validateEmailIdAndPush(key, value)) return;

        // after typing the email Id and if we navigate and press enter
        // both 'emailIdSelected' and 'emailIdAdded' will be triggered.
        // inorder to avoid duplicate addition clear the input value so that
        // in this case 'emailIdAdded' the value will be empty.
        chipInput.value = '';
    }

    /**
     * On entering email Id on chips input
     * @param key
     * @param evt
     */
    emailIdAdded(key: string, evt: MatChipInputEvent): void {
        let value = (evt.value || '').trim();
        if (!value) return;

        if (!this.validateEmailIdAndPush(key, value)) return;

        // clear the input value
        evt.chipInput!.clear();
    }

    /**
     * To validate the email Id and push to list
     * @param key
     * @param emailId
     */
    validateEmailIdAndPush(key: string, emailId: string): boolean {
        if (!validateEmail(emailId)) {
            this._appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.invalidEmailAddress'), 'failure');
            return false;
        }

        this._email[key].push(emailId);
        this._addressFG.patchValue({ [key]: '' });
        return true;
    }

    /**
     * Used by host elements to return email
     * @returns {EmailComponentInputs}
     */
    getEmail(): Partial<EmailComponentInputs> {
        return this._email;
    }

    /**
     * Removes user chip
     * @param key
     * @param value
     */
    removeEmail(key: string, value: string): void {
        this._email[key] = this._email[key].filter((x) => x !== value);
    }

    /**
     * Opens a selected attachment file
     * @param {any} fileUrl
     */
    async openFile(file: any): Promise<void> {
        this._fuseProgressBarService.show();
        await fetch(file.URL)
            .then((response) => response.blob())
            .then((blob) => {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', file.Name);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                setTimeout(() => {
                    window.URL.revokeObjectURL(blobUrl);
                }, 60000);
                link.remove();
            })
            .catch((e) => {
                console.error(e);
                this._appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.downloadFileFailed'), 'failure');
            })
            .finally(() => {
                this._fuseProgressBarService.hide();
            });
    }

    /**
     * Method is to notify agent has come to edit mode in Email section
     */
    notifyEmailAction() {
        this.email['type'] = this.mode;
        const emailActionData: UIActionEvent = {
            eventName: 'EmailAction',
            sessionID: this.email.SessionID,
            data: this.email,
            eventType: 'onUIActionEvent'
        };

        this.uiActionEventService.emitUIActionEvent(emailActionData);
    }
}
