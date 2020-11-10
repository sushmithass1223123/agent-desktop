import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ChatTranscripts } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';
import { IAgentData, IUIEvent, SDKClient, VoiceBotTranscriptEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-voice-bot-transcripts',
    templateUrl: './tw-voice-bot-transcripts.component.html',
    styleUrls: ['./tw-voice-bot-transcripts.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoiceBotTranscriptsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: any;

    /**
     * Perfect scroll bar directive ref
     */
    @ViewChild('transcripts')
    directiveScroll: ElementRef<HTMLDivElement>;
    /**
     * To store the fuse config for theme
     */
    fuseConfig: any;
    /**
     * Voice bot transcripts list
     */
    chatTranscripts: ChatTranscripts[] = [];
    /**
     * Current agent data
     */
    user: Partial<IAgentData> = {
        agentName: 'VoiceBot'
    };
    /**
     * Current interaction Id
     */
    interactionId: number;

    /**
     * Constructor
     * 
     * @param {FuseConfigService} _fuseConfigService
     * @param {TMACEventService} _tmacEventService
     * @param {AppUiService} _appUIService
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _tmacEventService: TMACEventService,
        private _appUIService: AppUiService
    ) {
        super();
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

        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        // get the event from event bag to make sure no events are missed
        const eventBag = this._tmacEventService.interactionEvents(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        SDKClient.events.on('VoiceBotTranscriptEvent', this.VoiceBotTranscriptEvent);
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('VoiceBotTranscriptEvent', this.VoiceBotTranscriptEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To process VoiceBotTranscriptEvent
     * 
     * @param {VoiceBotTranscriptEvent} evt 
     */
    private VoiceBotTranscriptEvent = (evt: VoiceBotTranscriptEvent) => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        // check if exisitng transcripts are there
        if (evt.Transcript) {
            // add to the chat transcripts ref
            this.chatTranscripts = JSON.parse(evt.Transcript)
                .map((m:
                    {
                        /**
                         * Bot transcript
                         */
                        botTranscription: string;
                        /**
                         * User transcript
                         */
                        userTranscription: string
                    }
                ) => {
                    const message: ChatTranscripts[] = [];
                    if (m.botTranscription) {
                        message.push({
                            who: 'VoiceBot',
                            message: m.botTranscription
                        });
                    }
                    if (m.userTranscription) {
                        message.push({
                            who: 'Customer',
                            message: m.userTranscription
                        });
                    }
                    return message;
                })
                .flat();
        }

        // add the customer speech
        if (evt.CustomerSpeech) {
            this.chatTranscripts.push(
                {
                    who: 'Customer',
                    message: evt.CustomerSpeech

                }
            );
            this._appUIService.playAudio('message', 0.5);
        }

        // scroll to the bottom of chat view
        this.scrollToBottom();
    }

    /**
     * Scroll to the bottom
     *
     * @param {number} speed
     */
    scrollToBottom(speed?: number): void {
        speed = speed || 400;
        if (this.directiveScroll) {
            // this.directiveScroll.update();

            setTimeout(() => {
                this.directiveScroll.nativeElement.scrollTo(0, speed);
            });
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

}

// for more info visit - https://angular.io/api/core
