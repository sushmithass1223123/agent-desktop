import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { setStringVars } from '@tmac/operators';
import { AgentAssistDataEvent, CallerIntentEvent, GenericEvent, SDKClient, TextChatRemoteUserConnectedEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { orderBy } from 'lodash';
import { merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AOTWidget, TwAgentAssist } from '@ad/types';

import { TranslocoService } from '@jsverse/transloco';
/**
 * Agent Assist Component
 */
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
    nlpData: {
        /**
         * Name of intent
         */
        Name: string;
        /**
         * Count of intent
         */
        Count: number;
        /**
         * Url to assist
         */
        Url?: string;
        /**
         * Width of assist widget
         */
        Width?: number;
        /**
         * Height of assist widget
         */
        Height?: number;
    }[] = [];

    /**
     * Constructor
     * @param {AOTWidgetService} _aotWidgetService
     * @param {TMACEventService} _tmacEventService
     * @param {AppUiService} _appUIService
     */
    constructor(private _aotWidgetService: AOTWidgetService, private _tmacEventService: TMACEventService,
         private _appUIService: AppUiService,
         private translocoService: TranslocoService) {
        super('TwAgentAssistComponent');
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        // assign the widget data
        this.widgetData = this.data.Data || new Object();

        // assign the UCID
        this.ucid = this.data?.InteractionDetails?.UCID || '';

        // TODO:: To implement interaction based AOT
        // SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);

        const stream1$ = this._tmacEventService.getInteractionEvents(
            ['CallerIntentEvent', 'TextChatRemoteUserConnectedEvent', 'AgentAssistDataEvent'],
            this.interactionId
        );

        // NLPDataEvent is an interaction event but it does not have InteractionID so we get from 'getNonInteractionEvents'
        // TODO:: Need server side changes to get from 'getInteractionEvents'
        const stream2$ = this._tmacEventService.getNonInteractionEvents(['OnNLPDataEvent']);

        // merge two streams
        merge(stream1$, stream2$)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To add intent to NLP data
     *
     * @param intent Intent to be added
     * @param url [OPTIONAL] Assist url to be opened
     * @param width [OPTIONAL] Width of assit widget
     * @param height [OPTIONAL] Height of assist widget
     */
    private addIntentToNLPData(intent: string, url?: string, width?: number, height?: number): void {
        const getData = this.nlpData.filter((i) => i.Name === intent);
        if (getData.length > 0) {
            ++getData[0].Count;
        } else {
            this.nlpData.push({
                Name: intent,
                Count: 0,
                Url: url,
                Width: width,
                Height: height
            });
        }

        // oder by the count
        this.nlpData = orderBy(this.nlpData, ['Count'], ['desc']);
    }

    /**
     * To process OnNLPDataEvent
     *
     * @param {GenericEvent} evt
     */
    OnNLPDataEvent(evt?: GenericEvent): void {
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
            this.nlpData = orderBy(this.nlpData, ['Count'], ['desc']);
        }
    }

    /**
     * To process CallerIntentEvent
     *
     * @param {CallerIntentEvent} evt
     */
    CallerIntentEvent(evt: CallerIntentEvent): void {
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
     *
     * @param {TextChatRemoteUserConnectedEvent} evt
     */
    TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        // get the intent from event
        const intent = evt.TransferIntent || evt.Intent;

        // check if intent is present
        if (!intent) {
            return;
        }

        this.addIntentToNLPData(intent);
    };

    /**
     * To process AgentNotificaitonEvent
     * @param {AgentNotificaitonEvent} evt
     */
    // AgentNotificaitonEvent(evt: AgentNotificaitonEvent):void {
    //     // check the type
    //     if (evt.Type.toLowerCase() === 'executeaction') {
    //         // parse the action
    //         const parsedMessage: {
    //             /**
    //              * Type of action
    //              */
    //             Action: string,
    //             /**
    //              * Data for the notification
    //              */
    //             Data: string,
    //             /**
    //              * Mandatory action to be taken
    //              */
    //             IsMandatory: boolean,
    //             /**
    //              * Comment for the notification
    //              */
    //             Comment: string;
    //             /**
    //              * Header for the assist widget
    //              */
    //             Header: string,
    //         } = JSON.parse(evt.Message);

    //         // get the action
    //         switch (parsedMessage.Action.toLowerCase()) {
    //             case 'vivr':
    //                 {
    //                     this.openAssitWidget(parsedMessage.Header, parsedMessage.IsMandatory, parsedMessage.Data);
    //                     break;
    //                 }
    //         }
    //     }

    // }

    /**
     * To process AgentAssistDataEvent
     *
     * @param {AgentAssistDataEvent} evt
     */
    AgentAssistDataEvent(evt: AgentAssistDataEvent): void {
        // add intent to the list
        this.addIntentToNLPData(evt.Name, evt.Url, evt.Width, evt.Height);
    }

    /**
     * To open assist widget
     *
     * @param intent Intent to be passed to assist widgetData
     * @param isMandatory [OPTIONAL] Falg to pop confirmation before the widget close
     * @param assistUrl [OPTIONAL] Assist url to be opened
     * @param width [OPTIONAL] Width of assit widget
     * @param height [OPTIONAL] Height of assist widget
     */
    openAssitWidget(intent: string, isMandatory?: boolean, assistUrl?: string, width?: number, height?: number): void {
        // check if the url to be taken from param
        let url = assistUrl ? assistUrl : this.widgetData.AssistWidgetUrl;

        // check if url is provided
        if (!url) {
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.agentAssist.urlNotFound'), 'failure');
            return;
        }

        // if the url is provided with the method then do not process it query params
        if (!assistUrl) {
            // get the map object
            const mapObj = {
                intent: intent,
                Interaction: this.data?.InteractionDetails,
                AgentData: SDKClient.getAgentData()
            };

            // form the url
            url = setStringVars(url, mapObj);
        }

        // get assist widget config
        const title = `${this.widgetData.Title || 'Custom'} - ${intent}`;
        const icon = this.widgetData.Icon || '';
        const actions = this.widgetData.Actions || ['destroy'];
        const viewState = this.widgetData.ViewState || 'restore';

        width = width || this.widgetData.Width || 500;
        height = height || this.widgetData.Height || 500;

        // create a widget model
        const widget = new TwWidgetModel(title, 'tw-custom', icon);
        widget.Config.Position.W = width;
        widget.Config.Position.H = height;
        widget.Config.Actions = actions;
        widget.Config.ViewState = viewState;
        widget.Data.Url = url;

        // if mandatory, pop a confiration and destroy
        if (isMandatory) {
            widget.OnDestroy = () => {
                // get confiration before close
                const confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', this.translocoService.translate('widgets.agentAssist.confirmCloseTitle'), this.translocoService.translate('widgets.agentAssist.confirmCloseMsg'));
                confirmDialogRef.afterClosed().subscribe((resp) => {
                    if (resp) {
                        widget.destroy();
                    }
                });
                return false;
            };
        }

        // add to AOT widget service
        this._aotWidgetService.addWidget(widget as AOTWidget);
    }
}

// for more info visit - https://angular.io/api/core
