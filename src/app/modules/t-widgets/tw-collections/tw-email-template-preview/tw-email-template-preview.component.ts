import { TwEmailTemplatePreview } from '@ad/types';
import { Component, Inject, Input, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { EmailTemplate } from '@tmac/sdk';

type ModalProps = {
    /**
     * templare info
     */
    info: EmailTemplate;

    /**
     * use Template
     */
    useTemplate: () => void;

    /**
     * closes template
     */
    closeTemplate: () => void;
};

/**
 * Email preview widget
 */
@Component({
    selector: 'tw-email-template-preview',
    templateUrl: './tw-email-template-preview.component.html',
    styleUrls: ['./tw-email-template-preview.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwEmailTemplatePreviewComponent extends TWidgetWrapper implements OnInit {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwEmailTemplatePreview;

    /**
     * safe html for input injection
     */
    safeHtml?: SafeHtml;
    /**
     * template info
     */
    templateInfo: EmailTemplate;

    /**
     * uses template
     */
    use: (template: EmailTemplate) => void;

    /**
     * closes template
     */
    close: () => void;

    constructor(@Optional() @Inject(MAT_DIALOG_DATA) private dialogData: ModalProps, private domSanitizer: DomSanitizer) {
        super();
    }

    /**
     * lifecycle hook
     */
    ngOnInit(): void {
        const data = this.dialogData;
        const templateInfo: EmailTemplate = data.info;
        if (templateInfo.Type === 'Form') {
            this.safeHtml = this.domSanitizer.bypassSecurityTrustHtml(
                templateInfo.BodyHTML.replaceAll(
                    '##Input##',
                    `<span class="dynamic-input" style="min-width: 50px;border-bottom: 1px solid gray;width: 100px;display: inline-block;" role="textbox" contenteditable> </span>`
                )
            );
        }
        this.templateInfo = data.info;
        this.use = data.useTemplate;
        this.close = data.closeTemplate;
    }

    /**
     * Processes the form input and sends updated info
     */
    processFormTemplate(): void {
        let BodyHTML = this.templateInfo.BodyHTML;
        Array.from(document.getElementsByClassName('dynamic-input')).forEach((el) => {
            BodyHTML = BodyHTML.replace('##Input##', el.innerHTML);
        });
        this.use({ ...this.templateInfo, BodyHTML });
    }
}
