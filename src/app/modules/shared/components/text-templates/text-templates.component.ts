import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { IResponse, SDKClient } from '@tmac/sdk';
import { sortBy } from 'lodash';

/**
 * Tw Compose Messaging Component
 */
@Component({
    selector: 'text-templates',
    templateUrl: './text-templates.component.html',
    styleUrls: ['./text-templates.component.scss'],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class TextTemplatesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Departments
     */
    departments = [];
    /**
     * Selected Departments
     */
    selectedDepartment: any;
    /**
     * Groups
     */
    groups = [];
    /**
     * Selected Groups
     */
    selectedGroup: any;
    /**
     * Template list
     */
    templates = [];
    /**
     * Template text
     */
    @Input()
    template = '';
    /**
     * Template text
     */
    selectedTemplate: any;
    /**
     * To send loading flag to wrapper
     */
    loading: boolean;

    /**
     * emits send template event to parent
     */
    @Output()
    sendTemplate = new EventEmitter();

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$,
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    showTemplates = false;

    constructor(private _appUIService: AppUiService, private _fuseFacadeService: FuseFacadeService) {
        super('TextTemplatesComponent');
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // set loading to true
        this.loading = true;

        // get the text templates
        SDKClient.getTextTemplateDepartments()
            .then((result) => {
                this.departments = result.response;
                // .filter((d) => d.Channel.toLowerCase() === 'sms');
            })
            .catch((err) => {
                this._appUIService.showSnackbar('Error in fetching SMS templates', 'failure');
                this.logger.error('Error in fetching SMS templates', err, false);
            })
            .finally(() => {
                this.loading = false;
            });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Reset form
     * @method clearAllData
     */
    clearAllData = (): void => {
        this.selectedDepartment = null;
        this.groups = [];
        this.selectedGroup = null;
        this.showTemplates = false;
        this.clearTemplates();
    };

    /**
     * To clear selected templates
     */
    clearTemplates(): void {
        this.templates = [];
        this.selectedTemplate = null;
        this.template = '';
    }

    /**
     * Select Department
     * @method onSelectDepartment
     * @param {any} event
     */
    onSelectDepartment(event: any): void {
        const value = event?.value?.ID;

        // check if value is there
        if (!value) {
            // clear all data
            this.clearAllData();
            return;
        } else {
            this.clearTemplates();
        }

        // set loading to true
        this.loading = true;

        // get the groups for the department
        SDKClient.getTextTemplateGroups(value, null)
            .then((result) => {
                this.groups = sortBy(result.response, 'Name');
            })
            .finally(() => {
                this.loading = false;
            });
    }

    /**
     * Slect Groups
     * @method onSelectGroups
     * @param {any} event
     */
    onSelectGroups(event: any): void {
        const value = event?.value?.Name;
        // check if value is there
        if (!value) {
            // if none selected then clear templates and selected template
            this.clearTemplates();
            return;
        }

        this.loading = true;

        // get the templates for the group
        SDKClient.getTextTemplates(value, null)
            .then((result: IResponse) => {
                this.templates = result.response;
                this.showTemplates = !!this.templates.length;
            })
            .finally(() => {
                this.loading = false;
            });
    }

    /**
     * Template Selct
     * @method onTemplateSelect
     * @param template
     */
    onTemplateSelect(template: any): void {
        this.selectedTemplate = template;
        this.showTemplates = false;
        this.template = template.Text;
    }

    /**
     * Send selected template
     * @method sendTemplate
     */
    async emitSendTemplate(): Promise<void> {
        this.showTemplates = false;
        this.sendTemplate.emit(this.template);
    }

    /**
     * To check for number only
     * @param event input event
     */
    public numberOnly(event: any): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (event.key === '*' || event.key === '+' || event.key === '#') {
            return true;
        } else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }
}

interface IWidgetData {
    /**
     * Type of messaging
     */
    Type: string;
    /**
     * Number to send/ Number template to fetch from TMAC event
     */
    Number: string;
}
