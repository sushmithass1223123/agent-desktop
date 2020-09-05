import {
    AfterViewInit,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import { FormControl, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { ConfirmDialogComponent } from '@modules/shared/confirm-dialog/confirm-dialog.component';
import { AotWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionEventService } from '@services/interaction-event.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ChatTranscripts, InteractionRef, IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import {
    AVChannel,
    AVControlMessageReceivedEvent,
    AVEvent,
    IAgentData,
    IResponse,
    IUIEvent,
    SDKClient,
    TEnums,
    TextChatDisconnectedEvent,
    TextChatMessageReceivedEvent,
    TextChatMessageSentEvent,
    TextChatMessageTemplateSentEvent,
    TextChatRemoteUserConnectedEvent,
    TextChatTranscriptForTransferEvent,
    TextChatUserMessageWaitTimerEvent,
    TUtils
} from 'tmac-sdk';

@Component({
    selector: 'tw-chat-controls',
    templateUrl: './tw-chat-controls.component.html',
    styleUrls: ['./tw-chat-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwChatControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {

    @Input() data: IWidget;

    appConfig: any;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    maximized: boolean;

    fuseConfig: FuseConfig;

    interactionList: InteractionRef[];
    interactionId: number;

    user: IAgentData;
    replyInput: any;
    sessionID = 'NA';
    startTime = 'NA';
    duration: number;
    stopTimer = new Subject();
    status = 'NA';
    intent = 'NA';

    chatTranscripts: ChatTranscripts[] = [];
    customerName = 'Customer';
    avConn: AVChannel;
    callWidget: IWidget;
    disableAV: boolean;
    fileUploadUrl: any;
    channel: string;
    isSMM: boolean;

    // myControl = new FormControl();
    // options: string[] = ['One', 'Two', 'Three'];

    @ViewChildren(FusePerfectScrollbarDirective) directiveScrolls: QueryList<FusePerfectScrollbarDirective>;
    @ViewChildren('replyInput') replyInputField: any;
    @ViewChild('replyForm') replyForm: NgForm;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService,
        private _interactionEventService: InteractionEventService,
        private _dialog: MatDialog,
        private _appDataService: AppDataService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _contentPageService: ContentPageService,
        private _aotWidgetService: AotWidgetService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails?.InteractionID;


        this._appDataService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.appConfig = config;
                });

        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.fuseConfig = config;
                });

        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                // filter out the textchat interaction
                this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'textchat');
            });

        // set the user info 
        this.user = SDKClient.getAgentData() || null;

        // set the status
        this.status = 'incoming';

        // set the start time
        this.startTime = new Date(Date.parse(this.data.InteractionDetails.CreatedTime)).toLocaleString();

        // listen to TMAC events
        this.registerToEvents();

        // get the file upload Url
        this.fileUploadUrl = this.appConfig.Main.Content.Urls?.FileServerUrl || null;
    }

    ngAfterViewInit(): void {
        // check if the current page is textchat page
        if (this._interactionManagerService.getInteractionCount().active <= 1 &&
            this._contentPageService.getCurrentMode() !== this.data.Data.Path) {
            setTimeout(() => {
                this._contentPageService.mode = this.data.Data.Path;
            }, 500);
        }

        // play new chat sound 
        this._appDataService.playAudio('new-chat', 0.5);

        this.replyInput = this.replyInputField.first.nativeElement;
        this.readyToReply();
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.deRegisterFromEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private registerToEvents(): void {
        // get the event from event bag to make sure no events are missed
        const eventBag = this._interactionEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        // register to tmac events
        SDKClient.events.on('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.on('TextChatTranscriptForTransferEvent', this.TextChatTranscriptForTransferEvent);
        SDKClient.events.on('TextChatMessageSentEvent', this.TextChatMessageSentEvent);
        SDKClient.events.on('TextChatMessageTemplateSentEvent', this.TextChatMessageTemplateSentEvent);
        SDKClient.events.on('TextChatWaitTimerEvent', this.TextChatUserMessageWaitTimerEvent);
        SDKClient.events.on('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        SDKClient.events.on('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.on('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        SDKClient.events.on('CannedResposeEvent', this.CannedResposeEvent);
    }

    private deRegisterFromEvents(): void {
        // deregister from tmac events
        SDKClient.events.off('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.off('TextChatTranscriptForTransferEvent', this.TextChatTranscriptForTransferEvent);
        SDKClient.events.off('TextChatMessageSentEvent', this.TextChatMessageSentEvent);
        SDKClient.events.off('TextChatMessageTemplateSentEvent', this.TextChatMessageTemplateSentEvent);
        SDKClient.events.off('TextChatWaitTimerEvent', this.TextChatUserMessageWaitTimerEvent);
        SDKClient.events.off('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        SDKClient.events.off('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.off('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        SDKClient.events.off('CannedResposeEvent', this.CannedResposeEvent);
        this.avConn?.events.off('onAVEvent', this.onAVEvent);
    }

    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // replace InteractionDetails with this event
        // this event has the interaction details properties
        this.data.InteractionDetails = evt;

        // subscribe to the timer
        timer(1000, 1000)
            .pipe(takeUntil(this.unsubscribeAll), takeUntil(this.stopTimer))
            .subscribe(val => {
                this.duration = (val + 1) * 1000;
            });

        this.status = 'connected';
        // get the customer name
        this.customerName = evt.ScreenName || 'Customer';
        // assign the intent
        this.intent = evt.TransferIntent || evt.Intent || 'Default';
        // check the channel
        this.channel = evt.Channel.toLowerCase() || 'textchat';
        // check social media
        this.isSMM = evt.IsSMM || false;
        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            'status': 'connected',
            'user': this.customerName
        });
        // update the session ID
        this.sessionID = evt.TextChatSessionID + '|' + evt.InteractionID;
        // check for bot history
        try {
            const botHistory = JSON.parse(evt.ChatHistoryData);

            // check the length of history data
            if (botHistory.length > 0) {
                botHistory.forEach((item: any, index: number, array: any[]) => {

                    let message = '';
                    let who = '';

                    if (item.customer_input) {
                        // customer message 
                        who = this.customerName;
                        message = item.customer_input;
                    }
                    else if (item.reply) {
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

                    // check if the last item then add divider
                    if ((array.length - 1) === index) {
                        this.chatTranscripts.push({
                            divider: true
                        });
                    }
                });
            }
        } catch (error) { }

        // send greeting text
        if (this.user.chatGreetingText) {
            this.sendMessage({
                Text: this.user.chatGreetingText
            });
        }
    }

    private TextChatTranscriptForTransferEvent = (evt: TextChatTranscriptForTransferEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // TODO:: handle transfer/conference transcripts
    }

    private TextChatMessageSentEvent = (evt: TextChatMessageSentEvent) => {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }
            // check if recovery or template sent then show it
            if (evt.RecoveryEvent && !evt.IsAppMessage || evt.EventName === 'TextChatMessageTemplateSentEvent') {
                const formattedMessage = this.isValidJson(evt.Message) ? JSON.parse(evt.Message) : null;
                const messageId = formattedMessage ? formattedMessage.messageId : evt.EventId;
                // const type = formattedMessage ? formattedMessage.type : '';
                const message = formattedMessage ? formattedMessage.message : evt.Message;
                // const isReply = formattedMessage && formattedMessage.replyId ? formattedMessage.replyId : false;
                // const replyJson = {};

                // TODO:: implement reply and get the replied message

                // add message to the transcripts
                this.chatTranscripts.push({
                    who: this.user.agentName,
                    messageId,
                    message,
                    time: new Date(Date.parse(evt.CreatedTime.toString())).toLocaleString() || new Date().toLocaleString()
                });

                // set ready to reply
                this.readyToReply();
            }
        } catch (error) { }
    }

    private TextChatMessageTemplateSentEvent = (evt: TextChatMessageTemplateSentEvent) => {
        this.messageSentEvent(evt);
    }

    private TextChatUserMessageWaitTimerEvent = (evt: TextChatUserMessageWaitTimerEvent) => {
        // check the interaction and the interaction status
        if (evt.InteractionID !== this.interactionId || this.status !== 'connected') {
            return;
        }

        // get the message template to be sent to customer
        this.sendMessage({
            Text: evt.AutoResponseTemplate
        });

        // if this is the final auto response then disconnect the chat
        if (evt.IsFinal) {
            this.endChat(null);
        }
    }

    private TextChatMessageReceivedEvent = (evt: TextChatMessageReceivedEvent) => {
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
            replyJson: null, // TODO:: to implement reply
            attachment: null,
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

                    // get the file upload url
                    const fileServerUrl: string = this.fileUploadUrl?.MediaProxy;
                    // check if we need to get full path of attachment
                    if (data.attachment && // check if attachment is there
                        !data.attachment.src && // check if src is not found
                        data.attachment.name && // check if name is provided
                        fileServerUrl // check if file server URL is configured
                    ) {
                        // get the attachment src
                        data.attachment.src = `${fileServerUrl}/${this.sessionID.split('|')[0]}/${data.attachment.name}`;
                    }
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
            who: this.customerName,
            messageId: data.messageId,
            message: data.message,
            type: data.attachment?.type || 'text',
            time: new Date(Date.parse(this.data.InteractionDetails.CreatedTime)).toLocaleString() || new Date().toLocaleString(),
            attachment: data.attachment
        });

        let isActive = false;
        // check if the interaction is active, else count unread
        this.interactionList.forEach((item: InteractionRef) => {
            isActive = (item.interactionId === this.interactionId && item.isActive);
        });

        // in not active then increment the count
        if (!isActive || this._contentPageService.getCurrentMode() !== this.data.Data.Path) {
            const currentInteraction = this.interactionList.filter(i => i.interactionId === this.interactionId)[0];
            const unreadCount = ++currentInteraction.otherData.unreadCount;
            // update the interaction other data
            this._interactionManagerService.updateInteraction(evt.InteractionID, {
                otherData: {
                    unreadCount
                }
            });
        }

        // focus and scroll
        this.readyToReply();

        // TODO:: show chrome notification if needed
        //        hide freeze auto response button

    }

    private AVControlMessageReceivedEvent = (evt: AVControlMessageReceivedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check if its a av request
        if (evt.Type === 'requestav') {
            this.createAVConnection(JSON.parse(evt.Message).type);
        }

        // forward the av messages to av channel
        this.avConn?.onMessage(evt.Message);
    }

    private TextChatDisconnectedEvent = (evt: TextChatDisconnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
        this.status = 'disconnected';
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'disconnected'
        });
        // stop the duration timer
        this.stopTimer.next();
        // close if there is any any AV
        this.avConn?.close();
    }

    private CannedResposeEvent = (evt: any) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // send the selected template
        this.sendMessage(evt.Template);
    }

    private messageSentEvent(evt: TextChatMessageSentEvent | TextChatMessageTemplateSentEvent): void {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }
            // check if recovery or template sent then show it
            if (evt.RecoveryEvent && !evt.IsAppMessage || evt.EventName === 'TextChatMessageTemplateSentEvent') {
                const formattedMessage = this.isValidJson(evt.Message) ? JSON.parse(evt.Message) : null;
                const messageId = formattedMessage ? formattedMessage.messageId : evt.EventId;
                // const type = formattedMessage ? formattedMessage.type : '';
                const message = formattedMessage ? formattedMessage.message : evt.Message;
                // const isReply = formattedMessage && formattedMessage.replyId ? formattedMessage.replyId : false;
                // const replyJson = {};

                // TODO:: implement reply and get the replied message

                // add message to the transcripts
                this.chatTranscripts.push({
                    who: this.user.agentName,
                    messageId,
                    message,
                    time: new Date(Date.parse(evt.CreatedTime.toString())).toLocaleString() || new Date().toLocaleString()
                });

                // set ready to reply
                this.readyToReply();
            }
        } catch (error) { }
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

    private sendMessage(template: any): void {
        // get the typed message
        const inputMessage = template ? template.Text : this.replyForm.form.value.message;
        const messageId = `a_${TUtils.Generic.uuid()}`;
        let messageData = inputMessage;

        // Message
        const message = {
            who: this.user.agentName,
            message: inputMessage,
            time: new Date().toLocaleString()
        };

        // check if reply feature is enabled or not social media
        if (this.data.Data.ReplyOnChatAllowed && !this.isSMM) {
            const jsonMessage = {
                messageId: messageId,
                type: 'text',
                message: inputMessage,
                replyId: '',
                templateId: template?.ID || '',
                attachment: null
            };

            // TODO:: check for reply messages

            // stringy the json
            messageData = JSON.stringify(jsonMessage);
        }

        // Add the message to the chat
        this.chatTranscripts.push(message);

        // Update the server
        SDKClient.sendTextChat({
            interactionId: this.interactionId.toString(),
            message: messageData,
            messageId,
            templateId: template?.ID || '',
            type: 'text'
        }, null)
            .then((dt: any) => {
                console.log('sendTextChat', dt);
            })
            .catch(() => {
                this._appDataService.showMessage('Message send failed!');
            });

        // Reset the reply form
        this.replyForm.reset();

        // set ready to reply
        this.readyToReply();
    }

    private createAVConnection(param: string): AVChannel {
        // if screenshare, then ignore and send to av channel
        if (param === 'screenshare') {
            return;
        }

        // create a AV channel connection
        const connection = new AVChannel(
            SDKClient,
            this.interactionId.toString(),
            this.user.agentId,
            this.user.agentName,
            this.sessionID.split('|')[0],
            'chat',
            this.appConfig.AppConfigs.AV || {}
        );

        // check if the connection is created
        if (!connection) {
            return null;
        }

        // listen to AV events
        connection.events.on('onAVEvent', this.onAVEvent);

        // assign the av connection
        this.avConn = connection;

        // return the connection
        return connection;
    }

    private onAVEvent = (evt: AVEvent) => {
        // swtich the av events
        switch (evt.event) {
            case 'onIncoming':
                // disable av buttons
                this.disableAV = true;
                // request param
                const param = evt.data.param.charAt(0).toUpperCase() + evt.data.param.slice(1);
                // config incoming call
                const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
                    disableClose: false
                });
                confirmDialogRef.componentInstance.message = param + ' call requested by customer, Do you want to accept it?';
                confirmDialogRef.afterClosed().subscribe((dialogResult) => {
                    if (dialogResult) {
                        // accept request
                        evt.data.response(true);
                    }
                    else {
                        // enable av buttons
                        this.disableAV = false;
                        // reject request
                        evt.data.response(false);
                        // close the call widget
                        this._aotWidgetService.destroyWidget(this.callWidget.ID);
                        this.callWidget = null;
                    }
                });
                // check if any widget has opened
                if (!this.callWidget) {
                    // open the widget
                    this.openCallWidget(evt.data.param);
                }
                break;
            case 'onConnected':
                this.disableAV = true;
                break;
            case 'onFail':
            case 'onDisconnected':
            case 'onEnd':
                this.disableAV = false;
                break;
            default:
                console.log(evt);

        }
    }

    private openCallWidget(param: string): void {
        // get the widget type
        const widgetMode = {
            title: param === 'audio' ? 'Audio Call' : 'Video Call',
            type: param === 'audio' ? 'tw-audio-controls' : 'tw-video-controls',
            icon: param === 'audio' ? 'duo' : 'phone'
        };
        // create a call AOT widget
        const widget = new TwWidgetModel(widgetMode.title, widgetMode.type, widgetMode.icon);
        widget.InteractionDetails = this.data.InteractionDetails;
        widget.Config.AOT = true;
        widget.Config.Anchor = true;
        widget.Config.Position.W = param === 'audio' ? 600 : 800;
        widget.Config.Position.H = param === 'audio' ? 275 : 550;
        widget.Config.Actions = param === 'audio' ? ['minimize'] : ['minimize', 'maximize'];
        widget.Data.AVConn = this.avConn;
        widget.Data.CustomerName = this.customerName;
        widget.Data.SelfUser = this.user;
        widget.Data.Config = this.data.Data;

        // open call widget
        this._aotWidgetService.addWidget(widget);
        // assign to the local variable
        this.callWidget = widget;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------    

    onMaximized(event: boolean): void {
        this.maximizeEvent.emit(event);
        this.maximized = event;
    }

    isFirstMessageOfGroup(message: any, i: number): boolean {
        return (i === 0 || this.chatTranscripts[i - 1] && this.chatTranscripts[i - 1].who !== message.who);
    }

    isLastMessageOfGroup(message: any, i: number): boolean {
        return (i === this.chatTranscripts.length - 1 || this.chatTranscripts[i + 1] && this.chatTranscripts[i + 1].who !== message.who);
    }

    reply(event: any): void {
        event.preventDefault();

        if (!this.replyForm.form.value.message.trim()) {
            return;
        }

        // send the typed message
        this.sendMessage(null);
    }

    selectInteraction(item: InteractionRef): void {
        // if same interaction is seleted then return
        if (this.interactionId === item.interactionId) {
            return;
        }
        // update is active
        this._interactionManagerService.updateInteraction(item.interactionId, {
            isActive: true,
            otherData: {
                unreadCount: 0
            }
        });
    }

    endChat(endBtn: MatButton): void {
        // config force login
        const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
            disableClose: false
        });
        confirmDialogRef.componentInstance.message = 'Are you sure to end this chat?';
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // disable the button
                if (endBtn) {
                    endBtn.disabled = true;
                }
                // show the progress bar 
                this._fuseProgressBarService.show();
                SDKClient.endTextChat({
                    interactionId: this.interactionId.toString(),
                    reason: 'AgentChatDisconnected'
                }, null)
                    .then(() => {
                        // hide the progress bar
                        this._fuseProgressBarService.hide();
                    });
            }
        });
    }

    closeInteraction(closeBtn: MatButton): void {
        // show the progress bar 
        this._fuseProgressBarService.show();
        // disable the button
        closeBtn.disabled = true;
        SDKClient.closeInteraction(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
                // check the response
                if (dt.response && dt.response.ResultCode === 0) {
                    this._appDataService.showMessage('Interaction closed sucessfully');
                }
                else {
                    // enable if something goes wrong
                    closeBtn.disabled = false;
                    this._appDataService.showMessage('Close interaction failed');
                }
                console.log('closeInteraction', dt);
            });
    }

    escalateToAV(type: string): void {
        // disable AV buttons
        this.disableAV = true;

        // create the av connection
        const connection = this.createAVConnection(type);

        // start call
        connection.startCall(type === 'video' ? TEnums.WrcCallTypes.Video : TEnums.WrcCallTypes.Audio, null)
            .then((dt: any) => {
                // check the response is sucess or timed out
                if (dt.code === TEnums.WrcCodes.RequestTimeout) {
                    this._appDataService.showMessage(`Escalate to ${dt.param} request timed out`);
                    // close the call widget
                    this._aotWidgetService.destroyWidget(this.callWidget.ID);
                    this.callWidget = null;
                    // enable AV buttons 
                    this.disableAV = false;
                }
                else {
                    this.openCallWidget(dt.param);
                }
            })
            .catch((error) => {
                // enable AV buttons 
                this.disableAV = false;
                this._appDataService.showMessage('Error in starting the call: ' + error);
            });
    }

    previewMedia(previewData: ChatTranscripts): void {
        const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
            disableClose: false
        });

        if (previewData.attachment.type === 'image') {
            confirmDialogRef.componentInstance.message = `<img src=${previewData.attachment.src} width="100%" width="100%" />`;
        }
        else if (previewData.attachment.type === 'video') {
            confirmDialogRef.componentInstance.message = `<video controls autoplay src=${previewData.attachment.src} width="100%" width="100%"></video>`;
        }

        confirmDialogRef.componentInstance.title = 'Preview';
        confirmDialogRef.componentInstance.isAlert = true;
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
            }
        });
    }
}
