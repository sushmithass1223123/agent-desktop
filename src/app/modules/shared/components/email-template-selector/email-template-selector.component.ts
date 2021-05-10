import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { AppUiService } from '@services/app-ui.service';
import { EmailTemplate, SDKClient } from '@tmac/sdk';

@Component({
    selector: 'email-template-selector',
    templateUrl: './email-template-selector.component.html',
    styleUrls: ['./email-template-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailTemplateSelectorComponent implements OnInit {
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

    constructor(private appUiService: AppUiService) {}

    ngOnInit() {
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
     * Emits selected template
     * @param preview
     */
    emitSelectTemplate(preview: EmailTemplate): void {
        this.selectTemplate.emit(preview);
    }
}
