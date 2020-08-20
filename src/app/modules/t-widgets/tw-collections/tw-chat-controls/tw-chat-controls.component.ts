import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { InteractionEventsService } from '@services/interaction-events.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ActiveInteraction, InteractionRef, IWidget } from 'app/interfaces';
import { timer } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import {
    IAgentData,


    SDKClient,
    TextChatDisconnectedEvent,
    TextChatMessageReceivedEvent,



    TextChatMessageSentEvent, TextChatRemoteUserConnectedEvent,

    TextChatTranscriptForTransferEvent, TUtils
} from 'tmac-sdk';

@Component({
    selector: 'tw-chat-controls',
    templateUrl: './tw-chat-controls.component.html',
    styleUrls: ['./tw-chat-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwChatControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {

    @Input() data: IWidget;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    fuseConfig: FuseConfig;

    interactionList: ActiveInteraction[];
    interactionId: number;

    isConnected: boolean;
    sessionID: string;
    startTime: string;
    interactionDuration: string;
    interactionStatus: string;
    chatTranscripts: any[] = [];

    user: IAgentData;
    chat: any;
    contact: any;
    replyInput: any;
    selectedChat: any;

    @ViewChildren(FusePerfectScrollbarDirective) directiveScrolls: QueryList<FusePerfectScrollbarDirective>;
    @ViewChildren('replyInput') replyInputField: any;
    @ViewChild('replyForm') replyForm: NgForm;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService,
        private _appDataService: AppDataService,
        private _dialog: MatDialog,
        private _interactionEventsService: InteractionEventsService
    ) {
        super();

        this.isConnected = false;
        this.sessionID = 'NA';
        this.startTime = 'NA';
        this.interactionDuration = 'NA';
        this.interactionStatus = 'NA';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

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
                    this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'textchat');
                    console.log('TwChatControlsComponent', this.interactionList);
                }
            );

        // set the user info 
        this.user = this._appDataService.getLoginData()?.agentData || null;

        // set the status
        this.interactionStatus = 'Incoming';
        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;
        // set the start time
        this.startTime = new Date(Date.parse(this.data.InteractionDetails.CreatedTime)).toLocaleString();
        // subscribe to the timer
        timer(1000, 1000)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(val => {
                const totalSeconds = val + 1;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor(totalSeconds % 3600 / 60);
                const seconds = Math.floor(totalSeconds % 3600 % 60);
                // set the interaction duration
                this.interactionDuration =
                    (hours > 9 ? hours : '0' + hours) + ':' +
                    (minutes > 9 ? minutes : '0' + minutes) + ':'
                    + (seconds > 9 ? seconds : '0' + seconds);
            });

        // listen to TMAC events
        this.registerToEvents();
    }

    ngAfterViewInit(): void {
        this.replyInput = this.replyInputField.first.nativeElement;
        this.readyToReply();
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private async registerToEvents(): Promise<any> {

        const events = await this._interactionEventsService.get(this.interactionId);

        console.log('TwChatControlsComponent', events);

        SDKClient.events.on('TextChatRemoteUserConnectedEvent', (evt: TextChatRemoteUserConnectedEvent) => {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // change the connected status
            this.isConnected = true;
            this.interactionStatus = 'Connected';
            // update the interaction status
            this._interactionManagerService.updateInteraction(evt.InteractionID, 'status', 'connected');
            // update the session ID
            this.sessionID = evt.TextChatSessionID + '|' + evt.InteractionID;
            // check for bot history
            try {
                const botHistory = JSON.parse(evt.ChatHistoryData);
                // check the length of history data
                if (botHistory.length > 0) {
                    botHistory.forEach((item: any) => {

                        let message = '';
                        let who = '';

                        if (item.customer_inpu) {
                            // customer message 
                            who = 'Customer'; // TODO:: change to customer name
                            message = item.reply;
                        }
                        else if (item.customer_inpu) {
                            // agent message
                            who = 'Chatbot';
                            message = item.reply;
                        }

                        // check the message and add message to the transcripts
                        if (message) {
                            this.chatTranscripts.push({
                                who,
                                messageId: TUtils.Generic.uuid(),
                                message,
                                time: item.timestamp
                            });
                        }
                    });
                }
            } catch (error) { }
        });

        SDKClient.events.on('TextChatTranscriptForTransferEvent', (evt: TextChatTranscriptForTransferEvent) => {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // TODO:: handle transfer/conference transcripts
        });

        SDKClient.events.on('TextChatMessageSentEvent', (evt: TextChatMessageSentEvent) => {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // TODO:: handle message sent
        });

        SDKClient.events.on('TextChatMessageReceivedEvent', (evt: TextChatMessageReceivedEvent) => {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // check if app message 
            if (evt.IsAppMessage) {
                // TODO:: handle app messages
                return;
            }

            // method variables
            let json = null;
            const data = {
                messageId: evt.EventId,
                type: 'text',
                message: evt.Message,
                replyId: '',
                replyJson: {}, // TODO:: to implement reply
                attachment: {},
                isValid: false
            };

            try {
                // check the message 
                if (this.isValidJson(evt.Message)) {
                    // parse the message
                    json = JSON.parse(evt.Message);
                    // check if the message is from SMM
                    if (json.hasOwnProperty('_id')) {
                        data.messageId = json._id;
                        data.type = typeof json.msg === 'object' ? json.msg.type : 'text';
                        // check if the message is an attachment
                        if (typeof json.msg === 'object') {
                            //  if attachment from SMM
                            data.attachment = {
                                src: json.msg.content.url,
                                type: json.msg.type,
                                name: ''
                            };
                            //  TODO:: when caption for image is implemented, this can be changed
                            data.message = '';
                        }
                        else {
                            // not an attachment from SMM
                            data.message = json.msg;
                            data.attachment = null;
                        }
                    } else {
                        // message from livechat
                        data.messageId = json.messageId;
                        data.type = json.type === 'attachment' ? json.attachment.type : json.type;
                        data.message = json.message;
                        data.replyId = json.replyId;
                        data.attachment = json.attachment ? json.attachment : null;
                    }
                }
            } catch (error) {
                // Logger.log('Error in TextChatRemoteUserConnectedEvent', error);
            }

            // TODO:: sanitze the message
            //        add message badge if the chat window is not active
            //        time taken timer update
            //        check for hyperlinks

            // add message to the transcripts
            this.chatTranscripts.push({
                who: 'Customer', // TODO:: change to customer name
                messageId: data.messageId,
                message: data.message,
                time: new Date(Date.parse(this.data.InteractionDetails.CreatedTime)).toLocaleString() || new Date().toLocaleString()
            });

            // focus and scroll
            this.readyToReply();

            // TODO:: show chrome notification if needed
            //        hide freeze auto response button

        });

        SDKClient.events.on('TextChatDisconnectedEvent', (evt: TextChatDisconnectedEvent) => {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // change the connected status
            this.isConnected = false;
            this.interactionStatus = 'Disconnected';
            // update the interaction status
            this._interactionManagerService.updateInteraction(evt.InteractionID, 'status', 'disconnected');
        });
    }

    private readyToReply(): void {
        setTimeout(() => {
            this.focusReplyInput();
            this.scrollToBottom();
        });
    }

    private scrollToBottom(speed?: number): void {
        speed = speed || 400;
        if (this.directiveScrolls.last) {
            this.directiveScrolls.last.update();

            setTimeout(() => {
                this.directiveScrolls.last.scrollToBottom(0, speed);
            });
        }
    }

    private focusReplyInput(): void {
        setTimeout(() => {
            this.replyInput.focus();
        });
    }

    private isValidJson(str: string): boolean {
        try {
            return typeof (JSON.parse(str)) === 'object';
        } catch (error) { }
        return false;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------    

    isFirstMessageOfGroup(message: any, i: number): boolean {
        return (i === 0 || this.chatTranscripts[i - 1] && this.chatTranscripts[i - 1].who !== message.who);
    }

    isLastMessageOfGroup(message: any, i: number): boolean {
        return (i === this.chatTranscripts.length - 1 || this.chatTranscripts[i + 1] && this.chatTranscripts[i + 1].who !== message.who);
    }

    reply(event: any): void {
        event.preventDefault();

        if (!this.replyForm.form.value.message) {
            return;
        }

        // Message
        const message = {
            who: this.user.agentName,
            message: this.replyForm.form.value.message,
            time: new Date().toLocaleString()
        };

        // Add the message to the chat
        this.chatTranscripts.push(message);

        // Reset the reply form
        this.replyForm.reset();

        // set ready to reply
        this.readyToReply();

        // Update the server
        SDKClient.sendTextChat({
            interactionId: this.interactionId.toString(),
            message: message.message,
            messageId: '',
            templateId: '',
            type: 'text'
        }, null).then((dt: any) => {
            console.log('sendTextChat', dt);
        });
    }

    selectInteraction(item: ActiveInteraction): void {
        this._interactionManagerService.updateInteraction(item.interactionId, 'isActive', true);
    }

    endChat(): void {
        // config force login
        const confirmDialogRef = this._dialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });
        confirmDialogRef.componentInstance.confirmMessage = 'Are you sure to end this chat?';
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                SDKClient.endTextChat({
                    interactionId: this.interactionId.toString(),
                    reason: 'AgentChatDisconnected'
                }, null)
                    .then((dt) => {
                        console.log('endTextChat', dt);
                    });
            }
        });

    }

    closeInteraction(): void {
        SDKClient.closeInteraction(this.interactionId.toString(), null)
            .then((dt: any) => {
                console.log('closeInteraction', dt);
            });
    }
}
