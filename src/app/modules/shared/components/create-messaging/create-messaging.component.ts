import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppUiService } from '@services/app-ui.service';
import { sortBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { IResponse, SDKClient } from 'tmac-sdk';
import { SharedWrapperComponent } from '..';

/**
 *  Create  SMS Component
 */
@Component({
    selector: 'create-messaging',
    templateUrl: './create-messaging.component.html',
    styleUrls: ['./create-messaging.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class CreateMessagingComponent implements OnInit, OnDestroy {
    /**
     *  To store the fuse config for theme
     */
    fuseConfig: FuseConfig;
    /**
     * To unsubscribe from subscription subject
     */
    unsubscribeAll = new Subject();
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
     * Selected Templates
     */
    selectedTemplate: any;
    /**
     * Template text
     */
    templateText: string;
    /**
     * To number
     */
    toNumber: string;
    /**
     * To send loading flag to wrapper
     */
    loading: boolean;
    /**
     * Wrapper component Ref
     */
    @ViewChild(SharedWrapperComponent) wrapperComponent: SharedWrapperComponent;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _fuseConfigService: FuseConfigService,
        private _appUIService: AppUiService
    ) { }

    /**
     * OnInit
     */
    ngOnInit(): void {
        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((config: any) => {
                this.fuseConfig = config;
            });
        // set loading to true
        this.loading = true;

        // get the text templates
        SDKClient.getTextTemplateDepartments()
            .then((result) => {
                this.departments = result.response.filter(d => d.Channel.toLowerCase() === 'sms');
            })
            .finally(() => {
                this.loading = false;
            });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    /**
     * Reset form
     * @method clearAllData
     */
    clearAllData(): void {
        this.selectedDepartment = null;
        this.groups = [];
        this.selectedGroup = null;
        this.clearTemplates();
    }

    /**
     * To clear selected templates
     */
    clearTemplates(): void {
        this.templates = [];
        this.selectedTemplate = null;
        this.templateText = '';
    }

    /**
     * Select Department
     * @method onSelectDepartment
     * @param {any} event 
     */
    onSelectDepartment(event: any): void {
        const value = event.value;

        // check if value is there
        if (!value) {
            // clear all data
            this.clearAllData();
            return;
        }
        else {
            this.clearTemplates();
        }

        // set loading to true
        this.loading = true;

        // get the groups for the department
        SDKClient.getTextTemplateGroups(value, null)
            .then((result: IResponse) => {
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
        const value = event.value;
        // check if value is there
        if (!value) {
            // if none selected then clear templates and selected template
            this.clearTemplates();
            return;
        }

        this.loading = true;

        // get the templates for the group
        SDKClient.getTextTemplates(value, null).then((result: IResponse) => {
            this.templates = result.response;
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
        this.templateText = template.Text;
    }

    /**
     * Send selected template
     * @method sendTemplate 
     */
    async sendTemplate(): Promise<void> {
        try {
            // set loading to true
            this.loading = true;
            // init response
            let resp: IResponse = null;
            // check the subtype
            if (this.data.SubType.toLowerCase() === 'sms') {
                resp = await SDKClient.sendInstantSMS({
                    interactionId: '',
                    message: this.templateText,
                    mobile: this.toNumber.replace(/ /g, '')
                });
            }
            else if (this.data.SubType.toLowerCase() === 'whatsapp') {
                resp = await SDKClient.SendWhatsApp({
                    interactionId: '',
                    message: this.templateText,
                    mobile: this.toNumber.replace(/ /g, '')
                });
            }

            // check the response
            if (resp?.response > 0) {
                this._appUIService.showSnackbar(`Message sent to ${this.toNumber} successfully`, 'success');
                this.wrapperComponent.close();
            }
            else {
                this._appUIService.showSnackbar(`Message send failed to ${this.toNumber}`, 'failure');
            }
        } catch (error) {
            this._appUIService.showSnackbar(`Message send error to ${this.toNumber}`, 'failure');
        }
        this.loading = false;
    }

    /**
     * To check for number only
     * @param event input event
     */
    public numberOnly(event: any): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (event.key === '*' || event.key === '+' || event.key === '#') {
            return true;
        }
        else if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }
}
