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
import { NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ChatTranscripts, InteractionRef, IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import {
    AVChannel,
    AVControlMessageReceivedEvent,
    IAgentData,
    IResponse,
    IUIEvent,
    SDKClient,
    TextChatAgentConnectedEvent,
    TextChatAgentDisconnectedEvent,
    TextChatAgentMessageReceivedEvent,
    TextChatDisconnectedEvent,
    TextChatMessageReceivedEvent,
    TextChatMessageSentEvent,
    TextChatMessageTemplateSentEvent,
    TextChatRemoteUserConnectedEvent,
    TextChatSelfServiceDestinationEvent,
    TextChatTranscriptForTransferEvent,
    TextChatTypingStateChangedEvent,
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

    fuseConfig: FuseConfig;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    maximized: boolean;
    interactionList: InteractionRef[];
    interactionId: number;
    user: IAgentData;
    replyInput: any;
    sessionID = 'NA';
    startTime: Date;
    duration: number;
    stopTimer = new Subject();
    status = 'NA';
    intent = 'NA';
    conferenceType = '';
    conferenceAgentList: {
        AgentId: string;
        AgentName: string;
        ConferenceType: string;
        TmacServer: string;
        IsBotAgent: boolean;
    }[] = [];
    chatTranscripts: ChatTranscripts[] = [];
    customerName = 'Customer';
    avConn: AVChannel;
    callWidget: IWidget;
    disableAV: boolean;
    fileUploadUrl: any;
    channel: string;
    isSMM: boolean;
    showAutoFreeze: boolean;
    supervisorInit: boolean;
    confirmDialogRef: MatDialogRef<any, any>;
    /**
     * Bot connected to chat flag
     */
    botConnected: boolean;

    @ViewChildren(FusePerfectScrollbarDirective) directiveScrolls: QueryList<FusePerfectScrollbarDirective>;
    @ViewChildren('replyInput') replyInputField: any;
    @ViewChild('replyForm') replyForm: NgForm;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService 
     * @param {InteractionManagerService} _interactionManagerService 
     * @param {TMACEventService} _tmacEventService 
     * @param {MatDialog} _dialog 
     * @param {AppDataService} _appDataService 
     * @param {FuseProgressBarService} _fuseProgressBarService 
     * @param {ContentPageService} _contentPageService 
     * @param {AOTWidgetService} _aotWidgetService 
     * @param {AppUiService} _appUIService 
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService,
        private _tmacEventService: TMACEventService,
        private _dialog: MatDialog,
        private _appDataService: AppDataService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _contentPageService: ContentPageService,
        private _aotWidgetService: AOTWidgetService,
        private _appUIService: AppUiService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
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
                (config: FuseConfig) => {
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
        this.startTime = new Date(Date.parse(this.data.InteractionDetails.CreatedTime)) || new Date();

        // listen to TMAC events
        this.registerToEvents();

        // get the file upload Url
        this.fileUploadUrl = this.appConfig.Main.Content.Urls?.FileServerUrl || null;

        // check if this chat is init by supervisor
        this.supervisorInit = this.data.InteractionDetails?.RecoveryData?.lineid === 'bargein';
    }

    /**
     * A lifecycle hook that is called after Angular has fully initialized a component's view. 
     * Define an ngAfterViewInit() method to handle any additional initialization tasks.
     */
    ngAfterViewInit(): void {
        // check if the current page is textchat page
        if (this._interactionManagerService.getInteractionCount().active <= 1 &&
            this._contentPageService.getCurrentMode() !== this.data.Data.Path) {
            setTimeout(() => {
                this._contentPageService.mode = this.data.Data.Path;
            });
        }

        // play new chat sound 
        this._appUIService.playAudio('new-chat', 0.5);

        this.replyInput = this.replyInputField.first.nativeElement;
        this.readyToReply();
    }

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.deRegisterFromEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To register to all related TMAC events
     */
    private registerToEvents(): void {
        // get the event from event bag to make sure no events are missed
        const eventBag = this._tmacEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        // register to tmac events
        SDKClient.events.on('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.on('TextChatSelfServiceDestinationEvent', this.TextChatSelfServiceDestinationEvent);
        SDKClient.events.on('TextChatAgentConnectedEvent', this.TextChatAgentConnectedEvent);
        SDKClient.events.on('TextChatTranscriptForTransferEvent', this.TextChatTranscriptForTransferEvent);
        SDKClient.events.on('TextChatMessageSentEvent', this.TextChatMessageSentEvent);
        SDKClient.events.on('TextChatMessageTemplateSentEvent', this.TextChatMessageTemplateSentEvent);
        SDKClient.events.on('TextChatUserMessageWaitTimerEvent', this.TextChatUserMessageWaitTimerEvent);
        SDKClient.events.on('TextChatTypingStateChangedEvent', this.TextChatTypingStateChangedEvent);
        SDKClient.events.on('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        SDKClient.events.on('TextChatAgentMessageReceivedEvent', this.TextChatAgentMessageReceivedEvent);
        SDKClient.events.on('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.on('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        SDKClient.events.on('TextChatAgentDisconnectedEvent', this.TextChatAgentDisconnectedEvent);
        SDKClient.events.on('CannedResposeEvent', this.CannedResposeEvent);
    }

    /**
     * To de register from all related TMAC events
     */
    private deRegisterFromEvents(): void {
        // deregister from tmac events
        SDKClient.events.off('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.off('TextChatSelfServiceDestinationEvent', this.TextChatSelfServiceDestinationEvent);
        SDKClient.events.off('TextChatAgentConnectedEvent', this.TextChatAgentConnectedEvent);
        SDKClient.events.off('TextChatTranscriptForTransferEvent', this.TextChatTranscriptForTransferEvent);
        SDKClient.events.off('TextChatMessageSentEvent', this.TextChatMessageSentEvent);
        SDKClient.events.off('TextChatMessageTemplateSentEvent', this.TextChatMessageTemplateSentEvent);
        SDKClient.events.off('TextChatUserMessageWaitTimerEvent', this.TextChatUserMessageWaitTimerEvent);
        SDKClient.events.off('TextChatTypingStateChangedEvent', this.TextChatTypingStateChangedEvent);
        SDKClient.events.off('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        SDKClient.events.off('TextChatAgentMessageReceivedEvent', this.TextChatAgentMessageReceivedEvent);
        SDKClient.events.off('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.off('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        SDKClient.events.off('TextChatAgentDisconnectedEvent', this.TextChatAgentDisconnectedEvent);
        SDKClient.events.off('CannedResposeEvent', this.CannedResposeEvent);
    }

    /**
     * To process TextChatRemoteUserConnectedEvent
     * @param evt TextChatRemoteUserConnectedEvent data
     */
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
        this.sessionID = evt.TextChatSessionID;
        // update the conference type
        this.conferenceType = evt.ConferenceType;
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
                            isAgent: who === 'Chatbot',
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
    }

    /**
     * To process TextChatSelfServiceDestinationEvent
     * @param evt TextChatSelfServiceDestinationEvent data
     */
    private TextChatSelfServiceDestinationEvent = (evt: TextChatSelfServiceDestinationEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

    }

    /**
     * To process TextChatAgentConnectedEvent
     * @param evt TextChatAgentConnectedEvent data
     */
    private TextChatAgentConnectedEvent = (evt: TextChatAgentConnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // to store connected agent's TmacServer
        let tmacServer = '';
        try {
            // get conference agent info
            const agentInfo = JSON.parse(evt.AgentInfoJson);
            // extra parameter for agent info
            const extraParam = JSON.parse(agentInfo.extraparam);
            // assign the tmac server
            tmacServer = extraParam.serverName;
            // show an alert on connect 
            if (extraParam.conferenceType === 'conf' || extraParam.conferenceType === 'whisper') {
                this._appUIService.showSnackbar(`${evt.AgentName} connected to the chat`, 'info');
            }
        } catch (error) {
        }

        // add the user to list
        this.conferenceAgentList.push({
            AgentId: evt.AgentId,
            AgentName: evt.AgentName,
            ConferenceType: evt.ConferenceType,
            IsBotAgent: evt.IsBotAgent,
            TmacServer: tmacServer
        });

        // check if a bot is connected 
        if (evt.IsBotAgent) {
            this.botConnected = true;
        }
    }

    /**
     * To process TextChatTranscriptForTransferEvent
     * @param evt TextChatTranscriptForTransferEvent data
     */
    private TextChatTranscriptForTransferEvent = (evt: TextChatTranscriptForTransferEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // loop through the data
        evt.Transcript
            .forEach((item:
                // tslint:disable-next-line: completed-docs
                { Id: string, Type: string, Message: string, AgentID: string, DateTime: string, AgentName: string }
            ) => {

                // is agent flag
                const isAgent = item.Type.toLowerCase() === 'agent';

                // check the user
                const user =
                    item.Type.toLowerCase() === 'agent' ?
                        (item.AgentName.split(' ')[0]) :
                        item.Type.toLowerCase() === 'user' ?
                            this.customerName : '';

                // format the message get the message data
                const formattedMessage =
                    this.isValidJson(item.Message) ? JSON.parse(item.Message) : null;
                const messageId = formattedMessage ?
                    formattedMessage.messageId :
                    item.Id;

                const type =
                    formattedMessage ?
                        (formattedMessage.type === 'attachment' ?
                            formattedMessage.attachment.type :
                            formattedMessage.type) :
                        '';

                const message =
                    formattedMessage ?
                        formattedMessage.message :
                        item.Message;

                const attachment =
                    (formattedMessage && formattedMessage.attachment) ?
                        formattedMessage.attachment : null;

                // TODO:: implement reply and get the replied message

                // add message to the transcripts
                if (user) {
                    this.chatTranscripts.push({
                        who: user,
                        isAgent,
                        messageId,
                        message,
                        type,
                        time: moment(item.DateTime, 'dd/MM/yyyy HH:mm:ss'),
                        attachment
                    });
                }
                else {
                    this.chatTranscripts.push({
                        divider: true
                    });
                }
            });
    }

    /**
     * To process TextChatMessageSentEvent
     * @param evt TextChatMessageSentEvent data
     */
    private TextChatMessageSentEvent = (evt: TextChatMessageSentEvent) => {
        this.messageSentEvent(evt);
    }

    /**
     * To process TextChatMessageTemplateSentEvent
     * @param evt TextChatMessageTemplateSentEvent data
     */
    private TextChatMessageTemplateSentEvent = (evt: TextChatMessageTemplateSentEvent) => {
        this.messageSentEvent(evt);
    }

    /**
     * To process TextChatUserMessageWaitTimerEvent
     * @param evt TextChatUserMessageWaitTimerEvent data
     */
    private TextChatUserMessageWaitTimerEvent = (evt: TextChatUserMessageWaitTimerEvent) => {
        // check the interaction and the interaction status
        if (evt.InteractionID !== this.interactionId || this.status !== 'connected') {
            return;
        }

        // show freeze auto response button
        this.showAutoFreeze = true;

        // get the message template to be sent to customer
        this.sendMessage({
            Text: evt.AutoResponseTemplate
        });

        // if this is the final auto response then disconnect the chat
        if (evt.IsFinal) {
            // send end chat to server 
            this.endChat('AutoResponseTimeout');
            // hide freeze auto response button
            this.showAutoFreeze = false;
        }
    }

    /**
     * To process TextChatTypingStateChangedEvent
     * @param evt TextChatTypingStateChangedEvent data
     */
    private TextChatTypingStateChangedEvent = (evt: TextChatTypingStateChangedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    /**
     * To process TextChatMessageReceivedEvent
     * @param evt TextChatMessageReceivedEvent data
     */
    private TextChatMessageReceivedEvent = (evt: TextChatMessageReceivedEvent) => {
        this.chatMessageReceived(evt);
    }

    /**
     * To process TextChatAgentMessageReceivedEvent
     * @param evt TextChatAgentMessageReceivedEvent data
     */
    private TextChatAgentMessageReceivedEvent = (evt: TextChatAgentMessageReceivedEvent) => {
        this.chatMessageReceived(evt);
    }

    /**
     * To proccess both TextChatMessageReceivedEvent and TextChatAgentMessageReceivedEvent
     * @param evt TextChatMessageReceivedEvent | TextChatAgentMessageReceivedEvent data
     */
    private chatMessageReceived = (evt: TextChatMessageReceivedEvent | TextChatAgentMessageReceivedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check the user
        const user = (evt as TextChatAgentMessageReceivedEvent).AgentName || this.customerName;

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
                        data.attachment.src = `${fileServerUrl}/${this.sessionID}/${data.attachment.name}`;
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
            who: user,
            isAgent: user !== this.customerName && this.conferenceType === 'silent',
            messageId: data.messageId,
            message: data.message,
            type: data.attachment?.type || 'text',
            time: new Date(),
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
            // play new chat sound 
            this._appUIService.playAudio('message', 0.5);
            // update the interaction other data
            this._interactionManagerService.updateInteraction(evt.InteractionID, {
                otherData: {
                    unreadCount
                }
            });
        }

        // focus and scroll
        this.readyToReply();

        // freeze auto response if needed
        this.freezeAutoResponse(false);

        // TODO:: show chrome notification if needed
        //        hide freeze auto response button

    }

    /**
     * To process AVControlMessageReceivedEvent
     * @param evt AVControlMessageReceivedEvent data
     */
    private AVControlMessageReceivedEvent = (evt: AVControlMessageReceivedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check if its a av request
        if (evt.Type === 'requestav') {
            // check the type
            const type = JSON.parse(evt.Message).param;
            // open the call widget
            this.openCallWidget(type, 'in', evt);
        }

        // forward the av messages to av channel
        this.avConn?.onMessage(evt.Message);
    }

    /**
     * To process TextChatDisconnectedEvent
     * @param evt TextChatDisconnectedEvent data
     */
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
        // hide auto response if enabled
        this.showAutoFreeze = false;
        // get the alert message by reason
        let alertMessage = '';
        // show an alert based on reason
        if (evt.ConferenceType !== 'silent') {
            switch (evt.Reason.toLowerCase()) {
                case 'remoteendclosed':
                    alertMessage = 'Interaction disconnected by customer';
                    break;
                case 'agentchatdisconnected':
                    alertMessage = 'Interaction disconnected by agent';
                    break;
                case 'agentchattransfercompleted':
                    alertMessage = 'Interaction transferred to agent successfully';
                    break;
                case 'agentinitiatedcallback':
                    alertMessage = 'Interaction disconnected by agent - Callback Initiated';
                    break;
                case 'customerinitiatedcallback':
                    alertMessage = 'Interaction disconnected by customer - Callback Initiated';
                    break;
                case 'queuetransfercompleted':
                    alertMessage = 'Interaction transferred to queue successfully';
                    break;
                case 'supervisortakeover':
                    alertMessage = 'Interaction disconnected by supervisor - Supervisor Takeover';
                    break;
            }
        }
    }

    /**
     * To process TextChatAgentDisconnectedEvent
     * @param evt TextChatAgentDisconnectedEvent data
     */
    private TextChatAgentDisconnectedEvent = (evt: TextChatAgentDisconnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // remove the agent from list 
        this.conferenceAgentList = this.conferenceAgentList.filter(c => c.AgentId !== evt.AgentId);

        // check if a bot is connected 
        if (evt.IsBotAgent) {
            this.botConnected = false;
        }

        // show an alert for non silent agent
        if (evt.ConferenceType === '' || evt.ConferenceType === 'conf' || evt.ConferenceType === 'whisper') {
            this._appUIService.showSnackbar(`${evt.AgentName} is disconnected from chat`, 'info');
        }
    }

    /**
     * To process custom CannedResposeEvent
     * @param evt CannedResposeEvent data
     */
    private CannedResposeEvent = (evt: any) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // send the selected template
        this.sendMessage(evt.Template);
    }

    /**
     * To process both TextChatMessageSentEvent and TextChatMessageTemplateSentEvent
     * @param evt TextChatMessageSentEvent | TextChatMessageTemplateSentEvent data
     */
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
                const type = formattedMessage ? (formattedMessage.type === 'attachment' ? formattedMessage.attachment.type : formattedMessage.type) : '';
                const message = formattedMessage ? formattedMessage.message : evt.Message;
                const attachment = (formattedMessage && formattedMessage.attachment) ? formattedMessage.attachment : null;

                // TODO:: implement reply and get the replied message

                // add message to the transcripts
                this.chatTranscripts.push({
                    who: this.user.agentName,
                    isAgent: true,
                    messageId,
                    message,
                    type,
                    time: evt.CreatedTime ? new Date(Date.parse(evt.CreatedTime.toString())) : new Date(),
                    attachment
                });

                // set ready to reply
                this.readyToReply();
            }
        } catch (error) { }
    }

    /**
     * Ready to reply function to focus reply textbox and to scroll to bottom
     */
    private readyToReply(): void {
        if (this.conferenceType === 'silent') {
            // ignore for silent monitoring
            return;
        }

        setTimeout(() => {
            this.focusReplyInput();
            this.scrollToBottom();
        });
    }

    /**
     * To scroll to bottom of transcript
     * @param speed Speed of scroll
     */
    private scrollToBottom(speed?: number): void {
        speed = speed || 400;
        if (this.directiveScrolls.last) {
            this.directiveScrolls.last.update();

            setTimeout(() => {
                this.directiveScrolls.last.scrollToBottom(0, speed);
            });
        }
    }

    /**
     * To focus the reply textbox
     */
    private focusReplyInput(): void {
        setTimeout(() => {
            this.replyInput.focus();
        });
    }

    /**
     * To check if the given string is a JSON
     * @param str Json string
     */
    private isValidJson(str: string): boolean {
        try {
            return typeof (JSON.parse(str)) === 'object';
        } catch (error) { }
        return false;
    }

    /**
     * To send reply to customer message
     * @param template Message template
     */
    private sendMessage(template: any): void {
        // get the typed message
        const inputMessage = template ? template.Text : this.replyForm.form.value.message;
        const messageId = `a_${TUtils.Generic.uuid()}`;
        let messageData = inputMessage;

        // Message
        const message = {
            who: this.user.agentName,
            isAgent: true,
            message: inputMessage,
            time: moment(new Date())
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
            .then(() => {
            })
            .catch(() => {
                this._appUIService.showSnackbar('Message send failed!', 'failure');
            });

        // Reset the reply form
        this.replyForm?.reset();

        // set ready to reply   
        this.readyToReply();

        // show auto freeze
        this.showAutoFreeze = true;
    }

    /**
     * To open voice or video call widget
     * @param {'audio' | 'video'} param Type of call 
     * @param {'in' | 'out'} direction Direction of the call
     * @param {AVControlMessageReceivedEvent} avEvent [OPTIONAL] For incoming requestav to process AVControlMessageReceivedEvent 
     */
    private openCallWidget(param: 'audio' | 'video', direction: 'in' | 'out', avEvent?: AVControlMessageReceivedEvent): void {
        // if the widget is created then ignore
        if (this.callWidget) {
            return;
        }

        // get the widget type
        const widgetMode = {
            title: param === 'audio' ? 'Audio Call' : 'Video Call',
            type: param === 'audio' ? 'tw-audio-controls' : 'tw-video-controls',
            icon: param === 'audio' ? 'phone' : 'duo'
        };
        // create a call AOT widget
        const widget = new TwWidgetModel(widgetMode.title, widgetMode.type, widgetMode.icon);
        widget.InteractionDetails = this.data.InteractionDetails;
        widget.Config.Anchor = true;
        widget.Config.Position.W = param === 'audio' ? 600 : 800;
        widget.Config.Position.H = param === 'audio' ? 275 : 550;
        widget.Config.Actions = param === 'audio' ? ['minimize'] : ['minimize', 'maximize'];
        // widget.Data.AVConn = this.avConn;
        widget.Data.CustomerName = this.customerName;
        widget.Data.Direction = direction;
        widget.Data.AVEvent = avEvent;
        widget.Data.Config = this.data.Data;
        widget.Data.Opener = this;

        // open call widget
        this._aotWidgetService.addWidget(widget);
        // assign to the local variable
        this.callWidget = widget;
        // disable AV buttons
        this.disableAV = true;
    }

    /**
     * To end the current chat interaction
     * @param reason Reson of chat end
     * @param btn [OPTIONAL] End button to disable/enable
     */
    private endChat(reason: string, btn?: MatButton): void {
        // show the progress bar 
        this._fuseProgressBarService.show();
        // disable the button
        if (btn) {
            btn.disabled = true;
        }
        SDKClient.endTextChat({
            interactionId: this.interactionId.toString(),
            reason
        }, null)
            .then(() => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
            })
            .catch(() => {
                // enable if something goes wrong
                if (btn) {
                    btn.disabled = false;
                }
                this._fuseProgressBarService.hide();
                this._appUIService.showSnackbar('End chat failed!', 'failure');
            });
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------    

    /**
     * On widget maximzed event
     */
    public onMaximized(isMax: boolean): void {
        this.maximizeEvent.emit(isMax);
        this.maximized = isMax;
    }

    /**
     * Check if the given message is the first message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    public isFirstMessageOfGroup(message: any, i: number): boolean {
        return (i === 0 || this.chatTranscripts[i - 1] && this.chatTranscripts[i - 1].who !== message.who);
    }

    /**
     * Check if the given message is the last message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    public isLastMessageOfGroup(message: any, i: number): boolean {
        return (i === this.chatTranscripts.length - 1 || this.chatTranscripts[i + 1] && this.chatTranscripts[i + 1].who !== message.who);
    }

    /**
     * To send a message to the remote end
     * 
     * @param event Input event
     */
    public reply(event: any): void {
        event.preventDefault();

        if (!this.replyForm.form.value.message.trim()) {
            return;
        }

        // send the typed message
        this.sendMessage(null);
    }

    /**
     * To select an interaction from interaction list
     * 
     * @param {InteractionRef} item Interaction item
     */
    public selectInteraction(item: InteractionRef): void {
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

    /**
     * To confirm end chat
     * 
     * @param {MatButton} btn End chat button reference
     */
    public confirmEndChat(btn: MatButton): void {
        // config force login
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog('endInteraction');
        this.confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                this.endChat('AgentChatDisconnected', btn);
            }
        });
    }

    /**
     * To confirm close interaction
     * 
     * @param {MatButton} btn Close interaction button reference
     */
    public closeInteraction(btn: MatButton): void {
        // confirm close interaction
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        this.confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // send end chat to server 
                // show the progress bar 
                this._fuseProgressBarService.show();
                // disable the button
                btn.disabled = true;
                SDKClient.closeInteraction(this.interactionId.toString(), null)
                    .then((dt: IResponse) => {
                        // hide the progress bar
                        this._fuseProgressBarService.hide();
                        // check the response
                        if (dt.response && dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction closed successfully');
                        }
                        else {
                            // enable if something goes wrong
                            btn.disabled = false;
                            this._appUIService.showSnackbar('Close interaction failed', 'failure');
                        }
                    })
                    .catch(() => {
                        // enable if something goes wrong
                        btn.disabled = false;
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar('Close interaction failed!', 'failure');
                    });
            }
        });
    }

    /**
     * To free auto response to the customer
     * @param force Force freeze flag
     */
    public freezeAutoResponse(force: boolean): void {
        // check if valid to freeze
        if (!this.showAutoFreeze && !force) {
            return;
        }
        // show the progress bar 
        this._fuseProgressBarService.show();
        this.showAutoFreeze = false;
        SDKClient.freezeTextChatAutoResponse(this.interactionId.toString())
            .then((dt: IResponse) => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
                // if failed
                if (!dt.response || dt.response !== 1) {
                    this.showAutoFreeze = true;
                    this._appUIService.showSnackbar('Freeze auto response failed!', 'failure');
                }
            })
            .catch(() => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
                this.showAutoFreeze = true;
                this._appUIService.showSnackbar('Error in freezing auto response failed!', 'failure');
            });
    }

    /**
     * To escalate the chat to audio/video
     * @param {'audio' | 'video'} type Type of escalation
     */
    public escalateToAV(type: 'audio' | 'video'): void {
        // freeze auto response if needed
        this.freezeAutoResponse(false);

        // open call widget
        this.openCallWidget(type, 'out');
    }

    /**
     * To preview the media sent by customer or agent
     * @param {ChatTranscripts} previewData Chat transcript data
     */
    public previewMedia(previewData: ChatTranscripts): void {
        // get the message to display
        let message = '';

        if (previewData.attachment.type === 'image') {
            message = `<img src=${previewData.attachment.src} width="100%" width="100%" />`;
        }
        else if (previewData.attachment.type === 'video') {
            message = `<video controls autoplay src=${previewData.attachment.src} width="100%" width="100%"></video>`;
        }

        this.confirmDialogRef = this._appUIService.showCustomDialog('alert', message, 'Preview');
    }

    /**
     * To dispose call widget
     */
    public dsiposeCallWidget(): void {
        // dispose the call widget
        this.callWidget = null;
        // enable AV buttons
        this.disableAV = false;
    }

    /**
     * To change conference type of chat to whisper/conference/takeover for supervisor
     */
    public changeConferenceType(btn: MatButton): void {
        // get new conference  type
        const type = this.conferenceType === 'silent' ?
            'whisper' : this.conferenceType === 'whisper' ?
                'conf' : 'takeover';
        const confirmType = type === 'conf' ? 'conference' : type;
        // get confirmation
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Mode Change', `Are you sure to change chat to ${confirmType}?`);
        this.confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                this._appUIService.showSnackbar(`Chaiging the chat mode to ${confirmType}, please wait...`, 'loading');
                // show the progress bar 
                this._fuseProgressBarService.show();
                // disable the button
                btn.disabled = true;
                // change the conference type of the chat
                SDKClient.changeTextChatConferenceType({
                    interactionId: this.interactionId.toString(),
                    type,
                    sessionId: this.sessionID,
                    conferenceAgents: _.map(this.conferenceAgentList, (item) => ({
                        AgentId: item.AgentId,
                        TmacServer: item.TmacServer
                    }))
                })
                    .then((resp) => {
                        btn.disabled = false;
                        // hide the progress bar
                        this._fuseProgressBarService.hide();
                        // get the response from server and change the local conference type
                        this.conferenceType = resp.response;
                        this._appUIService.showSnackbar(`Chat mode changed to ${resp.response} successfully`);
                    })
                    .catch(() => {
                        // enable if something goes wrong
                        btn.disabled = false;
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar(`Change chat mode to ${confirmType} failed!`, 'failure');
                    });
            }
        });
    }

    /**
     * To conference Bot with the session
     */
    public conferenceWithBot(): void {
        this._fuseProgressBarService.show();
        // freeze auto response 
        this.freezeAutoResponse(true);
        // send the request to server
        SDKClient.textChatConferenceToBot({
            destination: '',
            interactionId: this.interactionId.toString()
        })
            .then((resp) => {
                // check the response
                if (resp.response > 0) {
                    this._appUIService.showSnackbar(`Chat conferenced with bot successfully`);
                }
                else {
                    this._appUIService.showSnackbar(`Conference with bot failed!`, 'failure');
                }
                // hide the progress bar
                this._fuseProgressBarService.hide();
            })
            .catch(() => {
                this._fuseProgressBarService.hide();
                this._appUIService.showSnackbar(`Error in conferencing with bot`, 'failure');
            });
    }

    /**
     * To save interaction comments to server
     */
    public saveInteractionComments(): void {
        const dialogRef = this._appUIService.showCustomDialog('prompt', 'Enter the comments', 'Interaction Comment');
        dialogRef.afterClosed().subscribe((resp1) => {
            if (resp1) {
                this._fuseProgressBarService.show();
                SDKClient.saveInteractionComment({
                    comment: resp1,
                    interactionId: this.interactionId.toString()
                })
                    .then((resp2) => {
                        if (resp2.response > 0) {
                            this._appUIService.showSnackbar('Interaction comment saved successfully');
                        }
                        else {
                            this._appUIService.showSnackbar('Interaction comment save failed', 'failure');
                        }

                        this._fuseProgressBarService.hide();
                    })
                    .catch(() => {
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar('Error in saving interaction comment', 'failure');
                    });
            }
        });
    }
}
