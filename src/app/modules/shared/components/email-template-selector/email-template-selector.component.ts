import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TwEmailTemplatePreviewComponent } from '@modules/t-widgets/tw-collections/tw-email-template-preview/tw-email-template-preview.component';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { EmailTemplate, SDKClient } from '@tmac/sdk';
import { TwWidgetModel } from 'app/models';

@Component({
    selector: 'email-template-selector',
    templateUrl: './email-template-selector.component.html',
    styleUrls: ['./email-template-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateSelectorComponent implements OnInit, OnDestroy {
    /**
     * Emitted when a template selected
     */
    @Output()
    selectTemplate = new EventEmitter();

    /**
     * Available templates
     */
    availableTemplates = {
        departments: {}
    };

    /**
     * Template preview data
     */
    templatePreview = {
        aots: []
    };

    /**
     * Preview Dialog Ref
     */
    previewDialogRef: MatDialogRef<any>;

    constructor(private appUiService: AppUiService, private aotService: AOTWidgetService, private matDialog: MatDialog) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
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
     * Select template for email
     * @param {EmailTemplate} preview
     */
    emitSelectTemplate(preview: EmailTemplate): void {
        // this.templatePreview.preview = preview.BodyHTML;
        const data = {
            info: preview,
            Name: 'Template',
            useTemplate: (info: EmailTemplate) => this.useTemplate(info),
            closeTemplate: () => this.closeTemplatePreview()
        };
        if (preview.Type === 'Form') {
            const widget = new TwWidgetModel('Template', 'tw-email-template-preview');
            widget.Name = 'Template';
            widget.Config.Anchor = true;
            widget.Config.Position.W = 500;
            widget.Config.Actions = ['maximize', 'collapse', 'destroy'];
            widget.Data = data;
            this.aotService.addWidget(widget);
            this.templatePreview.aots.push(widget.ID);
        } else {
            this.previewDialogRef = this.matDialog.open(TwEmailTemplatePreviewComponent, {
                data,
                minWidth: '40%',
                panelClass: `email-template-dialog__${(data.info?.Type || '').replaceAll(' ', '')}`
            });
        }
    }

    /**
     * Closes tempate preview
     */
    closeTemplatePreview(): void {
        this.templatePreview.aots.forEach((aotID) => {
            this.aotService.destroyWidget(aotID);
        });
        this.previewDialogRef?.close();
    }

    /**
     * Adds template to editor
     */
    useTemplate(template: EmailTemplate): void {
        this.selectTemplate.emit(template.BodyHTML);
        this.closeTemplatePreview();
    }
}
