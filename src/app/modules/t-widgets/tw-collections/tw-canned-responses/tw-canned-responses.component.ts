import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { CallerIntentEvent, IResponse, OnNLPDataEvent, SDKClient, TUtils, WorkCodeAddedEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { sortBy, uniqBy } from 'lodash';
import { merge, Observable, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TwCannedResponses } from '@ad/types';
import { TranslocoService } from '@jsverse/transloco';
import moment from 'moment';
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
    @Input() data: TwCannedResponses<any>;

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
    responseMode: 'auto' | 'manual';
    /**
     * Loading flag
     */
    loading: boolean;
    /**
     * TMAC event observable
     */
    private _tmacEvents$: Observable<any[]>;
    /**
     * TMAC event subscription
     */
    private _tmacEventSub$: Subscription;
    /**
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService, private _appUIService: AppUiService,
        private translocoService: TranslocoService) {
        super('TwCannedResponsesComponent');
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.responseMode = this.data.Data.ResponseMode ?? 'auto';

        // assign the interaction id
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        this.loading = true;
        SDKClient.getTextTemplateDepartments()
            .then((result) => {
                this.departments = result.response.filter((d) => d.Channel.toLowerCase().includes('chat'));
            })
            .catch((err) => {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.cannedResponses.getChatTemplatesError'), 'failure');
                this.logger.error('Error in fetching chat templates', err, false);
            })
            .finally(() => {
                this.loading = false;
            });

        const stream1$ = this._tmacEventService.getInteractionEvents(['CallerIntentEvent', 'WorkCodeAddedEvent'], this.interactionId);

        // NLPDataEvent is an interaction event but it does not have InteractionID so we get from 'getNonInteractionEvents'
        // TODO:: Need server side changes to get from 'getInteractionEvents'
        const stream2$ = this._tmacEventService.getNonInteractionEvents(['OnNLPDataEvent']);

        // merge two streams
        this._tmacEvents$ = merge(stream1$, stream2$).pipe(takeUntil(this.unsubscribeAll));

        // check the response mode
        if (this.responseMode === 'auto') {
            this._tmacEventSub$ = this._tmacEvents$.subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
        }
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Reset form
     * @method clearAllData
     *
     * @param source
     */
    private clearAllData(source?: string): void {
        if (source !== 'group') {
            this.selectedDepartment = null;
            this.groups = [];
        }
        this.selectedGroup = null;
        this.clearTemplates();
    }

    /**
     * To clear templates
     */
    private clearTemplates(): void {
        this.templates = [];
        this.selectedTemplate = null;
        this.templateText = '';
    }

    /**
     * WorkCodeAddedEvent Handler
     *
     * @param {WorkCodeAddedEvent} evt
     */
    WorkCodeAddedEvent(evt: WorkCodeAddedEvent): void {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        const newGroups = sortBy(uniqBy([...this.groups, evt], 'Name'), 'Name');
        this.groups = newGroups;
    }

    /**
     * CallerIntentEvent Handler
     *
     * @param {CallerIntentEvent} evt
     */
    CallerIntentEvent(evt: CallerIntentEvent): void {
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
     *
     * @param {OnNLPDataEvent} evt
     */
    OnNLPDataEvent(evt: OnNLPDataEvent): void {
        const parsedJson = JSON.parse(evt.JsonData);

        // check for the interaction
        if (this.interactionId.toString() !== parsedJson.interactionID) {
            return;
        }

        const newGroup = JSON.parse(parsedJson.nluResult);
        this.onSelectGroups({ value: newGroup.intent.name });
    }

    /**
     * Select Department
     *
     * @param {any} event
     */
    onSelectDepartment(event: any): void {
        const value = event.value;
        // check if value is there
        if (!value) {
            // clear all data
            this.clearAllData('dept');
            return;
        } else {
            this.clearTemplates();
        }

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
     *
     * @param {any} event
     */
    onSelectGroups(event: any): void {
        const value = event.value;
        // check if value is there
        if (!value) {
            // clear all data
            this.clearAllData('group');
            return;
        } else {
            this.clearTemplates();
        }

        this.loading = true;
        // get the templates for the group
        SDKClient.getTextTemplates(value, null)
            .then((result: IResponse) => {
                if (this.responseMode === 'auto') {
                    this.templates = [...result.response, ...this.templates];
                } else {
                    this.templates = result.response;
                }
            })
            .finally(() => {
                this.loading = false;
            });
    }

    /**
     * Template Selct
     *
     * @param template
     */
    onTemplateSelect(template: any): void {
        if (this.cannedMsgValidate(template?.StartTime, template?.EndTime)) {
            this.selectedTemplate = template;
            this.templateText = template.Text;
        } else {
            this.templateText = '';
            this.selectedTemplate = null;
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.cannedResponses.timeExceededMsg'), 'failure');
        }
    }

    /**
     * Send selected template
     *
     * @param {sendTemplate} template
     */
    sendTemplate(template: any): void {
        // if(this.selectedTemplate.EndTime) {
        // check if any interaction is present
        if (!this.interactionId) {
            return;
        }

        // modify the tmplate text with typed value
        template.Text = this.templateText;

        // send an event out for the listner to send
        const customEvent = {
            EventName: 'CannedResposeEvent',
            InteractionID: this.interactionId,
            Data: { Template: template }
        };

        this._tmacEventService.emitSDKEvent({
            event: customEvent,
            isInteractionEvent: true,
            log: true
        });

        if (this.responseMode !== 'auto') {
            // clear all data
            this.clearAllData();
        }
    }

    /**
     * Change Mode
     *
     * @param {MatSelectChange} event
     */
    changeMode(event: MatSelectChange): void {
        if (event.value === 'manual') {
            // unsubscribe
            this._tmacEventSub$?.unsubscribe();
        } else {
            // subscribe
            this._tmacEventSub$ = this._tmacEvents$.subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
        }
        this.clearAllData();
    }

    cannedMsgValidate(startTime: string, endTime: string): Boolean {
        const format = 'HH:mm:ss';

        const targetStartTime = moment(startTime, format);
        const targetEndTime = moment(endTime, format);
        const currentTime = moment();

        if (currentTime.isAfter(targetStartTime) && currentTime.isBefore(targetEndTime)) {
            return true;
        } else {
            return false;
        }
    }
}

interface WidgetData {
    /**
     * Template editable
     */
    EditAllowed: boolean;
    /**
     * Response mode for tempalate selection
     */
    ResponseMode: 'auto' | 'manual';
}

// for more info visit - https://angular.io/api/core
