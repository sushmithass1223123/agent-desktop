import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { SDKClient, GenericEvent, TextChatRemoteUserConnectedEvent, CallerIntentEvent } from 'tmac-sdk';
import { AotWidgetService } from '@services/aot-widget.service';
import { TwWidgetModel } from 'app/models';
import { IWidget } from 'app/interfaces';
import * as _ from 'lodash';

@Component({
    selector: 'tw-agent-assist',
    templateUrl: './tw-agent-assist.component.html',
    styleUrls: ['./tw-agent-assist.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAgentAssistComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    ucid: string;
    interactionId: number;
    widgetData: any;
    nlpData = [];

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        private _aotWidgetService: AotWidgetService
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

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        // assign the widget data
        this.widgetData = this.data.Data || new Object();

        // assign the UCID
        this.ucid = this.data?.InteractionDetails.UCID || '';

        // register to the event
        SDKClient.events.on('OnNLPDataEvent', this.OnNLPDataEvent);
        SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.on('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
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
        SDKClient.events.off('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.off('CallerIntentEvent', this.CallerIntentEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

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
    };

    private CallerIntentEvent = (evt: CallerIntentEvent): void => {
        const getData = this.nlpData.filter((i) => i.Name === evt.IntentName);
        if (getData.length > 0) {
            ++getData[0].Count;
        } else {
            this.nlpData.push({
                Name: evt.IntentName,
                Count: 0
            });
        }
        // oder by the count
        this.nlpData = _.orderBy(this.nlpData, ['Count'], ['desc']);
    };

    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        // get the intent from event
        const intent = evt.TransferIntent || evt.Intent;
        // if intent found, add it
        if (intent) {
            this.nlpData.push({
                Name: intent,
                Count: 0
            });
        }
    };

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public openAssitWidget(intent: string): void {
        let url = this.widgetData.AssistWidgetUrl;

        // check if url is provided
        if (!url) {
            this._appDataService.showMessage('Assist widget URL not found!');
            return;
        }

        // get the intent name
        const ucid = this.ucid;

        const mapObj = {
            _intent: intent,
            _ucid: ucid
        };

        const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
        url = url.replace(reg, (matched: any) => {
            return mapObj[matched];
        });

        // get assist widget config
        const title = `${this.widgetData.Title || 'Custom'} - ${intent}`;
        const icon = this.widgetData.Icon || '';
        const width = this.widgetData.Width || 500;
        const height = this.widgetData.Height || 500;
        const actions = this.widgetData.Actions || ['destroy'];
        const viewState = this.widgetData.ViewState || 'restore';

        // create a widget model
        const widget = new TwWidgetModel(title, 'tw-custom', icon);
        widget.Config.AOT = true;
        widget.Config.Position.W = width;
        widget.Config.Position.H = height;
        widget.Config.Actions = actions;
        widget.Config.ViewState = viewState;
        widget.Data.Url = url;

        // add to AOT widget service
        this._aotWidgetService.addWidget(widget);
    }
}

// for more info visit - https://angular.io/api/core
