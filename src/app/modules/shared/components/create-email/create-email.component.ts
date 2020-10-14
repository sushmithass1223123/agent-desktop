import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectChange } from '@angular/material/select';
import { AppUiService } from '@services/app-ui.service';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { CreateEmailInfo } from 'app/models';
import { QuillEditorComponent } from 'ngx-quill';
import { SDKClient } from 'tmac-sdk';

/**
 * Email creation component view only
 */
@Component({
    selector: 'create-email',
    templateUrl: './create-email.component.html',
    styleUrls: ['./create-email.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CreateEmailComponent implements OnInit {
    /**
     * Config for quill editor
     */
    editorConfig = {
        placeholder: 'Write your email ...',
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'], // toggled buttons
                ['blockquote', 'code-block'],

                [{ header: 1 }, { header: 2 }], // custom button values
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
                [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
                [{ direction: 'rtl' }], // text direction

                // [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
                [{ header: [1, 2, 3, 4, 5, 6, false] }],

                [{ color: [] }, { background: [] }], // dropdown with defaults from theme
                // [{ 'font': [] }],
                [{ align: [] }],

                ['clean'], // remove formatting button

                ['link'] // , 'image', 'video'
            ]
        }
    };

    /**
     * Suggested users for autocomplete
     */
    suggestedUsers: {
        /**
         * Available users
         */
        all: string[];
        /**
         * Filtered users
         */
        filtered: string[];
    } = {
            all: ['rahil@email.com', 'rahil2@email.com', 'rahil3@email.com'],
            filtered: []
        };

    /**
     * Email form control
     */
    emailCtrl = new FormGroup({
        directRecipients: new FormControl(),
        ccdRecipients: new FormControl([]),
        bccdRecipients: new FormControl([]),
        emailBody: new FormControl('')
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
     * Recipients available fields
     */
    recipients: Record<string, string> = {
        To: '',
        CC: '',
        BCC: ''
    };

    /**
     * Available templates
     */
    availableTemplates = {};

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

    constructor(private appUiService: AppUiService) {
        this.email = {
            To: [],
            CC: [],
            BCC: [],
            Body: '',
            Subject: '',
            Files: []
        };
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.email = {
            To: this.emailInfo?.To || [],
            CC: this.emailInfo?.CC || [],
            BCC: this.emailInfo?.BCC || [],
            Body: this.emailInfo?.Body || '',
            Subject: this.emailInfo?.Subject || '',
            Files: this.emailInfo?.Files || []
        };
    }

    /**
     * Selects User from list of email interactions
     * @param {String} key
     * @param {MatAutocompleteSelectedEvent} evt
     */
    selectUser(key: string, evt: MatAutocompleteSelectedEvent): void {
        if (!this.email[key]) {
            this.email[key] = [];
        }
        this.email[key].push(evt.option.value);
        this.recipientsInput.nativeElement.value = '';
        this.recipients[key] = '';
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
     * Filter user based on searchkey
     * @param {String} key
     * @param {String} user
     */
    filterUsers(key: string, user: string): void {
        this.suggestedUsers.filtered = this.suggestedUsers.all.filter((x) => x.toLowerCase().includes(user.toLowerCase()));
        if (!this.suggestedUsers.filtered.length) {
            this.suggestedUsers.filtered.push(user);
        }
    }

    /**
     * Remove Previous Suggestions
     */
    removePrevSuggestions(): void {
        if (!this.suggestedUsers) {
            this.suggestedUsers.filtered = [];
        }
    }

    /**
     * test functionn for quill editor
     * @param {any} evt
     */
    onContentChanged(evt: any): void {
    }

    /**
     * Attach files to email
     * @param {Event} evt
     */
    async onFileInput(evt: Event): Promise<void> {
        try {
            const input = evt.target as HTMLInputElement;
            this.uploadingFiles.push(input.files[0].name);
            if (input.files && input.files.length) {
                const Base64 = await this.convertToBase64(input.files[0]);
                const res = await SDKClient.uploadFiles({
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
                this.email.Files.push({ Id: res[0].RelativePath, Name: res[0].name, Url: res[0].Url });
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
     * Select template for email
     * @param {MatSelectChange} html 
     */
    selectTemplate(html: MatSelectChange): void {
        this.email.Body = `${html.value} ${this.email.Body}`;
    }
}
