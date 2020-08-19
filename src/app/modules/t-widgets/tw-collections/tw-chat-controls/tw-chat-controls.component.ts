import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, TextChatRemoteUserConnectedEvent } from 'tmac-sdk';
import { FuseConfigService } from '@fuse/services/config.service';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { FuseConfig } from '@fuse/types';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-chat-controls',
    templateUrl: './tw-chat-controls.component.html',
    styleUrls: ['./tw-chat-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwChatControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    fuseConfig: FuseConfig;

    interactionList: any;
    interactionId: number;

    isConnected: boolean;
    sessionID: string;
    startTime: string;
    interactionDuration: string;
    chatTranscripts: any[] = [];

    user: any;
    chat: any;
    contact: any;
    replyInput: any;
    selectedChat: any;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService
    ) {
        super();

        this.isConnected = false;
        this.sessionID = 'NA';
        this.startTime = 'NA';
        this.interactionDuration = 'NA';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.fuseConfig = config;
                }
            );

        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (interactions: any[]) => {
                    // filter out the textchat interaction
                    this.interactionList = interactions.filter((i: any) => i.EventName === 'TextChatIncomingEvent');
                    console.log('TwChatControlsComponent', this.interactionList);
                }
            );

        SDKClient.events.on('TextChatRemoteUserConnectedEvent', (evt: TextChatRemoteUserConnectedEvent) => {
            console.log('TwChatControlsComponent', evt);
        });
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * check if the given message is the first message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    isFirstMessageOfGroup(message: any, i: number): boolean {
        return (i === 0 || this.chatTranscripts[i - 1] && this.chatTranscripts[i - 1].who !== message.who);
    }

    /**
     * check if the given message is the last message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    isLastMessageOfGroup(message: any, i: number): boolean {
        return (i === this.chatTranscripts.length - 1 || this.chatTranscripts[i + 1] && this.chatTranscripts[i + 1].who !== message.who);
    }

    /**
     * to set active chat interaction
     * @param item {any} interaction item
     */
    selectInteraction(item: any): void {
        this._interactionManagerService.activeInteraction = {
            type: 'textchat',
            interactionId: item.InteractionID
        };
    }
}
