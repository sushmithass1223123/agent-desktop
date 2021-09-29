import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CreateEmailInput } from 'app/interfaces';
import { isStringHtml } from '@tmac/operators';

/**
 * Previews emails
 */
@Component({
    selector: 'preview-email',
    templateUrl: './preview-email.component.html',
    styleUrls: ['./preview-email.component.scss']
})
export class PreviewEmailComponent implements OnChanges {
    /**
     * Required Email details
     */
    @Input() email: CreateEmailInput;
    /**
     * Flag for when email is loading
     */
    @Input() loading: boolean;
    /**
     * Flag for when there was an error loading the email
     */
    @Input() error: boolean;
    /**
     * Method passed to retry the email loading
     */
    @Output('retry') retryEmitter = new EventEmitter();
    /**
     * Internal state of the component
     */
    _internal = {
        headerCollapsed: false,
        iframeLoading: true
    };

    /**
     * Iframe element
     */
    @ViewChild('emailBodyIframe')
    emailBodyIframe: ElementRef<HTMLIFrameElement>;

    constructor() {}

    /**
     * lifecycle hook
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.email && changes.email?.currentValue?.Body) {
            this.setEmailBody(changes.email.currentValue.Body);
        }
    }

    /**
     * Iframe event when loaded , loads the email inside it
     */
    loadEmailInIframe(iframe?: HTMLIFrameElement): void {
        this.setEmailBody(this.email.Body, iframe);
        this._internal.iframeLoading = false;
    }

    /**
     * Sets email body
     * @param {string} body
     */
    setEmailBody(body: string, iframe?: HTMLIFrameElement): void {
        const ref = iframe || this.emailBodyIframe?.nativeElement;
        if (ref) {
            const frag = document.createRange().createContextualFragment(body);
            const doc: any = ref.contentDocument || this.emailBodyIframe.nativeElement.contentWindow;
            doc.body.innerHTML = `
        <style>
            ::-webkit-scrollbar{width:4px !important;height:4px !important;}
            ::-webkit-scrollbar-thumb{box-shadow:inset 0 0 0 4px rgba(0,0,0,0.37) !important}
            ${
                !isStringHtml(this.email.Body)
                    ? `body {
                white-space: pre-wrap;
            }`
                    : ''
            }
        </style>`;
            doc.body.appendChild(frag);
        }
    }

    /**
     * Retry method to reload the email
     */
    retry(): void {
        this.retryEmitter.emit();
    }

    /**
     * Opens a selected attachment file
     * @param {String} fileUrl
     */
    openFile(fileUrl: string): void {
        window.open(fileUrl);
    }
}
