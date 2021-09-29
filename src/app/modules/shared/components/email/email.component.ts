import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { AppUiService } from '@services/app-ui.service';
import { SDKClient } from '@tmac/sdk';
import { EmailComponentInputs, EmailComponentMode } from 'app/interfaces';
import { ADError, maticonByExtension, throwADError } from 'app/utils';
import { merge, Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'email',
    templateUrl: './email.component.html',
    styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit, OnChanges {
    /**
     * Subject that is used as takeUntil limiter for unsubscribing all subsctiption on destroy
     */
    unsubscribeAll$: Subject<boolean> = new Subject<boolean>();

    @Input()
    email: EmailComponentInputs;

    @Output()
    sendEmail = new EventEmitter();

    @Input()
    mode: EmailComponentMode = 'preview';

    _email: Partial<EmailComponentInputs> = {};

    /**
     * Controls for email recipients
     */
    _addressFG = new FormGroup({
        To: new FormControl(''),
        CC: new FormControl(''),
        BCC: new FormControl('')
    });

    @Input()
    previewConf = {
        headerCollapsed: false
    };

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

    constructor(private _appUiService: AppUiService) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.addUserSuggestions();
    }

    /**
     * Lifecycle hook
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mode && changes.mode.currentValue) {
            this._setEditForm();
        }
        if (changes.email && changes.email.currentValue && this.mode === 'preview') {
            this.setEmailBody();
        }
    }

    /**
     * Sets up email preview
     * @param {HTMLDivElement} el
     */
    setEmailBody(): void {
        if (this.emailRef) {
            const el = this.emailRef.nativeElement;
            if (!el.shadowRoot) {
                el.attachShadow({ mode: 'open' });
            }
            el.shadowRoot.innerHTML = this.email.Body;
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
                const emailRegex =
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
                            if (!this.suggestedUsers.length && emailRegex.test(key)) {
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
                    this._appUiService.showSnackbar('Unable to fetch frequently used email addresses', 'failure');
                }
            });
    }

    /**
     * Sets edit form
     */
    _setEditForm(): void {
        if (this.email) {
            const { Body, CC, Files, Subject: subject, To, From, CreatedTime } = this.email;
            const prelude = `
        <style>
            ::-webkit-scrollbar{width:4px !important;height:4px !important;}
            ::-webkit-scrollbar-thumb{box-shadow:inset 0 0 0 4px rgba(0,0,0,0.37) !important}
        </style>
        <br/>
        <div style='border-top: 1px solid gray; padding-top : 5px;'>
            <div style='border-left: 3px solid gray;padding-left: 5px'>
                <div> <strong> From: </strong> <span> ${From} </span> </div>
                    <div> <strong> Sent: </strong> <span> ${CreatedTime} </span> </div>
                    <div> <strong> To: </strong> <span> ${To} </span> </div>
                    <div> <strong> Subject: </strong> <span> ${subject} </span> </div>
                </div>
            </div>
        </div>
                            <br />`;
            const BCC = [];
            switch (this.mode) {
                case 'preview':
                    this._email = this.email;
                    break;
                case 'compose':
                    this._email = {
                        BCC: [],
                        Body: '',
                        CC: [],
                        Files: [],
                        From: this.email.mailbox,
                        Subject: '',
                        To: []
                    };
                    break;
                case 'forward':
                    this._email = {
                        BCC,
                        Body: Body.replaceAll(/(?:\r\n|\r|\n)/g, '<br />'),
                        To: [],
                        From: this.email.mailbox,
                        Subject: subject,
                        Files,
                        CC
                    };
                    break;
                case 'reply':
                    this._email = {
                        BCC,
                        Body: `${prelude} ${Body}`.replaceAll(/(?:\r\n|\r|\n)/g, '<br />'),
                        To: [From],
                        From: this.email.mailbox,
                        Subject: subject,
                        Files: [],
                        CC
                    };
                    break;
                case 'reply-all':
                    const ToList = To.concat(Array.from(new Set((From || '').split(',')))).filter((e) => e && e !== this.email.mailbox);
                    this._email = {
                        BCC,
                        Body: `${prelude} ${Body}`.replaceAll(/(?:\r\n|\r|\n)/g, '<br />'),
                        To: Array.from(new Set([From].concat(ToList))),
                        From: this.email.mailbox,
                        Subject: subject,
                        Files: [],
                        CC
                    };
                    break;
                case 'draft':
                    this.email.Body = Body.replaceAll(/(?:\r\n|\r|\n)/g, '<br />');
                    this._email = this.email;
                    break;
            }
            if (this.mode === 'preview') {
                this.setEmailBody();
            }
        }
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
            if (input.files && input.files.length) {
                const f = input.files[0];
                const ref = this._appUiService.showSnackbar(`Uploading ${f.name || 'File'}`, 'loading');
                if (f.size > this.maxFileSize) {
                    this._appUiService.showSnackbar('File too large', 'failure');
                    return;
                }
                const Base64 = await this.convertToBase64(f);
                const { response } = await SDKClient.uploadFiles({
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

                const ext = response[0].FileName.split('.').pop();
                const icon = maticonByExtension(ext);

                this._email.Files.push({
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
            this._appUiService.showSnackbar('Failed to upload file', 'failure');
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
     * @param {string} preview
     */
    selectTemplate(html: string): void {
        this._email.Body = `${html} ${this._email.Body}`;
    }

    /**
     * Selects user from suggestions
     * @param key
     * @param evt
     */
    selectEmailAddress(key: string, evt: MatAutocompleteSelectedEvent): void {
        this._email[key].push(evt.option.value);
        this._addressFG.patchValue({ [key]: '' });
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
     * @param {String} fileUrl
     */
    openFile(fileUrl: string): void {
        window.open(fileUrl);
    }
}
