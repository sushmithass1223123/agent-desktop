import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { IResponse, IUIEvent, SDKClient, TUtils } from '@tmac/sdk';
import { IWidget } from 'app/interfaces';
import { getValueFromEvent } from 'app/utils';
import { sortBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';

/**
 * Tw Compose Messaging Component
 */
@Component({
    selector: 'tw-compose-messaging',
    templateUrl: './tw-compose-messaging.component.html',
    styleUrls: ['./tw-compose-messaging.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwComposeMessagingComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget<any, IWidgetData>;
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
     * Widget data
     */
    widgetData: IWidgetData;
    /**
     * Interaction reference
     */
    interaction: IUIEvent;

    constructor(private _appUIService: AppUiService, private _tmacEventService: TMACEventService) {
        super();
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set widget data
        this.widgetData = this.data.Data;

        // set loading to true
        this.loading = true;

        // check if number to be taken from TMAC event
        if (this.widgetData.Number && !isNaN(Number(this.widgetData.Number))) {
            this.toNumber = this.widgetData.Number;
        }

        // get the text templates
        SDKClient.getTextTemplateDepartments()
            .then((result) => {
                this.departments = result.response.filter((d) => d.Channel.toLowerCase() === 'sms');
            })
            .catch((err) => {
                this._appUIService.showSnackbar('Error in fetching SMS templates', 'failure');
                this.logger.error('Error in fetching SMS templates', err, false);
            })
            .finally(() => {
                this.loading = false;
            });

        // if there is an interaction
        if (this.data.InteractionDetails) {
            this.interaction = this.data.InteractionDetails;

            // check if number to be taken from TMAC event
            if (!this.widgetData.Number?.toLowerCase().includes('event')) {
                return;
            }

            // get the event name
            const eventName = this.widgetData.Number?.split('.')?.shift() as any;
            // register to tmac events
            if (eventName) {
                this._tmacEventService
                    .getInteractionEvents([eventName], this.interaction.InteractionID)
                    .pipe(takeUntil(this.unsubscribeAll))
                    .subscribe((evts) =>
                        evts.forEach((evt) => {
                            this.toNumber = getValueFromEvent(
                                {
                                    DefaultValue: '',
                                    Title: '',
                                    ValueSource: this.widgetData.Number,
                                    MaskData: null
                                },
                                evt
                            );
                        })
                    );
            }
        }
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
        } else {
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
        SDKClient.getTextTemplates(value, null)
            .then((result: IResponse) => {
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
            if (this.widgetData.Type.toLowerCase() === 'sms') {
                resp = await SDKClient.sendInstantSMS({
                    interactionId: this.interaction?.InteractionID.toString() ?? '',
                    message: this.templateText,
                    mobile: this.toNumber.replace(/ /g, '')
                });
            } else if (this.widgetData.Type.toLowerCase() === 'whatsapp') {
                resp = await SDKClient.SendWhatsApp({
                    interactionId: '',
                    message: this.templateText,
                    mobile: this.toNumber.replace(/ /g, '')
                });
            }

            // check the response
            if (resp?.response > 0) {
                this._appUIService.showSnackbar(`Message sent to ${this.toNumber} successfully`, 'success');
                // clear data
                this.clearAllData();
                this.toNumber = '';
                // destroy this widget provided
                if (typeof this.data.destroy === 'function') {
                    this.data.destroy();
                }
            } else {
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
