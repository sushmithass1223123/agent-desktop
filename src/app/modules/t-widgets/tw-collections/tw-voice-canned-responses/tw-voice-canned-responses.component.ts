import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentInteractionTemplate, CallDisconnectedEvent, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { groupBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';

/**
 * TwVoiceCannedResponsesComponent
 */
@Component({
    selector: 'tw-voice-canned-responses',
    templateUrl: './tw-voice-canned-responses.component.html',
    styleUrls: ['./tw-voice-canned-responses.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoiceCannedResponsesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Interaction ID
     */
    interactionId: number;
    /**
     * Voice templates
     */
    voiceTemplates: any = [];
    /**
     * Selected template
     */
    selectedItem: AgentInteractionTemplate;

    /**
     * Constructor
     */
    constructor(private _aotWidgetService: AOTWidgetService, private _tmacEventService: TMACEventService) {
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
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        // get the voice templates
        SDKClient.getInteractionTemplates('voice').then((dt: IResponse) => {
            // get the response
            const response: AgentInteractionTemplate[] = dt.response;
            // check the response
            if (response.length > 0) {
                this.voiceTemplates = groupBy(response, 'Category');
            }
        });

        this._tmacEventService
            .getInteractionEvents(['CallDisconnectedEvent'], this.interactionId)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To process CallDisconnectedEvent
     */
    private CallDisconnectedEvent(evt: CallDisconnectedEvent): void {
        // close the widget
        this._aotWidgetService.destroyWidget(this.data.ID);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Send the selected canned response
     */
    public async sendItem(item: AgentInteractionTemplate): Promise<void> {
        // get the audio buffer from wav file
        const result: IResponse = await TUtils.HttpClient.sendRequest({
            urls: [item.Data],
            responseType: 'arraybuffer'
        });

        // check the response
        if (result.response) {
            // create custom event and send to the interaction
            const customEvent = {
                EventName: 'VoiceCannedResponseEvent',
                InteractionID: this.interactionId,
                AudioBuffer: result.response,
                Item: item
            };

            // emit a template message sent event to show in UI
            this._tmacEventService.emitSDKEvent({
                event: customEvent,
                isInteractionEvent: true,
                log: true
            });
        }
    }
}

// for more info visit - https://angular.io/api/core
