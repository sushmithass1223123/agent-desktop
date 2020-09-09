import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { sortBy, uniqBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { CallerIntentEvent, IResponse, SDKClient, WorkCodeAddedEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-canned-responses',
    templateUrl: './tw-canned-responses.component.html',
    styleUrls: ['./tw-canned-responses.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCannedResponsesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    interactionId: number;
    departments = [];
    selectedDepartment: any;
    groups = [];
    selectedGroup: any;
    templates = [];
    selectedTemplate: any;
    templateText: string;

    responseMode = 'auto';

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        // assign the interaction id
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        SDKClient.getTextTemplateDepartments({}).then((result: IResponse) => {
            this.departments = result.response;
        });

        SDKClient.events.on('OnNLPDataEvent', this.OnNLPDataEvent);
        SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.on('WorkCodeAddedEvent', this.WorkCodeAddedEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        SDKClient.events.off('OnNLPDataEvent', this.OnNLPDataEvent);
        SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.off('CallerIntentEvent', this.CallerIntentEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private clearAllData(): void {
        this.selectedDepartment = null;
        this.groups = [];
        this.selectedGroup = null;
        this.templates = [];
        this.selectedTemplate = null;
        this.templateText = '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
    onSelectDepartment(event: any): void {
        const value = event.value;
        // check if value is there
        if (!value) {
            // clear all data
            this.clearAllData();
            return;
        }

        // get the groups for the department
        SDKClient.getTextTemplateGroups(value, null).then((result: IResponse) => {
            this.groups = sortBy(result.response, 'Name');
        });
    }

    onSelectGroups(event: any): void {
        const value = event.value;
        // check if value is there
        if (!value) {
            // if none selected then clear templates and selected template
            this.templates = [];
            this.selectedTemplate = null;
            this.templateText = '';
            return;
        }

        // get the templates for the group
        SDKClient.getTextTemplates(value, null).then((result: IResponse) => {
            this.templates = result.response;
        });
    }

    onTemplateSelect(template: any): void {
        this.selectedTemplate = template;
        this.templateText = template.Text;
    }

    sendTemplate(template: any): void {
        // check if any interaction is present
        if (!this.interactionId) {
            return;
        }

        // modify the tmplate text with typed value
        template.Text = this.templateText;

        // send an event out for the listner to send
        SDKClient.events.emit('CannedResposeEvent', {
            InteractionID: this.interactionId,
            Template: template
        });

        // clear all data
        this.clearAllData();
    }

    WorkCodeAddedEvent = (evt: WorkCodeAddedEvent) => {
        const newGroups = sortBy(uniqBy([...this.groups, evt], 'Name'), 'Name');
        this.groups = newGroups;
    };

    CallerIntentEvent = (event: CallerIntentEvent) => {
        const newGroup = { ...event, Name: event.IntentName };
        const newGroups = sortBy(uniqBy([...this.groups, newGroup], 'Name'), 'Name');
        this.groups = newGroups;
    };

    OnNLPDataEvent = (event: any): void => {
        const newGroup = JSON.parse(JSON.parse(event.JsonData).nluResult);
        newGroup.Name = newGroup.intent.name;
        const newGroups = sortBy(uniqBy([...this.groups, newGroup], 'Name'), 'Name');
        this.groups = newGroups;
    };

    changeMode(event: MatSelectChange): void {
        if (event.value === 'manual') {
            console.log('Cancelling listeners');
            SDKClient.events.off('OnNLPDataEvent', this.OnNLPDataEvent);
            SDKClient.events.off('CallerIntentEvent', this.CallerIntentEvent);
            SDKClient.events.off('WorkCodeAddedEvent', this.WorkCodeAddedEvent);
            this.clearAllData();
        } else {
            console.log('Llistening');
            SDKClient.events.on('OnNLPDataEvent', this.OnNLPDataEvent);
            SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
            SDKClient.events.on('WorkCodeAddedEvent', this.WorkCodeAddedEvent);
            this.clearAllData();
        }
    }
}

// for more info visit - https://angular.io/api/core
