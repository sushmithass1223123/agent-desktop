import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import * as _ from 'lodash';
import { AgentNotificaitonEvent, CallerIntentEvent, GenericEvent, IUIEvent, SDKClient, TextChatRemoteUserConnectedEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-agent-assist',
    templateUrl: './tw-agent-assist.component.html',
    styleUrls: ['./tw-agent-assist.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAgentAssistComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * To hold all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * UCID of an interaction
     */
    ucid: string;
    /**
     * ID of an interaction
     */
    interactionId: number;
    /**
     * Widget custom data
     */
    widgetData: any;
    /**
     * NLP data from event
     */
    nlpData = [];

    /**
     * Constructor 
     * @param {AOTWidgetService} _aotWidgetService
     * @param {TMACEventService} _tmacEventService
     * @param {AppUiService} _appUIService
     */
    constructor(
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private _appUIService: AppUiService
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

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        // assign the widget data
        this.widgetData = this.data.Data || new Object();

        // assign the UCID
        this.ucid = this.data?.InteractionDetails.UCID || '';

        // get the event from event bag to make sure no events are missed
        const eventBag = this._tmacEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        // register to the event
        SDKClient.events.on('OnNLPDataEvent', this.OnNLPDataEvent);
        SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.on('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     * A callback method that performs
     *  clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // de-register from the event
        SDKClient.events.off('OnNLPDataEvent', this.OnNLPDataEvent);
        SDKClient.events.off('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.off('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To process OnNLPDataEvent
     * @param evt GenericEvent event data
     */
    private OnNLPDataEvent = (evt?: GenericEvent): void => {
        const receivedData = evt;
        if (receivedData) {
            const parsedJson = JSON.parse(receivedData.JsonData);

            // check for the interaction
            if (this.interactionId.toString() !== parsedJson.interactionID) {
                return;
            }

            // filter for agent only
            if (parsedJson.messageSource === 'agent') {
                return;
            }

            // get the nlu result
            const parsedNlu = JSON.parse(parsedJson.nluResult) || null;

            // get the intent
            const intent = parsedNlu?.intent;

            if (intent && intent.confidence >= (this.widgetData?.Confidence || 0.5)) {
                const getData = this.nlpData.filter((i) => i.Name === intent.name);
                if (getData.length > 0) {
                    ++getData[0].Count;
                } else {
                    this.nlpData.push({
                        Name: parsedNlu.intent.name,
                        Count: 0
                    });
                }
            }
            // oder by the count
            this.nlpData = _.orderBy(this.nlpData, ['Count'], ['desc']);
        }
    }

    /**
     * To process CallerIntentEvent
     * @param evt CallerIntentEvent event data
     */
    private CallerIntentEvent = (evt: CallerIntentEvent): void => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }
        // get the intent from event
        const intent = evt.IntentName;

        // check if intent is present
        if (!intent) {
            return;
        }

        this.addIntentToNLPData(intent);
    }

    /**
     * To process TextChatRemoteUserConnectedEvent
     * @param evt TextChatRemoteUserConnectedEvent event data
     */
    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        // get the intent from event
        const intent = evt.TransferIntent || evt.Intent;

        // check if intent is present
        if (!intent) {
            return;
        }

        this.addIntentToNLPData(intent);
    }

    /**
     * To process AgentNotificaitonEvent
     * @param evt AgentNotificaitonEvent event data
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // check if the event for the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check the type
        if (evt.Type.toLowerCase() === 'executeaction') {
            // parse the action
            const parsedMessage: {
                /**
                 * Type of action
                 */
                Action: string,
                /**
                 * Data for the notification
                 */
                Data: string,
                /**
                 * Mandatory action to be taken
                 */
                IsMandatory: boolean,
                /**
                 * Comment for the notification
                 */
                Comment: string;
                /**
                 * Header for the assist widget
                 */
                Header: string,
            } = JSON.parse(evt.Message);

            // get the action
            switch (parsedMessage.Action.toLowerCase()) {
                case 'vivr':
                    {
                        this.openAssitWidget(parsedMessage.Header, parsedMessage.IsMandatory, parsedMessage.Data);
                        break;
                    }
            }
        }

    }

    /**
     * To add intent to NLP data
     * @param intent Intent to be added
     */
    private addIntentToNLPData(intent: string): void {
        const getData = this.nlpData.filter((i) => i.Name === intent);
        if (getData.length > 0) {
            ++getData[0].Count;
        } else {
            this.nlpData.push({
                Name: intent,
                Count: 0
            });
        }

        // oder by the count
        this.nlpData = _.orderBy(this.nlpData, ['Count'], ['desc']);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To open assist widget
     * @param intent Intent to be passed to assist widgetData
     * @param isMandatory [OPTIONAL] Falg to pop confirmation before the widget close
     * @param assistUrl [OPTIONAL] Assist url to be opened
     */
    public openAssitWidget(intent: string, isMandatory?: boolean, assistUrl?: string): void {
        // check if the url to be taken from param
        let url = assistUrl ? assistUrl : this.widgetData.AssistWidgetUrl;

        // check if url is provided
        if (!url) {
            this._appUIService.showSnackbar('Assist widget URL not found!', 'failure');
            return;
        }

        // if the url is provided with the method then do not process it query params
        if (!assistUrl) {
            // get the intent name
            const ucid = this.ucid;

            // get the map object
            const mapObj = {
                _intent: intent,
                _ucid: ucid
            };

            // check the regex and replace the item in the url
            const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
            url = url.replace(reg, (matched: any) => {
                return mapObj[matched];
            });
        }

        // get assist widget config
        const title = `${this.widgetData.Title || 'Custom'} - ${intent}`;
        const icon = this.widgetData.Icon || '';
        const width = this.widgetData.Width || 500;
        const height = this.widgetData.Height || 500;
        const actions = this.widgetData.Actions || ['destroy'];
        const viewState = this.widgetData.ViewState || 'restore';

        // create a widget model
        const widget = new TwWidgetModel(title, 'tw-custom', icon);
        widget.Config.Position.W = width;
        widget.Config.Position.H = height;
        widget.Config.Actions = actions;
        widget.Config.ViewState = viewState;

        // if mandatory, pop a confiration and destroy
        if (isMandatory) {
            widget.Data.Url = url;
            widget.OnDestroy = () => {
                // get confiration before close
                const confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Close', 'Are you sure to close?');
                confirmDialogRef.afterClosed().subscribe((resp) => {
                    if (resp) {
                        widget.destroy();
                    }
                });
                return false;
            };
        }

        // add to AOT widget service
        this._aotWidgetService.addWidget(widget);
    }
}

// for more info visit - https://angular.io/api/core
