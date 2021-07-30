import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CreateEmailInput } from 'app/interfaces';
import { checkStringIsHTML } from 'app/utils';

/**
 * Previews emails
 */
@Component({
    selector: 'preview-email',
    templateUrl: './preview-email.component.html',
    styleUrls: ['./preview-email.component.scss']
})
export class PreviewEmailComponent {
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

    constructor() {}

    /**
     * Iframe event when loaded , loads the email inside it
     * @param {HTMLIFrameElement} iframe
     */
    loadEmailInIframe(iframe: HTMLIFrameElement): void {
        const frag = document.createRange().createContextualFragment(this.email.Body);
        const doc: any = iframe.contentDocument || iframe.contentWindow;
        doc.body.innerHTML = `
        ${doc.body.innerHTML} 
        <style>
            ::-webkit-scrollbar{width:4px !important;height:4px !important;}
            ::-webkit-scrollbar-thumb{box-shadow:inset 0 0 0 4px rgba(0,0,0,0.37) !important}
            ${
                !checkStringIsHTML(this.email.Body)
                    ? `body {
                white-space: pre-wrap;
            }`
                    : ''
            }
        </style>`;
        doc.body.appendChild(frag);
        this._internal.iframeLoading = false;
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
