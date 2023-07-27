import { TwVoiceCannedResponses } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentInteractionTemplate, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { groupBy } from 'lodash';
import { TwVoiceControlsService } from '../tw-voice-controls/tw-voice-controls.service';
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
    @Input() data: TwVoiceCannedResponses;
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

    /** timeout method */
    playInLoop: any;

    /**
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService, public voiceControlsService: TwVoiceControlsService) {
        super('TwVoiceCannedResponsesComponent');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On Init
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
                this.checkForAutoPlay();
            }
        });

    }

    /**
     * Check if there is a category to play the audio automatically without agent's intervention
     */
    checkForAutoPlay() {
        try{
            const templatesToAutoPlay = this.voiceTemplates['autoplay'];
            if(templatesToAutoPlay.length > 0) {
                const autoPlayDelay = this.data.Data?.autoPlayAfterTime ? this.data.Data.autoPlayAfterTime : 10;
                setTimeout(() => {
                    this.sendItem(templatesToAutoPlay[0]);
                }, autoPlayDelay*1000);

                this.checkToPlayInLoop(templatesToAutoPlay[0]);
            }
        } catch(e) {
            this.logger.error('Error occured in check for auto play', e, true);
        }
    }

    /**
     * Check if the audio to be played in loop based on the UI configuration `autoPlayLoopEnabled`.
     * @param template - voice template
     */
    checkToPlayInLoop(template) {
        if(this.data.Data?.autoPlayLoopEnabled) {
            const playInLoopDelay = this.data.Data?.autoPlauLoopPlaytime ? this.data.Data.autoPlauLoopPlaytime : 20;
            clearTimeout(this.playInLoop);
            this.playInLoop = setTimeout(() => {
                this.sendItem(template);
                this.checkToPlayInLoop(template);
            }, playInLoopDelay*1000);
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
     * Send the selected canned response
     */
    public async sendItem(item: AgentInteractionTemplate): Promise<void> {
        // get the audio buffer from wav file
        const result = await TUtils.HttpClient.sendRequest<IResponse>({
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
