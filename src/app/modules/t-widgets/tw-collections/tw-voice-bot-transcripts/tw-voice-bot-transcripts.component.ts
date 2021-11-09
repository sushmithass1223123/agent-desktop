import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { IAgentData, VoiceBotTranscriptEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ChatTranscripts } from 'app/interfaces';
import { filter, takeUntil } from 'rxjs/operators';
import { TwVoiceBotTranscripts } from '@ad/types';

/**
 * Voice Bot Transcript Component
 */
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
    @Input() data: TwVoiceBotTranscripts;

    /**
     * Perfect scroll bar directive ref
     */
    @ViewChild('transcripts')
    directiveScroll: ElementRef<HTMLDivElement>;
    /**
     * To store the fuse config for theme
     */
    // fuseConfig: any;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };
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
     * @param {TMACEventService} _tmacEventService
     * @param {AppUiService} _appUIService
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
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

        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
        //     this.fuseConfig = config;
        // });

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        this._tmacEventService
            .getInteractionEvents(['VoiceBotTranscriptEvent'], this.interactionId)
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

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To process VoiceBotTranscriptEvent
     *
     * @param {VoiceBotTranscriptEvent} evt
     */
    private VoiceBotTranscriptEvent(evt: VoiceBotTranscriptEvent): void {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        // check if exisitng transcripts are there
        if (evt.Transcript) {
            // add to the chat transcripts ref
            this.chatTranscripts = JSON.parse(evt.Transcript)
                .map(
                    (m: {
                        /**
                         * Bot transcript
                         */
                        botTranscription: string;
                        /**
                         * User transcript
                         */
                        userTranscription: string;
                    }) => {
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
                    }
                )
                .flat();
        }

        // add the customer speech
        if (evt.CustomerSpeech) {
            this.chatTranscripts.push({
                who: 'Customer',
                message: evt.CustomerSpeech
            });
            this._appUIService.playAudio('message', 0.5, false);
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
