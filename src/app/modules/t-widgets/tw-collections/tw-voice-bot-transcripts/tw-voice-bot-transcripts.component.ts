import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { IAgentData, SDKClient, VoiceBotTranscriptEvent, IUIEvent } from 'tmac-sdk';
import { ChatTranscripts } from 'app/interfaces';
import { TMACEventService } from '@services/tmac-event.service';

@Component({
    selector: 'tw-voice-bot-transcripts',
    templateUrl: './tw-voice-bot-transcripts.component.html',
    styleUrls: ['./tw-voice-bot-transcripts.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoiceBotTranscriptsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    chatTranscripts: ChatTranscripts[] = [];
    user: Partial<IAgentData> = {
        agentName: 'VoiceBot'
    };

    interactionId: number;

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
        private _interactionEventService: TMACEventService
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

        // get the event from event bag to make sure no events are missed
        const eventBag = this._interactionEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        SDKClient.events.on('VoiceBotTranscriptEvent', this.VoiceBotTranscriptEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('VoiceBotTranscriptEvent', this.VoiceBotTranscriptEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private VoiceBotTranscriptEvent = (evt: VoiceBotTranscriptEvent) => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }

        this.chatTranscripts = JSON.parse(evt.Transcript)
            .map((m: { botTranscription: string; userTranscription: string }) => {
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

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

}

// for more info visit - https://angular.io/api/core
