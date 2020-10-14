import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { sortBy, uniqBy } from 'lodash';
import { CallerIntentEvent, IResponse, IUIEvent, SDKClient, WorkCodeAddedEvent } from 'tmac-sdk';

/**
 * TW canned Responses
 */
@Component({
    selector: 'tw-canned-responses',
    templateUrl: './tw-canned-responses.component.html',
    styleUrls: ['./tw-canned-responses.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCannedResponsesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Interaction Id
     */
    interactionId: number;
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
     * Type of response 'auto' or 'manual'
     */
    responseMode = 'auto';

    /**
     * Constructor 
     */
    constructor(
        private _tmacEventService: TMACEventService
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

        // assign the interaction id
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        SDKClient.getTextTemplateDepartments({}).then((result: IResponse) => {
            this.departments = result.response;
        });


        // get the event from event bag to make sure no events are missed
        const eventBag = this._tmacEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
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

    /**
     * WorkCodeAddedEvent Handler
     * @method WorkCodeAddedEvent
     * @param {WorkCodeAddedEvent} evt 
     */
    private WorkCodeAddedEvent = (evt: WorkCodeAddedEvent) => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        const newGroups = sortBy(uniqBy([...this.groups, evt], 'Name'), 'Name');
        this.groups = newGroups;
    }

    /**
     * CallerIntentEvent Handler
     * @method CallerIntentEvent
     * @param {CallerIntentEvent} evt 
     */
    private CallerIntentEvent = (evt: CallerIntentEvent) => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        const newGroup = { ...evt, Name: evt.IntentName };
        const newGroups = sortBy(uniqBy([...this.groups, newGroup], 'Name'), 'Name');
        this.groups = newGroups;
    }

    /**
     * OnNLPDataEvent Handler
     * @method OnNLPDataEvent
     * @param {OnNLPDataEvent} evt 
     */
    private OnNLPDataEvent = (evt: any): void => {
        const parsedJson = JSON.parse(evt.JsonData);

        // check for the interaction
        if (this.interactionId.toString() !== parsedJson.interactionID) {
            return;
        }

        const newGroup = JSON.parse(parsedJson.nluResult);
        this.onSelectGroups({ value: newGroup.intent.name });
    }

    /**
     * Reset form
     * @method clearAllData
     */
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

        // get the groups for the department
        SDKClient.getTextTemplateGroups(value, null).then((result: IResponse) => {
            this.groups = sortBy(result.response, 'Name');
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
            this.templates = [];
            this.selectedTemplate = null;
            this.templateText = '';
            return;
        }

        // get the templates for the group
        SDKClient.getTextTemplates(value, null).then((result: IResponse) => {
            if (this.responseMode === 'auto') {
                this.templates = [...result.response, ...this.templates];
            }
            else {
                this.templates = result.response;
            }
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
     * @param {sendTemplate} template 
     */
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

        if (this.responseMode !== 'auto') {
            // clear all data
            this.clearAllData();
        }
    }

    /**
     * Change Mode
     * @method changeMode
     * @param {MatSelectChange} event 
     */
    changeMode(event: MatSelectChange): void {
        if (event.value === 'manual') {
            SDKClient.events.off('OnNLPDataEvent', this.OnNLPDataEvent);
            SDKClient.events.off('CallerIntentEvent', this.CallerIntentEvent);
            SDKClient.events.off('WorkCodeAddedEvent', this.WorkCodeAddedEvent);
            this.clearAllData();
        } else {
            SDKClient.events.on('OnNLPDataEvent', this.OnNLPDataEvent);
            SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
            SDKClient.events.on('WorkCodeAddedEvent', this.WorkCodeAddedEvent);
            this.clearAllData();
        }
    }
}

// for more info visit - https://angular.io/api/core
