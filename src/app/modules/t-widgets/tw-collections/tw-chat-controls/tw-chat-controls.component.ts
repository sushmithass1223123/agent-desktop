import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AgentSkillListComponent } from '@modules/shared/components';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    ActionMessageReceivedEvent,
    AVChannel,
    AVControlMessageReceivedEvent,
    CallHoldEvent,
    CallHoldReconnectEvent,
    CCLDataEvent,
    HoldTimerEvent,
    IAgentData,
    InteractionDataEvent,
    IResponse,
    SDKClient,
    SSDestination,
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
    TextChatTransferFailedEvent,
    TextChatTransferRejectEvent,
    TextChatTransferSuccessEvent,
    TextChatTypingStateChangedEvent,
    TextChatUserMessageWaitTimerEvent,
    TextTemplate,
    TUtils
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { INVALID_CHARS } from 'app/constants';
import { AgentSkillListData, ChatTranscripts, CustomSDKEvent, InteractionComment, InteractionRef, IWidget, SnackbarStateTypes } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { urlify } from 'app/utils';
import { map } from 'lodash';
import * as moment from 'moment';
import { from, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { catchError, delay, filter } from 'rxjs/operators';

const holdState = { onHold: true, buttonTooltip: 'Unhold', icon: 'play_arrow', loading: false };
const unHoldState = { onHold: false, buttonTooltip: 'Hold', icon: 'pause', loading: false };

/**
 * Chat control component
 */
@Component({
    selector: 'tw-chat-controls',
    templateUrl: './tw-chat-controls.component.html',
    styleUrls: ['./tw-chat-controls.component.scss'],
    animations: appAnimations,
    encapsulation: ViewEncapsulation.None
})
export class TwChatControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * To hold all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Media Channels
     */
    mediaChannels = ['video', 'audio'];
    /**
     * App config
     */
    appConfig: any;
    /**
     * Fuse config
     */
    // fuseConfig: FuseConfig;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$,
        config$: this._fuseFacadeService.getConfig({ colorTheme: 'colorTheme' })
    };
    /**
     * To emit maximize event on widget maximize
     */
    @Output() maximizeEvent = new EventEmitter();
    /**
     * To emit float event on widget maximize
     */
    @Output() floatEvent = new EventEmitter();
    /**
     * To emit collapse event on widget maximize
     */
    @Output() collapseEvent = new EventEmitter();
    /**
     * Widget maximized flag
     */
    maximized: boolean;
    /**
     * Total interaction list
     */
    interactionList: InteractionRef[];
    /**
     * Current interaction ID
     */
    interactionId: number;
    /**
     * Agent ref
     */
    user: IAgentData;
    /**
     * Reply input ref
     */
    replyInput: any;
    /**
     * Current interaction session ID
     */
    sessionID = 'NA';
    /**
     * Interaction start time
     */
    startTime: Date;
    /**
     * Interaction duration
     */
    duration: number;
    /**
     * Duration stop timer subject
     */
    stopTimer = new Subject();
    /**
     * Interaction status
     */
    status = 'NA';
    /**
     * Interaction intent
     */
    intent = 'NA';
    /**
     * Conference type of interaction
     */
    conferenceType = '';
    /**
     * Conference agent list
     */
    conferenceAgentList: {
        /**
         * Agent ID of agent connected
         */
        AgentId: string;
        /**
         * Agent name of agent connected
         */
        AgentName: string;
        /**
         * Conference type of agent connected
         */
        ConferenceType: string;
        /**
         * Tmac Server ID of agent connected
         */
        TmacServer: string;
        /**
         * Connected agent is bot flag
         */
        IsBotAgent: boolean;
    }[] = [];
    /**
     * To hold interaction chat transcripts
     */
    chatTranscripts: ChatTranscripts[] = [];
    /**
     * Customer name ref
     */
    customerName = 'Customer';
    /**
     * AV channel ref
     */
    avConn: AVChannel;
    /**
     * AV call widget ref
     */
    callWidget: IWidget;
    /**
     * Flag to disable AV escalate buttons
     */
    disableAV: boolean;
    /**
     * File upload URL
     */
    fileUploadUrl: any;
    /**
     * Interaction channel
     */
    channel: string;
    /**
     * Social media manager flag
     */
    isSMM: boolean;
    /**
     * Flag to show auto freeze button
     */
    showAutoFreeze: boolean;
    /**
     * Interaction bargeIn by supervisor flag
     */
    supervisorInit: boolean;
    /**
     * Confirmation mat dialog ref
     */
    confirmDialogRef: MatDialogRef<any, any>;
    /**
     * Bot connected to chat flag
     */
    botConnected: boolean;
    /**
     * Chatmode
     */
    chatMode: string;
    /**
     * Line ID
     */
    lineId: string;
    /**
     * Transfer/Conference widgetf
     */
    tranfConfWidget: IWidget;
    /**
     * Flag to show emoji overlay
     */
    showEmojiOverlay = false;
    /**
     * Flag to show attach overlay
     */
    showAttachOverlay = false;
    /**
     * Attachment actions
     */
    attachActions: {
        /**
         * Action
         */
        action: string;
        /**
         * Label
         */
        label: string;
        /**
         * Icon
         */
        icon: string;
    }[] = [
            {
                action: 'documents',
                icon: 'insert_drive_file',
                label: 'Documents'
            },
            {
                action: 'camera',
                icon: 'camera_alt',
                label: 'Camera'
            },
            {
                action: 'media',
                icon: 'photo',
                label: 'Photos & Videos'
            }
        ];
    /**
     * Type of attachment previw
     */
    attachPreviewMode = '';
    /**
     * Self media stream
     */
    selfVideo: MediaStream;
    /**
     * Transfer/conference dialog ref
     */
    transferConfDialogRef: MatDialogRef<any, any>;
    /**
     * Self service destinations
     */
    selfServiceDestinations: SSDestination[] = [];
    /**
     * Messages div ref
     */
    @ViewChild('messages')
    messagesRef: ElementRef<HTMLDivElement>;
    /**
     * Reply input children ref
     */
    @ViewChild('replyInput') replyInputField: ElementRef<HTMLTextAreaElement>;
    /**
     * Reply form ref
     */
    @ViewChild('replyForm') replyForm: NgForm;
    /**
     * Saved interaction comments
     */
    savedComments: InteractionComment[] = [];
    /**
     * Flag to allow screen share without prompting user for permission
     */
    allowCustomerScreenShare = true;
    /**
     * common button background
     */
    // commonButtonBackground = '';
    /**
     * Conversation Api Urls
     */
    conversationService: {
        /**
         * Api url
         */
        Url: string;
        /**
         * Limit to fetch
         */
        Limit: number;
    };
    /**
     * Text templates ref
     */
    textTemplates: {
        /**
         * Full data
         */
        data: TextTemplate[];
        /**
         * Filtered data
         */
        filtered: TextTemplate[];
    };
    /**
     * User typing flag
     */
    userTyping: boolean;
    /**
     * Typing timer
     */
    typingTimer: any;

    /**
     * Message id of the message the user is responding to
     */
    replyingToMessage: ChatTranscripts | null;
    /**
     * To open more actions
     */
    openMoreActions: boolean;

    /**
     * More action buttons
     */
    moreActions = [];

    /**
     * Flag to check if the interaction is on hold
     */
    interactionOnHold: typeof unHoldState | typeof holdState = unHoldState;

    /**
     * Constructor
     * @param {InteractionManagerService} _interactionManagerService
     * @param {TMACEventService} _tmacEventService
     * @param {MatDialog} _matDialog
     * @param {AppDataService} _appDataService
     * @param {FuseProgressBarService} _fuseProgressBarService
     * @param {ContentPageService} _contentPageService
     * @param {AOTWidgetService} _aotWidgetService
     * @param {AppUiService} _appUIService,
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService,
        private _tmacEventService: TMACEventService,
        private _matDialog: MatDialog,
        private _appDataService: AppDataService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _contentPageService: ContentPageService,
        private _aotWidgetService: AOTWidgetService,
        private _appUIService: AppUiService,
        private _fuseFacadeService: FuseFacadeService
    ) {
        super();

        // set defaults
        this.textTemplates = {
            data: [],
            filtered: []
        };
        this.conversationService = {
            Url: '',
            Limit: 0
        };
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

        // listen to TMAC events
        this._tmacEventService
            .getInteractionEvents(
                [
                    'TextChatRemoteUserConnectedEvent',
                    'TextChatSelfServiceDestinationEvent',
                    'TextChatAgentConnectedEvent',
                    'TextChatTranscriptForTransferEvent',
                    'TextChatMessageSentEvent',
                    'TextChatMessageTemplateSentEvent',
                    'TextChatUserMessageWaitTimerEvent',
                    'TextChatTypingStateChangedEvent',
                    'TextChatMessageReceivedEvent',
                    'TextChatAgentMessageReceivedEvent',
                    'AVControlMessageReceivedEvent',
                    'TextChatDisconnectedEvent',
                    'TextChatAgentDisconnectedEvent',
                    'CannedResposeEvent',
                    'TextChatTransferSuccessEvent',
                    'TextChatTransferFailedEvent',
                    'TextChatTransferRejectEvent',
                    'ActionMessageReceivedEvent',
                    'InteractionDataEvent',
                    'CallHoldEvent',
                    'CallHoldReconnectEvent',
                    'HoldTimerEvent',
                    'CCLDataEvent'
                ],
                this.interactionId
            )
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: FuseConfig) => {
        //     this.fuseConfig = config;
        //     this.commonButtonBackground =
        //         config.layout.anchorWidget.customBackgroundColor === true && this.data.Config.Anchor ? config.layout.anchorWidget.bodyBackground : '';
        // });

        this._contentPageService.mode
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((viewMode: string) => {
                // check if textchat view and selected interaction is this
                if (viewMode === this.data.Data.Path) {
                    const interaction = this.interactionList?.filter(i => i.isActive && i.otherData.unreadCount > 0)?.[0];
                    // check the interaction 
                    if (interaction) {
                        // update is unread count
                        this._interactionManagerService.updateInteraction(interaction.interactionId, {
                            otherData: {
                                unreadCount: 0
                            }
                        });
                    }
                }
            });

        this._interactionManagerService
            .interactions
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

        // get the file upload Url
        this.fileUploadUrl = this.appConfig.Main.Urls?.FileServerUrl || null;

        // update the line Id
        this.lineId = this.data.InteractionDetails?.RecoveryData?.lineid || '';

        // check if this chat is init by supervisor
        this.supervisorInit = this.lineId === 'bargein';

        // check if conversation api Url is configured
        if (this.data.Data.ConversationService && this.data.Data.ConversationService.Url) {
            // set the conversation service urls
            this.conversationService.Url = this.data.Data.ConversationService.Url.endsWith('/')
                ? this.data.Data.ConversationService.Url
                : this.data.Data.ConversationService.Url + '/';
            // set the conversation limit
            this.conversationService.Limit = this.data.Data.ConversationService.Limit;
        }

        if (this.data.Data.ChatTemplate.Allowed) {
            // get text templates
            this.getTextTemplates();
        }

        // check for moreActions
        if (this.data.Data?.Whiteboard?.Allowed) {
            this.moreActions.push({
                label: 'Open Whiteboard',
                icon: 'create',
                type: 'whiteboard'
            });
        }

        if (this.data.Data?.SignatureAllowed) {
            this.moreActions.push({
                label: 'Signature Request',
                icon: 'gesture',
                type: 'signatureRequest'
            });
        }
    }

    /**
     * A lifecycle hook that is called after Angular has fully initialized a component's view.
     * Define an ngAfterViewInit() method to handle any additional initialization tasks.
     */
    ngAfterViewInit(): void {
        // check if the current page is textchat page
        if (this._interactionManagerService.getInteractionCount().active <= 1 && this._contentPageService.getCurrentMode() !== this.data.Data.Path) {
            setTimeout(() => {
                this._contentPageService.mode = this.data.Data.Path;
            });
        }

        // play new chat sound
        this._appUIService.playAudio('new-chat', 0.5, false);
        this._appUIService.showDesktopAlert('Incoming Chat', 'You have a new incoming chat', false);

        this.replyInput = this.replyInputField.nativeElement;
        this.readyToReply();
    }

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // this.deRegisterFromEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To process TextChatRemoteUserConnectedEvent
     * @param evt TextChatRemoteUserConnectedEvent evt
     */
    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

        // replace InteractionDetails with this event
        // this event has the interaction details properties
        this.data.InteractionDetails = evt;

        // subscribe to the timer
        timer(1000, 1000)
            .pipe(takeUntil(this.unsubscribeAll), takeUntil(this.stopTimer))
            .subscribe((val) => {
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
            status: 'connected',
            user: this.customerName,
            otherData: {
                icon: this.isSMM ? 'custom-' + this.channel : 'chat'
            }
        });
        // update the session ID
        this.sessionID = evt.TextChatSessionID;
        // update the conference type
        this.conferenceType = evt.ConferenceType;
        // update the chatmode
        this.chatMode = evt.ChatMode;
        // to not open video dialog when interaction is over
        if (!evt.RecoveryEvent && this.mediaChannels.includes(this.chatMode)) {
            this.escalateToAV(this.chatMode as any);
        }
        // check for bot history
        this.processBotHistory(evt.ChatHistoryData);
        // check if conversation history is configured
        if (this.conversationService.Url && evt.CIF) {
            // check for conversation history
            this.checkForConversationHistory(evt.CIF);
        }
    }

    /**
     * To process TextChatSelfServiceDestinationEvent
     * @param evt TextChatSelfServiceDestinationEvent evt
     */
    private TextChatSelfServiceDestinationEvent = (evt: TextChatSelfServiceDestinationEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

        this.selfServiceDestinations = evt.Destinations || [];
    }

    /**
     * To process TextChatAgentConnectedEvent
     * @param evt TextChatAgentConnectedEvent evt
     */
    private TextChatAgentConnectedEvent = (evt: TextChatAgentConnectedEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

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
        } catch (error) { }

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
     * @param evt TextChatTranscriptForTransferEvent evt
     */
    private TextChatTranscriptForTransferEvent = (evt: TextChatTranscriptForTransferEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }
        // SDKClient.getInteractionData({
        //     count: 10,
        //     fromDate: '',
        //     interactionId: record.ID,
        //     sessionId: record.SessionID,
        //     toDate: '',
        //     agentId: record.AgentID
        // })
        // loop through the data
        evt.Transcript.forEach(
            (item: {
                /**
                 * ID of message
                 */
                Id: string;
                /**
                 * Type of message
                 */
                Type: string;
                /**
                 * Message
                 */
                Message: string;
                /**
                 * Transferred agent's ID
                 */
                AgentID: string;
                /**
                 * Datetime of message
                 */
                DateTime: string;
                /**
                 * Transferred agent's name
                 */
                AgentName: string;
            }) => {
                // is agent flag
                const isAgent = item.Type.toLowerCase() === 'agent';

                // check the user
                const user =
                    item.Type.toLowerCase() === 'agent' ? item.AgentName.split(' ')[0] : item.Type.toLowerCase() === 'user' ? this.customerName : '';

                // format the message get the message data
                const formattedMessage = this.isValidJson(item.Message) ? JSON.parse(item.Message) : null;
                const messageId = formattedMessage ? formattedMessage.messageId : item.Id;

                const type = formattedMessage
                    ? formattedMessage.type === 'attachment'
                        ? formattedMessage.attachment.type
                        : formattedMessage.type
                    : '';

                const message = formattedMessage ? formattedMessage.message : item.Message;

                const attachment = formattedMessage && formattedMessage.attachment ? formattedMessage.attachment : null;

                // TODO:: implement reply and get the replied message

                // add message to the transcripts
                if (user) {
                    this.pushToTranscript({
                        who: user,
                        isAgent,
                        position: isAgent ? 'right' : 'left',
                        messageId,
                        message,
                        type,
                        time: moment(item.DateTime, 'dd/MM/yyyy HH:mm:ss'),
                        attachment
                    });
                } else {
                    this.pushToTranscript({
                        divider: true
                    });
                }
            }
        );
    }

    /**
     * To process TextChatMessageSentEvent
     * @param evt TextChatMessageSentEvent evt
     */
    private TextChatMessageSentEvent = (evt: TextChatMessageSentEvent) => {
        this.messageSentEvent(evt);
    }

    /**
     * To process TextChatMessageTemplateSentEvent
     *
     * @param evt TextChatMessageTemplateSentEvent evt
     */
    private TextChatMessageTemplateSentEvent = (evt: TextChatMessageTemplateSentEvent) => {
        this.messageSentEvent(evt);
    }

    /**
     * To process TextChatUserMessageWaitTimerEvent
     *
     * @param evt TextChatUserMessageWaitTimerEvent evt
     */
    private TextChatUserMessageWaitTimerEvent = (evt: TextChatUserMessageWaitTimerEvent) => {
        // check the interaction and the interaction status
        // if (evt.InteractionID !== this.interactionId || this.status !== 'connected') {
        //     return;
        // }

        if (this.status !== 'connected') {
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
     *
     * @param evt TextChatTypingStateChangedEvent evt
     */
    private TextChatTypingStateChangedEvent = (evt: TextChatTypingStateChangedEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }
    }

    /**
     * To process TextChatMessageReceivedEvent
     * @param evt TextChatMessageReceivedEvent evt
     */
    private TextChatMessageReceivedEvent = (evt: TextChatMessageReceivedEvent) => {
        this.chatMessageReceived(evt);
    }

    /**
     * To process TextChatAgentMessageReceivedEvent
     * @param evt TextChatAgentMessageReceivedEvent evt
     */
    private TextChatAgentMessageReceivedEvent = (evt: TextChatAgentMessageReceivedEvent) => {
        this.chatMessageReceived(evt);
    }

    /**
     * To handles ActionMessageReceivedEvent
     * @param evt ActionMessageReceivedEvent evt
     */
    private ActionMessageReceivedEvent = (evt: ActionMessageReceivedEvent) => {
        try {
            // handle snapshot ackknowledgement
            const msg = JSON.parse(evt.Message);
            let message = '';
            let status: SnackbarStateTypes = 'success';
            switch (msg.type.toLowerCase()) {
                case 'webrtctroubleshoot':
                    if (msg.status === 'accepted') {
                        message = 'Webrtc troubleshoot request accepted by customer';
                    } else if (msg.status === 'ack') {
                        message = 'Webrtc troubleshoot request received by customer';
                        status = 'loading';
                    } else {
                        message = 'Webrtc troubleshoot request rejected by customer';
                        status = 'failure';
                    }
                    if (message) {
                        this._appUIService.showSnackbar(message, status);
                    }
                    break;
                case 'snapshot':
                    if (msg.status === 'snapshotRequestAck') {
                        message = 'Retreiving snapshot';
                        status = 'loading';
                    } else if (msg.status === 'response') {
                        message = 'Snapshot Received';
                        status = 'success';
                    } else {
                        message = 'Unable to take snapshot';
                        status = 'failure';
                    }
                    if (message) {
                        const snapshotMatRef = this._appUIService.showSnackbar(message, status);
                        if (status === 'loading') {
                            from([0])
                                .pipe(takeUntil(this.unsubscribeAll), delay(this.data.Data.Snapshot.RemoteResponseTimeout * 1000 || 10000))
                                .subscribe(() => {
                                    snapshotMatRef.dismiss();
                                    console.error('Snapshot Response timed out');
                                });
                        }
                    }
                    break;
                case 'openwhiteboard':
                    if (msg.status === 'ack') {
                        this._appUIService.showSnackbar('Whiteboard request received by customer', 'info');
                    } else if (msg.status === 'accepted') {
                        this._appUIService.showSnackbar('Whiteboard request accepted by customer', 'success');
                    } else {
                        this._appUIService.showSnackbar('Whiteboard request rejected by customer', 'failure');
                    }
                    break;
                default:
                    console.log('Unknown App Message');
            }
        } catch (e) {
            console.error(e);
        }
        // TODO:: handle app messages
        return;
    }

    /**
     * To handle InteractionDataEvent
     */
    private InteractionDataEvent(evt: InteractionDataEvent): void {
        // check the channel
        if (evt.Channel !== 'TextChat') {
            return;
        }
        // check if interaction comments available
        if (evt.InteractionComments && evt.InteractionComments.length > 0) {
            evt.InteractionComments.forEach((c) => {
                const dt = JSON.parse(c);
                this.savedComments.push({
                    Message: dt.Comment,
                    Time: dt.Time,
                    User: dt.User
                });
            });
        }
    }

    /**
     * To handle CallHoldEvent
     * 
     * @param {CallHoldEvent} evt 
     */
    private CallHoldEvent(evt: CallHoldEvent): void {
        this.interactionOnHold = holdState;
        this.status = 'hold';
        this.interactionOnHold.loading = false;
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'hold'
        });
    }

    /**
     * To handle CallHoldReconnectEvent
     * 
     * @param {CallHoldReconnectEvent} evt 
     */
    private CallHoldReconnectEvent(evt: CallHoldReconnectEvent): void {
        this.interactionOnHold = unHoldState;
        this.status = 'connected';
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'connected'
        });
        this.interactionOnHold.loading = false;
    }

    /**
     * To handle HoldTimerEvent
     * 
     * @param {HoldTimerEvent} evt 
     */
    private HoldTimerEvent(evt: HoldTimerEvent): void {
        this._appUIService.showAppSnackbar({
            message: `Interaction ${this.interactionId} with [${this.customerName}] and Session ID [${this.sessionID}] is on hold for ${evt.HoldTimeString}`,
            state: evt.ColorCode,
            onClick: () => {
                const interaction = this.interactionList.filter(i => i.interactionId === evt.InteractionID)[0];
                if (interaction) {
                    // set the content page active
                    this._contentPageService.mode = interaction.path;
                    this.selectInteraction(interaction, true);
                }
            }
        });
    }

    /**
     * To handle CCLDataEvent
     * 
     * @param {CCLDataEvent} evt 
     */
    private CCLDataEvent(evt: CCLDataEvent): void {
        // check if customer name available
        if (evt.CallerName) {
            this.customerName = evt.CallerName;
            // update the interaction status and user
            this._interactionManagerService.updateInteraction(evt.InteractionID, {
                status: 'connected',
                user: this.customerName,
                otherData: {
                    icon: this.isSMM ? 'custom-' + this.channel : 'chat'
                }
            });
        }
    }

    /**
     * To proccess both TextChatMessageReceivedEvent and TextChatAgentMessageReceivedEvent
     * @param evt TextChatMessageReceivedEvent | TextChatAgentMessageReceivedEvent data
     */
    private chatMessageReceived = (evt: TextChatMessageReceivedEvent | TextChatAgentMessageReceivedEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

        // check the user
        const user = (evt as TextChatAgentMessageReceivedEvent).AgentName || this.customerName;

        // // check if app message
        if (evt.IsAppMessage) {
            const msg = JSON.parse(evt.Message);
            switch (msg.type.toLowerCase()) {
                case 'clientreloaded':
                    this.callWidget.destroy();
                    this._appUIService.showSnackbar('Client has refreshed their browser', 'failure');
                    break;
                default:
                    console.log('Unknown App Message');
            }
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
                    } else {
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
                    if (
                        data.attachment && // check if attachment is there
                        !data.attachment.src && // check if src is not found
                        data.attachment.name && // check if name is provided
                        fileServerUrl // check if file server URL is configured
                    ) {
                        // get the attachment src
                        data.attachment.src = `${fileServerUrl}/${this.sessionID}/${data.attachment.name}`;
                    }
                }
            }
        } catch (error) { }

        // TODO:: sanitze the message
        //        add message badge if the chat window is not active
        //        time taken timer update
        //        check for hyperlinks

        const isAgent = user !== this.customerName && this.conferenceType === 'silent';

        const repliedMsg = this.chatTranscripts.find((transcript) => transcript.messageId === data.replyId);
        // .repliedToMessage
        // add message to the transcripts
        this.pushToTranscript({
            who: user,
            isAgent: isAgent,
            position: user === this.customerName ? 'left' : 'right',
            messageId: data.messageId,
            message: data.message,
            type: data.attachment?.type || 'text',
            time: new Date(),
            attachment: data.attachment,
            repliedToMessage: this.replyingToMessage
        });

        let isActive = false;

        // check if the interaction is active, else count unread
        this.interactionList.forEach((item: InteractionRef) => {
            isActive = item.interactionId === this.interactionId && item.isActive;
        });

        // in not active then increment the count
        if (!evt.RecoveryEvent && (!isActive || this._contentPageService.getCurrentMode() !== this.data.Data.Path)) {
            const currentInteraction = this.interactionList.filter((i) => i.interactionId === this.interactionId)[0];
            const unreadCount = ++currentInteraction.otherData.unreadCount;

            // play new chat sound
            this._appUIService.playAudio('message', 0.5, false);

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

        // to show message alert
        this._appUIService.showDesktopAlert('New Message', `Message from ${this.customerName}`, true, 'message');
    }

    /**
     * To process AVControlMessageReceivedEvent
     * @param {AVControlMessageReceivedEvent} evt AVControlMessageReceivedEvent data
     */
    private AVControlMessageReceivedEvent = (evt: AVControlMessageReceivedEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

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
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

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

        // show the alert
        if (alertMessage) {
            this._appUIService.showSnackbar(alertMessage);
        }

        // destroy the transfer/conf widget
        if (this.tranfConfWidget) {
            this._aotWidgetService.destroyWidget(this.tranfConfWidget.ID);
            this.tranfConfWidget = null;
        }
        // close the conf/transfer if opened
        this.transferConfDialogRef?.close();
        this.confirmDialogRef?.close();

        // change the mode to upload to preview the taken image
        this.attachPreviewMode = '';
    }

    /**
     * To process TextChatAgentDisconnectedEvent
     * @param evt TextChatAgentDisconnectedEvent data
     */
    private TextChatAgentDisconnectedEvent = (evt: TextChatAgentDisconnectedEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

        // remove the agent from list
        this.conferenceAgentList = this.conferenceAgentList.filter((c) => c.AgentId !== evt.AgentId);

        // check if a bot is connected
        if (evt.IsBotAgent) {
            this.botConnected = false;
        }

        // show an alert for non silent agent
        if (evt.ConferenceType === '' || evt.ConferenceType === 'conf' || evt.ConferenceType === 'whisper') {
            this._appUIService.showSnackbar(`${evt.AgentName} is disconnected from chat`, 'info');
        }

        // if any tempates then clear
        this.textTemplates.filtered = [];

        // Reset the reply form
        this.replyForm?.reset();
    }

    /**
     * To process custom CannedResposeEvent
     *
     * @param {CustomSDKEvent} evt CannedResposeEvent data
     */
    private CannedResposeEvent = (evt: CustomSDKEvent) => {
        // check the interaction
        // if (evt.InteractionID !== this.interactionId) {
        //     return;
        // }

        // send the selected template
        this.sendMessage(evt.Data.Template);
    }

    /**
     * To process custom TextChatTransferSuccessEvent
     *
     * @param {TextChatTransferSuccessEvent} evt
     */
    private TextChatTransferSuccessEvent = (evt: TextChatTransferSuccessEvent) => {
        // Rahil close AV call here via opener
        this.transferConfDialogRef?.close();
    }

    /**
     * To process custom TextChatTransferFailedEvent
     *
     * @param {TextChatTransferFailedEvent} evt
     */
    private TextChatTransferFailedEvent = (evt: TextChatTransferFailedEvent) => {
        this.transferConfDialogRef?.close();
        this._appUIService.showSnackbar(`${evt.ResultMessage}`, 'failure');
    }

    /**
     * To process custom TextChatTransferRejectEvent
     *
     * @param {TextChatTransferRejectEvent} evt
     */
    private TextChatTransferRejectEvent = (evt: TextChatTransferRejectEvent) => {
        const otherData = JSON.parse(evt.Data);
        this._appUIService.showSnackbar(
            `${evt.FromAgentName} has rejected your ${otherData.type === 'conf' ? 'conference' : 'transfer'} request ${evt.Comment !== '' ? ' with comment: ' + evt.Comment : ''
            }`,
            'failure'
        );
    }

    /**
     * To process both TextChatMessageSentEvent and TextChatMessageTemplateSentEvent
     *
     * @param evt TextChatMessageSentEvent | TextChatMessageTemplateSentEvent data
     */
    private messageSentEvent(evt: TextChatMessageSentEvent | TextChatMessageTemplateSentEvent): void {
        try {
            // check the interaction
            // if (evt.InteractionID !== this.interactionId || this.status === 'disconnected') {
            //     return;
            // }

            let serverMessage = false;

            if (this.status === 'disconnected') {
                return;
            }

            const isJson = this.isValidJson(evt.Message);
            // get the formatted message
            const formattedMessage = isJson ? JSON.parse(evt.Message) : null;
            // check if recovery or template sent then show it
            if ((evt.RecoveryEvent && !evt.IsAppMessage) || evt.EventName === 'TextChatMessageTemplateSentEvent') {
                const messageId = formattedMessage ? formattedMessage.messageId : evt.EventId;
                const message = formattedMessage ? formattedMessage.message : evt.Message;
                const attachment = formattedMessage && formattedMessage.attachment ? formattedMessage.attachment : null;
                const type = attachment ? attachment.type : 'text';

                // if media proxy then remove the source
                if (attachment && !attachment.src && this.fileUploadUrl.MediaProxy) {
                    // get the file upload url
                    const fileServerUrl: string = this.fileUploadUrl?.MediaProxy;
                    attachment.src = `${fileServerUrl}/${this.sessionID}/${attachment.name}`;
                }

                // TODO:: implement reply and get the replied message

                // for template sent turn on freeze button
                if (evt.EventName === 'TextChatMessageTemplateSentEvent') {
                    serverMessage = !(evt as any).UIEvent;
                    // show freeze auto response button
                    if (this.callWidget) {
                        this.freezeAutoResponse(true);
                    } else {
                        this.showAutoFreeze = true;
                    }
                }

                // add message to the transcripts
                this.pushToTranscript({
                    who: this.user.agentName,
                    isAgent: true,
                    position: 'right',
                    messageId,
                    status: evt.Result ? 'sent' : 'failed',
                    message,
                    type,
                    time: new Date(Date.parse(evt.CreatedTime.toString())) || new Date(),
                    attachment,
                    serverMessage
                });

                // set ready to reply
                this.readyToReply();
            } else {
                if (evt.MessageId) {
                    this.chatTranscripts.map((item) => {
                        if (item.messageId === evt.MessageId) {
                            if (evt.Result) {
                                item.status = 'sent';
                            } else {
                                item.status = 'failed';
                            }
                        }
                        return item;
                    });
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * To scroll to bottom of transcript
     * @param speed Speed of scroll
     */
    private scrollToBottom(speed?: number): void {
        speed = speed || 200;
        if (this.messagesRef) {
            // this.directiveScrolls.last.update();

            setTimeout(() => {
                this.messagesRef.nativeElement.scrollTop = this.messagesRef.nativeElement.scrollHeight;
            });
        }
    }

    /**
     * To focus the reply textbox
     */
    focusReplyInput(): void {
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
            return typeof JSON.parse(str) === 'object';
        } catch (error) { }
        return false;
    }

    /**
     * To send reply to customer message
     * @param template Message template
     */
    private sendMessage(template: any): void {
        // get the typed message
        const inputMessage = template?.Text || this.replyForm.form.value.message;
        const messageId = `a_${TUtils.Generic.uuid()}`;
        let messageData = inputMessage;
        const attachment = template?.Attachment || null;
        const type = template?.Type ? 'attachment' : 'text';

        // Message
        const message = {
            who: this.user.agentName,
            messageId,
            isAgent: true,
            position: 'right',
            status: 'init',
            message: inputMessage,
            time: moment(new Date()),
            type: attachment ? attachment.type : 'text',
            attachment: { ...attachment },
            repliedToMessage: this.replyingToMessage
        };

        // Add the message to the chat
        this.pushToTranscript(message);

        // check if reply feature/attachment is enabled or not social media
        if ((attachment || this.data.Data.ReplyOnChatAllowed) && !this.isSMM) {
            if (attachment) {
                // if media proxy then remove the source
                if (this.fileUploadUrl.MediaProxy) {
                    attachment.src = '';
                    attachment.uploader = 'MediaProxy';
                } else {
                    attachment.uploader = 'TmacProxy';
                }
            }

            // create the json to send
            const jsonMessage = {
                messageId: messageId,
                type: type,
                message: inputMessage,
                replyId: this.replyingToMessage?.messageId || '',
                templateId: template?.ID || '',
                attachment
            };

            // TODO:: check for reply messages

            // stringy the json
            messageData = JSON.stringify(jsonMessage);
        } else if (attachment && this.isSMM) {
            // stringy the json
            messageData = JSON.stringify({
                _type: 'attachment',
                _attachmentType: attachment.type,
                _attachmentId: attachment.interactionId,
                _attachmentPreviewId: '',
                _attachmentSize: attachment.size
            });
        }
        this.replyingToMessage = null;
        // Update the server
        SDKClient.sendTextChat({
            interactionId: this.interactionId.toString(),
            message: messageData,
            messageId,
            templateId: template?.ID || '',
            type: ''
        })
            .then((res) => {
                if (res.response > 0) {
                    // show freeze auto response button
                    if (this.callWidget) {
                        this.freezeAutoResponse(true);
                    } else {
                        this.showAutoFreeze = true;
                    }
                } else {
                    this._appUIService.showSnackbar('Message send failed!', 'failure');
                    this.chatTranscripts.map(t => {
                        if (t.messageId === messageId) {
                            t.status = 'failed';
                        }
                    });
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Message send error!', 'failure');
                this.chatTranscripts.map(t => {
                    if (t.messageId === messageId) {
                        t.status = 'failed';
                    }
                });
            });

        // Reset the reply form
        this.replyForm?.reset();

        // set ready to reply
        this.readyToReply();
    }

    /**
     * To open voice or video call widget
     * @param {'audio' | 'video'} param Type of call
     * @param {'in' | 'out'} direction Direction of the call
     * @param {AVControlMessageReceivedEvent} avEvent [OPTIONAL] For incoming requestav to process AVControlMessageReceivedEvent
     */
    private openCallWidget(param: 'audio' | 'video', direction: 'in' | 'out', avEvent: AVControlMessageReceivedEvent): void {
        // if the widget is created then ignore
        if (this.callWidget) {
            return;
        }

        // freeze auto response if needed
        this.freezeAutoResponse(false);

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
        widget.Config.Actions = ['collapse', 'maximize'];
        // widget.Data.AVConn = this.avConn;
        // widget.Data.DirectCall = direct;
        widget.Data.EventId = this.data.InteractionDetails.EventId;
        widget.Data.ConferenceType = this.conferenceType;
        widget.Data.CustomerName = this.customerName;
        widget.Data.Direction = direction;
        widget.Data.AVEvent = avEvent;
        widget.Data.Config = this.data.Data;
        widget.Data.Opener = this;
        widget.Data.InteractionID = this.data.InteractionDetails?.InteractionID;
        widget.Data.SessionID = this.data.InteractionDetails?.TextChatSessionID;

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
        SDKClient.endTextChat(
            {
                interactionId: this.interactionId.toString(),
                reason
            },
            null
        )
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
     * To get all text templates
     */
    private async getTextTemplates(): Promise<void> {
        try {
            // load all text templates
            const { response } = await SDKClient.getAllTextTemplates();
            this.textTemplates.data = response;
        } catch (error) { }
    }

    /**
     * Done typing
     */
    private doneTyping(): void {
        // set typing to false
        this.userTyping = false;
        // send typing state
        SDKClient.notifyTextChatTyping({
            interactionId: this.interactionId.toString(),
            state: 1
        });
    }

    /**
     * To process bot history
     *
     * @param {String} history
     */
    processBotHistory(history: string): void {
        try {
            // get all the bot history
            const botHistory = JSON.parse(history);
            // check the length of history data
            if (botHistory.length > 0) {
                botHistory.forEach((item: any, index: number, array: any[]) => {
                    let message = '';
                    let who = '';

                    if (item.customer_input) {
                        // customer message
                        who = this.customerName;
                        message = item.customer_input;
                    } else if (item.reply) {
                        // agent message
                        who = 'Chatbot';
                        message = item.reply;
                    }

                    // check the message and add message to the transcripts
                    if (message) {
                        this.pushToTranscript({
                            who,
                            isAgent: who === 'Chatbot',
                            position: who === 'Chatbot' ? 'right' : 'left',
                            messageId: TUtils.Generic.uuid(),
                            message,
                            time: item.timestamp
                        });
                    }

                    // check if the last item then add divider
                    if (array.length - 1 === index) {
                        this.pushToTranscript({
                            divider: true
                        });
                    }
                });
            }
        } catch (error) { }
    }

    /**
     * To check for conversation history and append to transcript
     *
     * @param {String} cif
     */
    private async checkForConversationHistory(cif: string): Promise<void> {
        // get the customer id
        const { response } = await TUtils.HttpClient.sendRequest({
            url:
                this.conversationService.Url +
                `user-conversations-timeline/${cif}?fromTime=0&toTime=${this.startTime.getTime()}&limit=${this.conversationService.Limit}`,
            method: 'GET',
            responseType: 'json',
            timeout: 20000
        });
        // validate the result
        if (response && response.result && response.result.length) {
            // loop and process
            response.result.forEach((res: any, i: number) => {
                // check and add the divider
                if (i === 0) {
                    this.chatTranscripts.unshift({
                        divider: true
                    });
                }
                // add message to the transcripts
                this.chatTranscripts.unshift({
                    who: res.sender_id === cif ? this.customerName : res.sender_id,
                    isAgent: res.sender_id !== cif,
                    position: res.sender_id === cif ? 'left' : 'right',
                    messageId: res.mid,
                    message: res.message_content,
                    type: 'text',
                    time: new Date(res.created_at),
                    attachment: null
                });
            });
        }
    }

    /**
     * To conference Bot with the session
     *
     * @param {string} value
     */
    private conferenceWithBot(value: string): void {
        this._fuseProgressBarService.show();
        // freeze auto response
        this.freezeAutoResponse(true);
        // send the request to server
        SDKClient.textChatConferenceToBot({
            destination: value,
            interactionId: this.interactionId.toString()
        })
            .then((resp) => {
                // check the response
                if (resp.response > 0) {
                    this._appUIService.showSnackbar(`Chat conferenced with bot successfully`);
                } else {
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
     * To push transcript to transcripts
     * 
     * @param {ChatTranscripts} transcript 
     */
    private pushToTranscript(transcript: ChatTranscripts): void {
        // check for message has link
        if (transcript.message && !this.checkStringIsHTML(transcript.message)) {
            transcript.message = urlify(transcript.message);
        }
        this.chatTranscripts.push(transcript);
    }

    /**
     * To check if the string is HTML
     * 
     * @param {String} str 
     */
    private checkStringIsHTML(str: string): boolean {
        return /<\/?[a-z][\s\S]*>/i.test(str);
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
        return i === 0 || (this.chatTranscripts[i - 1] && this.chatTranscripts[i - 1].who !== message.who);
    }

    /**
     * Check if the given message is the last message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    public isLastMessageOfGroup(message: any, i: number): boolean {
        return i === this.chatTranscripts.length - 1 || (this.chatTranscripts[i + 1] && this.chatTranscripts[i + 1].who !== message.who);
    }

    /**
     * To send a message to the remote end
     * @param event Input event
     */
    public reply(event: any): void {
        event.preventDefault();
        if (!this.replyForm.form.value.message?.trim()) {
            return;
        }

        // close the emoji overlay if opened
        if (this.showEmojiOverlay) {
            this.showEmojiOverlay = false;
        }

        // send the typed message
        this.sendMessage(null);
    }

    /**
     * To select an interaction from interaction list
     *
     * @param {InteractionRef} item Interaction item
     */
    public selectInteraction(item: InteractionRef, force?: boolean): void {
        // if same interaction is seleted then return
        if (!force && this.interactionId === item.interactionId) {
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
                            // remove the interaction reference
                            this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                        } else {
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
        // this._fuseProgressBarService.show();
        this.showAutoFreeze = false;
        SDKClient.freezeTextChatAutoResponse(this.interactionId.toString())
            .then((dt: IResponse) => {
                // hide the progress bar
                // this._fuseProgressBarService.hide();
                // if failed
                if (!dt.response || dt.response !== 1) {
                    this.showAutoFreeze = true;
                    this._appUIService.showSnackbar('Freeze auto response failed!', 'failure');
                }
            })
            .catch(() => {
                // hide the progress bar
                // this._fuseProgressBarService.hide();
                this.showAutoFreeze = true;
                this._appUIService.showSnackbar('Error in freezing auto response failed!', 'failure');
            });
    }

    /**
     * To answer a manual textchat
     *
     * @param {MatButton} btn
     */
    public answerChat(btn: MatButton): void {
        // show the progress bar
        this._fuseProgressBarService.show();
        // disable the button
        btn.disabled = true;
        // answer chat
        SDKClient.answerCall(this.interactionId.toString())
            .then((dt) => {
                if (dt.response.ResultCode >= 0) {
                    this._appUIService.showSnackbar('Answer chat success');
                } else {
                    // enable the button
                    btn.disabled = false;
                    this._appUIService.showSnackbar(`Answer chat failed: ${dt.response.ResultMessage}`, 'failure');
                }
            })
            .catch(() => {
                // enable the button
                btn.disabled = false;
                this._appUIService.showSnackbar('Error in answring the chat, please try again', 'failure');
            })
            .finally(() => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
            });
    }

    /**
     * To escalate the chat to audio/video
     * @param {'audio' | 'video'} type Type of escalation
     */
    public escalateToAV(type: 'audio' | 'video'): void {
        // open call widget
        this.openCallWidget(type, 'out', null);
    }

    /**
     * To preview the media sent by customer or agent
     * @param {ChatTranscripts} previewData Chat transcript data
     */
    public previewMedia(previewData: ChatTranscripts): void {
        // get the message to display
        let message = '';

        if (previewData.attachment.type === 'image') {
            message = `<img src ="${previewData.attachment.src}" width = "100%" width = "100%" /> `;
        } else if (previewData.attachment.type === 'video') {
            message = `<video controls autoplay src ="${previewData.attachment.src}" width = "100%" width = "100%"> </video>`;
        }
        // show the custom dialog box
        this.confirmDialogRef = this._appUIService.showCustomDialog('alert', message, 'Preview');
    }

    /**
     * To dispose call widget
     */
    public disposeCallWidget(): void {
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
        const type = this.conferenceType === 'silent' ? 'whisper' : this.conferenceType === 'whisper' ? 'conf' : 'takeover';
        const confirmType = type === 'conf' ? 'conference' : type;
        // get confirmation
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog(
            'generic',
            'Confirm Mode Change',
            `Are you sure to change chat to ${confirmType}?`
        );
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
                    conferenceAgents: map(this.conferenceAgentList, (item) => ({
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
     * To save interaction comments to server
     */
    public saveInteractionComments(): void {
        let message = '';
        // check the saved comments
        this.savedComments.forEach((item) => {
            message += `
                 <div class="text-primary m-0 mat-body-2">${item.Message.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                 <span class="time secondary-text mat-body-1">${item.User}</span>,
                 <span class="time secondary-text mat-body-1">${new Date(item.Time).toLocaleString()}</span>
                 <br /><br />
                 `;
        });
        message += 'Add new comment:';

        const dialogRef = this._appUIService.showCustomDialog('prompt', message, 'Interaction Notes', { minRows: 5 }, { minWidth: '30%' });
        dialogRef.afterClosed().subscribe((resp1) => {
            if (resp1) {
                this._fuseProgressBarService.show();
                SDKClient.saveInteractionComment({
                    comment: resp1,
                    interactionId: this.interactionId.toString()
                })
                    .then((resp2) => {
                        if (resp2.response > 0) {
                            // add comments to the reference
                            this.savedComments.push({
                                Message: resp1,
                                Time: new Date(),
                                User: SDKClient.getAgentData().agentName
                            });
                            // alert user
                            this._appUIService.showSnackbar('Interaction comment saved successfully');
                        } else {
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

    /**
     * To open transfer dialog
     *
     * @param type
     * @param icon
     */
    public openTransferConferenceDialog(type: string): void {
        const transferConfig = {
            agent: this.data.Data.Transfer?.Agent || {},
            skill: this.data.Data.Transfer?.Skill || {}
        };

        const conferenceConfig = {
            agent: this.data.Data.Conference?.Agent || {},
            skill: this.data.Data.Conference?.Skill || {}
        };

        // get data based on type
        let data: AgentSkillListData =
            type === 'transfer'
                ? {
                    title: 'Transfer Chat',
                    type: 'transferChat',
                    agent: {
                        allowed: transferConfig.agent.Allowed,
                        blind: transferConfig.agent.Allowed,
                        source: transferConfig.agent.Source,
                        allowedStates: transferConfig.agent.AllowedStates,
                        columns: transferConfig.agent.Columns,
                        teamFilter: transferConfig.agent.TeamFilter
                    },
                    skill: {
                        allowed: transferConfig.skill.Allowed,
                        blind: transferConfig.skill.Allowed,
                        source: transferConfig.skill.Source,
                        channelPrfix: transferConfig.skill.ChannelPrefix,
                        columns: transferConfig.skill.Columns
                    }
                }
                : {
                    title: 'Conference Chat',
                    type: 'conferenceChat',
                    agent: {
                        allowed: conferenceConfig.agent.Allowed,
                        blind: conferenceConfig.agent.Allowed,
                        source: conferenceConfig.agent.Source,
                        allowedStates: conferenceConfig.agent.AllowedStates,
                        columns: conferenceConfig.agent.Columns,
                        teamFilter: conferenceConfig.agent.TeamFilter
                    },
                    skill: {
                        allowed: conferenceConfig.skill.Allowed,
                        blind: conferenceConfig.skill.Allowed,
                        source: conferenceConfig.skill.Source,
                        channelPrfix: conferenceConfig.skill.ChannelPrefix,
                        columns: conferenceConfig.skill.Columns
                    }
                };

        // add common properties
        data = {
            interactionId: this.interactionId,
            ...data,
            otherData: {
                type: type === 'transfer' ? 'transfer' : 'conf',
                mode: this.chatMode,
                sessionId: this.sessionID,
                lineId: this.lineId
            }
        };

        // check if the type is conference and self destination list is there
        if (type === 'conference' && this.selfServiceDestinations.length) {
            data.otherData = {
                ...data.otherData,
                dynamicList: {
                    key: 'dynamicList',
                    label: 'Bot Conference',
                    textLabel: 'Destination',
                    data: this.selfServiceDestinations,
                    type: 'dynamic_botConference',
                    columns: ['Name', 'Value'],
                    selection: 'Value',
                    blindAllowed: false,
                    showComments: false
                }
            };
        }

        data.callback = (callbackData) => {
            // check the source
            if (callbackData.source === 'dynamic_botConference') {
                this.conferenceWithBot(callbackData.selectedRow.Value);
            }
        };

        // open agent skill list component in dialog
        this.transferConfDialogRef = this._matDialog.open(AgentSkillListComponent, {
            data,
            panelClass: 'agent-skill-dialog',
            minWidth: '30%',
            maxWidth: '100%',
            height: '60%',
            disableClose: true
        });
    }

    /**
     * Adds emoji to reply
     *
     * @param {any} evt
     */
    addEmoji(evt: any): void {
        const inputVal: string = this.replyInput?.value || '';
        const selectionStart = this.replyInputField.nativeElement.selectionStart;
        const selectionEnd = this.replyInputField.nativeElement.selectionEnd;
        const startSlice = inputVal.slice(0, selectionStart);
        const endSlice = inputVal.slice(selectionEnd);
        this.replyForm.value.message = `${startSlice}${evt.emoji.native}${endSlice}`;
        this.replyInput.value = this.replyForm.value.message;
        this.replyInput.focus();
    }

    /**
     * To add an attachment
     *
     * @param { 'documents' | 'camera' | 'media' } type
     */
    addAttachment(type: 'documents' | 'camera' | 'media'): void {
        // clear the mode
        this.attachPreviewMode = '';
        // close the attach menu
        setTimeout(() => {
            if (type === 'documents') {
                // open camera to take a picture
                this.attachPreviewMode = 'uploadDocuments';
            } else if (type === 'media') {
                // open camera to take a picture
                this.attachPreviewMode = 'uploadMedia';
            } else {
                // open camera to take a picture
                this.attachPreviewMode = 'camera';
            }
            // close attachment list
            this.showAttachOverlay = false;
        });
    }

    /**
     * To close attachment panel
     */
    closeAttachments(): void {
        this.attachPreviewMode = '';
    }

    /**
     * To send attachments
     */
    sendAttachments(item: any): void {
        // clear the mode
        this.attachPreviewMode = '';

        // prepare the attachment json
        let attachment: any = {
            name: item.fileName,
            src: item.src,
            type: item.type,
            size: item.size
        };
        // check if interaction id is provided, this will for SMM upload
        if (item.interactionId) {
            attachment = {
                ...attachment,
                interactionId: item.interactionId
            };
        }
        // send message
        this.sendMessage({
            Text: '',
            Type: item.type,
            Attachment: attachment
        });
    }

    /**
     * To send signature request
     *
     * @param {MatButton} btn
     */
    sendSignatureRequest(btn: MatButton): void {
        // show the progress bar
        this._fuseProgressBarService.show();
        // disable the button
        btn.disabled = true;
        SDKClient.sendActionMessage({
            interactionId: this.interactionId.toString(),
            message: JSON.stringify({
                source: 'agent',
                options: {},
                data: {
                    interactionId: this.interactionId.toString()
                },
                status: 'request',
                type: 'sign',
                eventName: 'ActionMessage',
                id: TUtils.Generic.uuid()
            })
        })
            .then((res) => {
                if (res.response.ResultCode === 1) {
                    this._appUIService.showSnackbar('Signature request sent successfully');
                } else {
                    this._appUIService.showSnackbar('Signature request failed!', 'failure');
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Signature request error!', 'failure');
            })
            .finally(() => {
                // show the progress bar
                this._fuseProgressBarService.hide();
                // disable the button
                btn.disabled = false;
            });
    }

    /**
     * On key up
     *
     * @param evt
     */
    onKeyUp(event: any): void {
        // check if text templates is enabled
        if (this.data.Data.ChatTemplate.Allowed) {
            // check for text templates
            if (event.target.value) {
                const match = event.target.value.split(' ').pop().trim().toLowerCase();
                if (match) {
                    if (this.data.Data.ChatTemplate.Filter.toLowerCase() === 'contains') {
                        this.textTemplates.filtered = this.textTemplates.data.filter((f) => f.Name.toLowerCase().includes(match));
                    } else if (this.data.Data.ChatTemplate.Filter.toLowerCase() === 'endswith') {
                        this.textTemplates.filtered = this.textTemplates.data.filter((f) => f.Name.toLowerCase().endsWith(match));
                    } else {
                        this.textTemplates.filtered = this.textTemplates.data.filter((f) => f.Name.toLowerCase().startsWith(match));
                    }
                }
            } else {
                this.textTemplates.filtered = [];
            }
        }

        // validate the charecter
        if (INVALID_CHARS.includes(event.keyCode)) {
            return;
        }

        // check if user typing
        if (!this.userTyping && event.target.value) {
            // set typing to true
            this.userTyping = true;
            // send typing state
            SDKClient.notifyTextChatTyping({
                interactionId: this.interactionId.toString(),
                state: 0
            });
        } else if (this.userTyping && !event.target.value) {
            this.doneTyping();
        }
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.doneTyping();
        }, 3000);
    }

    /**
     * To select a template
     * @param item
     */
    selectTemplate(item: TextTemplate): void {
        const split = this.replyInput.value.split(' ');
        const x = split.slice(0, split.length - 1).join(' ');
        this.replyForm.value.message = `${x} ${item.Text}`.trim();
        this.replyInput.value = `${x} ${item.Text}`.trim();
        this.replyInput.focus();
        this.textTemplates.filtered = [];
    }

    /**
     * Sets replying to message
     */
    setReplyingToMessage(message: ChatTranscripts): void {
        this.replyingToMessage = { ...message, repliedToMessage: null, time: null };
    }

    /**
     * Opens a whiteboard session
     */
    async openWhiteboard(): Promise<void> {
        if (!this.data.Data.Whiteboard?.Url) {
            this._appUIService.showSnackbar('No Whiteboard Url provided in Config', 'failure');
            return;
        }
        try {
            const snackRef = this._appUIService.showSnackbar('Opening whiteboard', 'loading');
            const res = await SDKClient.sendActionMessage({
                interactionId: this.interactionId as any,
                message: JSON.stringify({
                    source: 'agent',
                    options: {},
                    data: {
                        url: `${this.data.Data.Whiteboard.Url}?sessionid=${this.sessionID}`
                    },
                    status: 'request',
                    type: 'openWhiteboard',
                    eventName: 'ActionMessage',
                    id: TUtils.Generic.uuid()
                })
            });
            if (res.response?.ResultMessage === 'Success') {
                const widget = new TwWidgetModel('Whiteboard', 'tw-custom', 'create');
                widget.Config.Actions = ['collapse', 'maximize', 'destroy'];
                widget.Config.ViewState = 'maximize';
                widget.Config.Anchor = true;
                widget.Config.Position.W = 800;
                widget.Config.Position.H = 550;
                widget.Data = {
                    AutoOpen: false,
                    Url: `${this.data.Data.Whiteboard.Url}?sessionid=${this.sessionID}`
                };
                this._aotWidgetService.addWidget(widget);
                snackRef.dismiss();
            } else {
                throw new Error('Error occured while opening whiteboard');
            }
        } catch (e) {
            console.error(e);
            this._appUIService.showSnackbar('Error occured while opening whiteboard', 'failure');
        }
    }

    /**
     * To execute action
     */
    executeAction(action: any, actionBtn: MatButton): void {
        switch (action.type) {
            case 'whiteboard':
                this.openWhiteboard();
                break;
            case 'signatureRequest':
                this.sendSignatureRequest(actionBtn);
                break;
            default:
        }
        // close the more actions overlay
        this.openMoreActions = false;
    }

    /**
     * Holds interaction
     */
    holdInteraction = async (): Promise<void> => {
        try {
            this._fuseProgressBarService.show();
            if (this.interactionId) {
                this.interactionOnHold.loading = true;
                const res = await SDKClient.holdCall(this.interactionId.toString());

                this._fuseProgressBarService.hide();
                if (res.response?.ResultCode !== 0) {
                    throw new Error('Interaction id not found');
                }
            } else {
                throw new Error('Interaction id not found');
            }
        } catch (e) {
            console.error(e);
            this.interactionOnHold.loading = false;
            this._fuseProgressBarService.hide();
        }
    }

    /**
     * Unholds interaction
     */
    unHoldInteraction = async (): Promise<void> => {
        try {
            this._fuseProgressBarService.show();
            if (this.interactionId) {
                this.interactionOnHold.loading = true;
                const res = await SDKClient.unHoldCall(this.interactionId.toString());

                this._fuseProgressBarService.hide();
                if (res.response?.ResultCode !== 0) {
                    throw new Error('Interaction id not found');
                }
            } else {
                throw new Error('Interaction id not found');
            }
        } catch (e) {
            console.error(e);
            this.interactionOnHold.loading = false;
            this._fuseProgressBarService.hide();
        }
    }
}
