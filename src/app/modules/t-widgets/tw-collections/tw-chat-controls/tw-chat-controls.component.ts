import { AOTWidget, InteractionWidgetBaseData, TwChatControls, TwChatControlsData, WidgetConfig } from '@ad/types';
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AgentSkillListComponent } from '@modules/shared/components';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { isStringHtml, urlify } from '@tmac/operators';
import {
    ActionMessageReceivedEvent,
    AgentNotificaitonEvent,
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
    TextChatIncomingEvent,
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
import { AGENT_FEATURES, INVALID_CHARS } from 'app/constants';
import {
    AgentSkillListData,
    AgentSkillRef,
    ChatTranscripts,
    CommonWidgetData,
    CustomSDKEvent,
    InteractionComment,
    InteractionRef,
    SnackbarStateTypes
} from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { throwADError } from 'app/utils';
import { format } from 'date-fns';
import { map } from 'lodash';
import * as moment from 'moment';
import { from, Subject, timer } from 'rxjs';
import { delay, filter, takeUntil } from 'rxjs/operators';

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
    // @Input() data: IWidget<TextChatIncomingEvent, IWidgetData>;
    @Input() data: TwChatControls<TextChatIncomingEvent>;
    /**
     * Widget data ref
     */
    widgetData: TwChatControlsData & InteractionWidgetBaseData;
    /**
     * Media Channels
     */
    mediaChannels = ['video', 'audio'];
    /**
     * App config
     */
    appConfig: any;
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
     * Interaction Ref
     */
    interaction: TextChatIncomingEvent;
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
     * Customer Id
     */
    cif: string;
    /**
     * AV call widget ref
     */
    callWidget: AOTWidget;
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
    chatMode: 'audio' | 'video';
    /**
     * Line ID
     */
    lineId: string;
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
     * Flag to blink comments button when added from server
     */
    commentsAdded: boolean;
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
     * Remote typing ref
     */
    remoteTyping: {
        /**
         * Name of user typing (conf agent/customer)
         */
        name: string;
        /**
         * Typing flag
         */
        typing: boolean;
    };
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
     * Agent action features
     */
    agentFeatures: {
        /**
         * Audio escalate
         */
        audioEscalate: boolean;
        /**
         * Video escalate
         */
        videoEscalate: boolean;
        /**
         * Signature request
         */
        signature: boolean;
        /**
         * Whiteboard request
         */
        whiteboard: boolean;
        /**
         * Reply to chat
         */
        chatReply: boolean;
        /**
         * Attachments
         */
        attachments: boolean;
        /**
         * Emoji
         */
        emoji: boolean;
        /**
         * Transfer
         */
        transfer: boolean;
        /**
         * Conference
         */
        conference: boolean;
        /**
         * Chat template
         */
        chatTemplate: boolean;
        /**
         * Replying to chat
         */
        reply: boolean;
        /**
         * Interaction comment
         */
        comment: boolean;
        /**
         * Hold
         */
        hold: boolean;
        /**
         * Snapshot
         */
        snapshot: boolean;
        /**
         * Voice note
         */
        voicenote: boolean;
        /**
         * Screenshare
         */
        screenshare: boolean;
        /**
         * WebRTC test
         */
        webrtcTest: boolean;
        /**
         * Media download
         */
        mediaDownload: boolean;
        /**
         * To toggle user view mode
         */
        toggleUserView: boolean;
    };
    /**
     * Connected event ref
     */
    remoteUserConnectedEvent: TextChatRemoteUserConnectedEvent;
    /**
     * Async chat flag
     */
    asyncChatRef: {
        /**
         * Is async chat flag
         */
        isAsync: boolean;
        /**
         * Async case id
         */
        caseId: string;
        /**
         * Async chat history firstId
         */
        firstId: number;
        /**
         * Async chat history lastId
         */
        lastId: number;
        /**
         * Limit of chat history
         */
        limit: number;
        /**
         * Request sent flag
         */
        requestSent: boolean;
    };
    /**
     * Preview media dialog
     */
    @ViewChild('previewMediaDialog')
    previewMediaDialog: TemplateRef<any>;

    /**
     * Preview media dialog ref
     */
    previewMediaDialogRef: MatDialogRef<any>;

    /**
     * Preview media dialog data
     */
    previewMediaDialogData: any;

    /**
     * Constructor
     */
    constructor(
        private _interactionManagerService: InteractionManagerService,
        private _tmacEventService: TMACEventService,
        private _matDialog: MatDialog,
        private _appDataService: AppDataService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _contentPageService: ContentPageService,
        private _aotWidgetService: AOTWidgetService,
        private _appUIService: AppUiService,
        private _fuseFacadeService: FuseFacadeService,
        private _agentFeaturesService: AgentFeaturesService
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
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.widgetData = this.data.Data;

        this.interaction = this.data.InteractionDetails;

        this.asyncChatRef = {
            isAsync: this.interaction.IsAsyncChat ?? false,
            caseId: this.interaction.UCID,
            firstId: 0,
            lastId: 0,
            limit: 0,
            requestSent: false
        };

        this.registerToEvents();

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        this._contentPageService.mode.pipe(takeUntil(this.unsubscribeAll)).subscribe((viewMode: string) => {
            // check if textchat view and selected interaction is this
            if (viewMode === this.widgetData.Path) {
                const interaction = this.interactionList?.filter((i) => i.isActive && i.otherData.unreadCount > 0)?.[0];
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

        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            // filter out the textchat interaction
            this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'textchat');
        });

        this._agentFeaturesService.features.pipe(takeUntil(this.unsubscribeAll)).subscribe((change: boolean) => {
            if (change) {
                // check agent features
                this.checkAgentFeatures();
            }
        });

        this.agentFeatures = {
            audioEscalate: this.widgetData.AudioEscalateAllowed ?? false,
            videoEscalate: this.widgetData.VideoEscalateAllowed ?? false,
            signature: this.widgetData.SignatureAllowed ?? false,
            whiteboard: this.widgetData.Whiteboard?.Allowed ?? false,
            attachments: this.widgetData.AttachmentAllowed ?? false,
            emoji: this.widgetData.EmojiAllowed ?? false,
            chatReply: this.widgetData.ReplyOnChatAllowed ?? false,
            conference: this.widgetData.Conference?.Allowed ?? false,
            transfer: this.widgetData.Transfer?.Allowed ?? false,
            chatTemplate: this.widgetData.ChatTemplate?.Allowed ?? false,
            reply: this.widgetData.ReplyAllowed ?? true,
            comment: this.widgetData.InteractionCommentAllowed ?? false,
            hold: this.widgetData.HoldInteractionAllowed ?? false,
            snapshot: this.widgetData.Snapshot?.Allowed ?? false,
            voicenote: this.widgetData.VoiceNoteAllowed ?? false,
            screenshare: this.widgetData.ScreenShareAllowed ?? false,
            webrtcTest: this.widgetData.WebRTCTest?.Allowed ?? false,
            mediaDownload: false,
            toggleUserView: this.widgetData.ToggleUserViewAllowed ?? false
        };

        // set the user info
        this.user = SDKClient.getAgentData() || null;

        // check for agent features
        this.checkAgentFeatures();

        // set the status
        this.status = 'incoming';

        // set the start time
        this.startTime = new Date(this.data.InteractionDetails.CreatedTime) ?? new Date();

        // get the file upload Url
        this.fileUploadUrl = this.appConfig.Main.Urls?.FileServerUrl || null;

        // update the line Id
        this.lineId = (this.data.InteractionDetails as TextChatIncomingEvent)?.RecoveryData?.lineid || '';

        // check if this chat is init by supervisor
        this.supervisorInit = this.lineId === 'bargein';

        // check if conversation api Url is configured
        if (this.widgetData.ConversationService && this.widgetData.ConversationService.Url) {
            // set the conversation service urls
            this.conversationService.Url = this.widgetData.ConversationService.Url.endsWith('/')
                ? this.widgetData.ConversationService.Url
                : this.widgetData.ConversationService.Url + '/';
            // set the conversation limit
            this.conversationService.Limit = this.widgetData.ConversationService.Limit;
        }

        if (this.agentFeatures.chatTemplate) {
            // get text templates
            this.getTextTemplates();
        }

        // check for moreActions
        if (this.agentFeatures.whiteboard) {
            this.moreActions.push({
                label: 'Open Whiteboard',
                icon: 'create',
                type: 'whiteboard'
            });
        }

        if (this.agentFeatures.signature) {
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
        // check if the current page is email page
        if (this.widgetData.RouteOnInteraction && this._interactionManagerService.getInteractionCount().active <= 1) {
            setTimeout(() => {
                let inPage = true;
                if (this._contentPageService.getCurrentMode() !== this.widgetData.Path) {
                    inPage = false;
                    this._contentPageService.mode = this.widgetData.Path;
                }
                // if no active we need to select that particular interaction
                if (!inPage) {
                    const interaction = this.interactionList.filter((i) => i.interactionId === this.interaction.InteractionID)[0];
                    if (interaction && !interaction?.isActive) {
                        this.selectInteraction(interaction, true);
                    }
                }
            }, 500);
        }

        // play new chat sound
        this._appUIService.playAudio('new-chat', 0.5, false);
        this._appUIService.showDesktopAlert('Incoming Chat', 'You have a new incoming chat', false);

        this.replyInput = this.replyInputField.nativeElement;
        this.readyToReply();
    }

    /**
     * On Destroy
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
     * Register to events
     */
    private registerToEvents(): void {
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
                    'CCLDataEvent',
                    'AgentNotificaitonEvent'
                ],
                this.interaction.InteractionID
            )
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * To check agent features for One Way Video
     */
    private checkAgentFeatures(): void {
        // check the agent features to enable/disable
        SDKClient.getAgentData().featuresList.forEach((f) => {
            // get the featue
            const feature = f.Feature.toLowerCase();

            // switch the feature
            switch (feature) {
                case AGENT_FEATURES.IsAudioEscalateEnabled:
                    this.agentFeatures.audioEscalate = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsVideoEscalateEnabled:
                    this.agentFeatures.videoEscalate = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatSignatureEnabled:
                    this.agentFeatures.signature = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatWhiteboardEnabled:
                    this.agentFeatures.whiteboard = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatAttachmentsEnabled:
                    this.agentFeatures.attachments = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatEmojiEnabled:
                    this.agentFeatures.emoji = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsReplyOnChatEnabled:
                    this.agentFeatures.chatReply = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatConferenceEnabled:
                    this.agentFeatures.conference = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatTransferEnabled:
                    this.agentFeatures.transfer = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatTemplateEnabled:
                    this.agentFeatures.chatTemplate = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatReplyEnabled:
                    this.agentFeatures.reply = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatCommentEnabled:
                    this.agentFeatures.comment = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatHoldEnabled:
                    this.agentFeatures.hold = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsVideoSnapshotEnabled:
                    this.agentFeatures.snapshot = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatVoiceNoteEnabled:
                    this.agentFeatures.voicenote = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatScreenshareEnabled:
                    this.agentFeatures.screenshare = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatMediaDownloadEnabled:
                    this.agentFeatures.mediaDownload = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsToggleChatUserViewEnabled:
                    this.agentFeatures.toggleUserView = f.IsEnabled;
                    break;
                default:
            }
        });
    }

    /**
     * To proccess both TextChatMessageReceivedEvent and TextChatAgentMessageReceivedEvent
     * @param evt TextChatMessageReceivedEvent | TextChatAgentMessageReceivedEvent data
     */
    private chatMessageReceived(evt: TextChatMessageReceivedEvent | TextChatAgentMessageReceivedEvent): void {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
        //     return;
        // }

        // check the user
        const user = (evt as TextChatAgentMessageReceivedEvent).AgentName || this.customerName;

        // // check if app message
        if (evt.IsAppMessage) {
            const msg = JSON.parse(evt.Message);
            switch (msg.type?.toLowerCase()) {
                case 'clientreloaded':
                    this.callWidget?.destroy();
                    this._appUIService.showSnackbar('Client has refreshed their browser', 'warning');
            }
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

                    if (json.uploader === 'MediaStreamer') {
                        // do not modify use as is
                    } else {
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
            }
        } catch (error) {}

        // TODO:: sanitze the message
        //        add message badge if the chat window is not active
        //        time taken timer update
        //        check for hyperlinks

        const isAgent = user !== this.customerName && this.conferenceType === 'silent';

        // check for replied message
        let repliedMsg: ChatTranscripts;
        if (data.replyId) {
            const getTranscript = this.chatTranscripts.find((transcript) => transcript.messageId === data.replyId);
            repliedMsg = getTranscript && { ...getTranscript, repliedToMessage: null };
        }

        // add message to the transcripts
        this.pushToTranscript({
            who: user,
            isAgent: isAgent,
            position: user === this.customerName ? 'left' : 'right',
            messageId: data.messageId,
            message: data.message,
            type: data.attachment?.type || 'text',
            time: new Date(),
            attachment: {
                ...data.attachment,
                angle: 0
            },
            repliedToMessage: repliedMsg
        });

        let isActive = false;

        // check if the interaction is active, else count unread
        this.interactionList.forEach((item: InteractionRef) => {
            isActive = item.interactionId === this.interaction.InteractionID && item.isActive;
        });

        // in not active then increment the count
        if (!evt.RecoveryEvent && (!isActive || this._contentPageService.getCurrentMode() !== this.widgetData.Path)) {
            const currentInteraction = this.interactionList.filter((i) => i.interactionId === this.interaction.InteractionID)[0];
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
     * To process both TextChatMessageSentEvent and TextChatMessageTemplateSentEvent
     *
     * @param evt TextChatMessageSentEvent | TextChatMessageTemplateSentEvent data
     */
    private messageSentEvent(evt: TextChatMessageSentEvent | TextChatMessageTemplateSentEvent): void {
        try {
            let dividerMessage = false;
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

                // check for replied message
                let repliedMsg: ChatTranscripts;
                if (formattedMessage?.replyId) {
                    const getTranscript = this.chatTranscripts.find((transcript) => transcript.messageId === formattedMessage.replyId);
                    repliedMsg = getTranscript && { ...getTranscript, repliedToMessage: null };
                }

                // for template sent turn on freeze button
                if (evt.EventName === 'TextChatMessageTemplateSentEvent') {
                    dividerMessage = !(evt as any).UIEvent;
                    // show freeze auto response button
                    if (this.callWidget) {
                        this.freezeAutoResponse(true);
                    } else {
                        this.showAutoFreeze = !this.asyncChatRef.isAsync && true;
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
                    attachment: {
                        ...attachment,
                        angle: 0
                    },
                    dividerMessage,
                    repliedToMessage: repliedMsg
                });

                // set ready to reply
                this.readyToReply();
            } else {
                if (evt.MessageId) {
                    this.chatTranscripts.map((item) => {
                        if (item.messageId === evt.MessageId) {
                            if (evt.Result) {
                                item.messageToServer = null;
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
    private focusReplyInput(): void {
        setTimeout(() => {
            this.replyInput?.focus();
        });
    }

    /**
     * To check if the given string is a JSON
     * @param str Json string
     */
    private isValidJson(str: string): boolean {
        try {
            return typeof JSON.parse(str) === 'object';
        } catch (error) {}
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
        let templateId = template?.ID ?? '';
        const attachment = template?.Attachment ?? null;
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
            attachment: { ...attachment, angle: 0 },
            repliedToMessage: this.replyingToMessage
        };

        // check if reply feature/attachment is enabled or not social media
        if ((attachment || this.agentFeatures.chatReply) && !this.isSMM) {
            if (attachment) {
                // if the uploader is "MediaStreamer" then change the uploader
                if (this.fileUploadUrl.MediaStreamer) {
                    attachment.uploader = 'MediaStreamer';
                }
                // if the uploader is "MediaProxy" then remove the source
                // src should be generated by sessionId and fileName
                else if (this.fileUploadUrl.MediaProxy) {
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
                replyId: this.replyingToMessage?.messageId ?? '',
                templateId: template?.ID ?? '',
                attachment
            };
            // template Id is added to the json so clear it
            templateId = '';
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
            // do not send template id for SMM
            templateId = '';
        }
        this.replyingToMessage = null;

        this.sendTextChat(messageData, messageId, templateId);

        // Add the message to the chat
        this.pushToTranscript({
            ...message,
            messageToServer: {
                message: messageData,
                templateId
            }
        });

        // send done typing
        this.doneTyping();

        // Reset the reply form
        this.replyForm?.reset();

        // set ready to reply
        this.readyToReply();
    }

    /**
     * To call API to send message
     *
     * @param {String} message
     * @param {String} messageId
     * @param {String} templateId
     */
    private sendTextChat(message: string, messageId: string, templateId: string): void {
        // Update the server
        SDKClient.sendTextChat({
            interactionId: this.interaction.InteractionID.toString(),
            message,
            messageId,
            templateId,
            type: ''
        })
            .then((res) => {
                if (res.response > 0) {
                    // show freeze auto response button
                    if (this.callWidget || !this.agentFeatures.reply) {
                        this.freezeAutoResponse(true);
                    } else {
                        this.showAutoFreeze = !this.asyncChatRef.isAsync && true;
                    }
                } else {
                    this._appUIService.showSnackbar('Message send failed!', 'failure');
                    this.chatTranscripts.map((t) => {
                        if (t.messageId === messageId) {
                            t.status = 'failed';
                        }
                    });
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Message send error!', 'failure');
                this.chatTranscripts.map((t) => {
                    if (t.messageId === messageId) {
                        t.status = 'failed';
                    }
                });
            });
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
            type: 'tw-audio-video-controls',
            icon: param === 'audio' ? 'phone' : 'duo'
        };
        // create a call AOT widget
        const widget = new TwWidgetModel(widgetMode.title, widgetMode.type, widgetMode.icon) as AOTWidget<any, any>;

        widget.Config.Anchor = true;
        widget.Config.Position.W = param === 'audio' ? 600 : 800;
        widget.Config.Position.H = param === 'audio' ? 275 : 550;
        widget.Config.Actions = ['collapse', 'maximize', 'resize'];
        widget.Config.LocalAOT = true;

        try {
            // check if audio/video call widget config is overridden
            if (typeof this.widgetData.CallWidget === 'object') {
                if (param === 'audio') {
                    widget.Config = { ...widget.Config, ...this.widgetData.CallWidget?.Audio };
                } else {
                    widget.Config = { ...widget.Config, ...this.widgetData.CallWidget?.Video };
                }
            }
        } catch (error) {
            throwADError('TwCallControlsWidget.openCallWidget.CallWidget', error);
        }

        // check if the widget is disabled in overridden config
        if (!widget.Config.Enabled) {
            this._appUIService.showSnackbar(
                `${param === 'audio' ? 'Audio Call' : 'Video Call'} Widget is disabled, Please contact the administrator!`,
                'failure'
            );
            return;
        }

        widget.InteractionDetails = {
            NRIC: this.remoteUserConnectedEvent.NRIC,
            RegNo1: this.remoteUserConnectedEvent.RegNo1,
            InteractionID: this.data.InteractionDetails.InteractionID,
            ConferenceType: this.conferenceType,
            CustomerName: this.customerName,
            Direction: direction,
            SessionID: this.sessionID,
            CallType: param
        };

        widget.Data = { ...this.data.Data };
        widget.Data.Source = 'TwChatControlsComponent';
        widget.Data.AVEvent = avEvent;
        widget.Data.Opener = this;
        widget.destroy = () => this._aotWidgetService.destroyWidget(widget.ID, true);

        // open call widget
        this._aotWidgetService.addWidget(widget);
        // assign to the local variable
        this.callWidget = widget;
        // disable AV buttons
        this.disableAV = true;

        // update the interaction icon
        this._interactionManagerService.updateInteraction(this.data.InteractionDetails.InteractionID, {
            otherData: {
                icon: widget.Config.Icon
            }
        });
    }

    /**
     * To end the current chat interaction
     * @param reason Reson of chat end
     * @param btn [OPTIONAL] End button to disable/enable
     */
    private async endChat(reason: string, btn?: MatButton): Promise<void> {
        // show the progress bar
        this._fuseProgressBarService.show();
        // disable the button
        if (btn) {
            btn.disabled = true;
        }

        // check if there is any call going on, then end the call first
        if (this.callWidget) {
            await this.onEndChat();
        }

        try {
            await SDKClient.endTextChat(
                {
                    interactionId: this.interaction.InteractionID.toString(),
                    reason
                },
                null
            );

            // check to close interaction on end
            if (this.widgetData.CloseInteractionOnEnd) {
                this.closeInteraction(null);
            }
        } catch (error) {
            // enable if something goes wrong
            if (btn) {
                btn.disabled = false;
            }

            this._appUIService.showSnackbar('End chat failed!', 'failure');
        } finally {
            this._fuseProgressBarService.hide();
        }
    }

    async onEndChat(): Promise<boolean> {
        return true;
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
        } catch (error) {}
    }

    /**
     * Done typing
     */
    private doneTyping(): void {
        if (!this.userTyping) {
            return;
        }
        // set typing to false
        this.userTyping = false;
        // send typing state
        SDKClient.notifyTextChatTyping({
            interactionId: this.interaction.InteractionID.toString(),
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
        } catch (error) {}
    }

    /**
     * To check for conversation history and append to transcript
     *
     */
    private async checkForConversationHistory(): Promise<void> {
        if (!this.cif) {
            return;
        }
        // get the customer id
        const { response } = await TUtils.HttpClient.sendRequest<any>({
            urls: [
                this.conversationService.Url +
                    `user-conversations-timeline/${this.cif}?fromTime=0&toTime=${this.startTime.getTime()}&limit=${this.conversationService.Limit}`
            ],
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
                    who: res.sender_id === this.cif ? this.customerName : res.sender_id,
                    isAgent: res.sender_id !== this.cif,
                    position: res.sender_id === this.cif ? 'left' : 'right',
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
            interactionId: this.interaction.InteractionID.toString()
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
        if (transcript.message && !isStringHtml(transcript.message)) {
            transcript.message = urlify(transcript.message);
        }
        this.chatTranscripts.push(transcript);
    }

    /**
     * To close interaction
     *
     * @param btn
     */
    private async closeInteraction(btn: MatButton): Promise<void> {
        try {
            const { response } = await SDKClient.closeInteraction(this.interaction.InteractionID.toString(), null);
            // check the response
            if (response && response.ResultCode === 0) {
                this._appUIService.showSnackbar('Interaction closed successfully');
                // remove the interaction reference
                this._interactionManagerService.removeInteraction(response.InteractionID);
            } else {
                // enable if something goes wrong
                if (btn) {
                    btn.disabled = false;
                }
                this._appUIService.showSnackbar('Close interaction failed', 'failure');
            }
        } catch (error) {
            // enable if something goes wrong
            if (btn) {
                btn.disabled = false;
            }
            this._appUIService.showSnackbar('Close interaction error', 'failure');
        } finally {
            // hide the progress bar
            this._fuseProgressBarService.hide();
        }
    }

    /**
     * To check for interaction history for async chat
     * @param {'push' | 'unshift'} push
     */
    private async checkForAsyncChatHistory(type: 'push' | 'unshift'): Promise<void> {
        try {
            // get chat interaction history
            let { response } = await SDKClient.getChatInteractionHistory({
                cif: '',
                firstId: this.asyncChatRef.firstId,
                groupId: this.asyncChatRef.caseId,
                lastId: this.asyncChatRef.lastId,
                limit: this.asyncChatRef.limit
            });

            if (type === 'push') {
                response = response.reverse();
            }

            response.forEach((res) => {
                this.chatTranscripts[type]({
                    who: res.Sender === this.cif ? this.customerName : res.Sender,
                    isAgent: res.Sender !== this.cif,
                    position: res.Sender === this.cif ? 'left' : 'right',
                    messageId: res.MessageId,
                    message: res.Message,
                    type: 'text',
                    time: new Date(res.DateTime),
                    attachment: null,
                    dividerMessage: res.ItemType > 2
                });

                this.asyncChatRef.firstId = res.FirstId;
                this.asyncChatRef.lastId = res.LastId;
            });

            // set ready to reply
            this.readyToReply();
        } catch (error) {}
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To process TextChatRemoteUserConnectedEvent
     * @param evt TextChatRemoteUserConnectedEvent evt
     */
    async TextChatRemoteUserConnectedEvent(evt: TextChatRemoteUserConnectedEvent): Promise<void> {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
        //     return;
        // }

        // add connected event ref
        this.remoteUserConnectedEvent = evt;

        // subscribe to the timer
        timer(1000, 1000)
            .pipe(takeUntil(this.unsubscribeAll), takeUntil(this.stopTimer))
            .subscribe((val) => {
                this.duration = (val + 1) * 1000;
            });

        this.status = 'connected';
        // get the customer name
        this.customerName = evt.ScreenName || 'Customer';
        // get the customer CIF
        this.cif = evt.CIF;
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
        this.chatMode = evt.ChatMode as any;
        // to not open video dialog when interaction is over
        if (!evt.RecoveryEvent && this.mediaChannels.includes(this.chatMode)) {
            this.escalateToAV(this.chatMode as any);
        }

        // check for bot history
        this.processBotHistory(evt.ChatHistoryData);

        // check if conversation history is configured
        if (this.conversationService.Url) {
            // check for conversation history
            this.checkForConversationHistory();
        }

        if (this.asyncChatRef.isAsync) {
            // check for async chat history
            this.checkForAsyncChatHistory('unshift');
        }

        // hold the interaction if connected and not active yet
        if (!evt.RecoveryEvent) {
            setTimeout(
                (x: TextChatRemoteUserConnectedEvent) => {
                    const interaction = this.interactionList.find((f) => f.interactionId === x.InteractionID);
                    if (!interaction.isActive) {
                        this.holdInteraction();
                    }
                },
                0,
                evt
            );
        }
    }

    /**
     * To process TextChatSelfServiceDestinationEvent
     * @param evt TextChatSelfServiceDestinationEvent evt
     */
    TextChatSelfServiceDestinationEvent(evt: TextChatSelfServiceDestinationEvent): void {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
        //     return;
        // }

        this.selfServiceDestinations = evt.Destinations || [];
    }

    /**
     * To process TextChatAgentConnectedEvent
     * @param evt TextChatAgentConnectedEvent evt
     */
    TextChatAgentConnectedEvent(evt: TextChatAgentConnectedEvent): void {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
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
        } catch (error) {}

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
    TextChatTranscriptForTransferEvent(evt: TextChatTranscriptForTransferEvent): void {
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

                // check for attachments
                const attachment = formattedMessage && formattedMessage.attachment ? formattedMessage.attachment : null;

                // check for replied message
                let repliedMsg: ChatTranscripts;
                if (formattedMessage?.replyId) {
                    const getTranscript = this.chatTranscripts.find((transcript) => transcript.messageId === formattedMessage.replyId);
                    repliedMsg = getTranscript && { ...getTranscript, repliedToMessage: null };
                }

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
                        attachment: {
                            ...attachment,
                            angle: 0
                        },
                        repliedToMessage: repliedMsg
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
    TextChatMessageSentEvent(evt: TextChatMessageSentEvent): void {
        this.messageSentEvent(evt);
    }

    /**
     * To process TextChatMessageTemplateSentEvent
     *
     * @param evt TextChatMessageTemplateSentEvent evt
     */
    TextChatMessageTemplateSentEvent(evt: TextChatMessageTemplateSentEvent): void {
        this.messageSentEvent(evt);
    }

    /**
     * To process TextChatUserMessageWaitTimerEvent
     *
     * @param evt TextChatUserMessageWaitTimerEvent evt
     */
    TextChatUserMessageWaitTimerEvent(evt: TextChatUserMessageWaitTimerEvent): void {
        // check the interaction and the interaction status
        // if (evt.InteractionID !== this.interaction.InteractionID || this.status !== 'connected') {
        //     return;
        // }

        if (this.status !== 'connected') {
            return;
        }

        // show freeze auto response button
        this.showAutoFreeze = !this.asyncChatRef.isAsync && true;

        // get the message template to be sent to customer
        this.sendMessage({
            Text: evt.AutoResponseTemplate,
            ID: evt.AutoResponseTemplateId
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
    TextChatTypingStateChangedEvent(evt: TextChatTypingStateChangedEvent): void {
        let user = 'User';
        const status = evt.Status; // 0=start, 1=stop

        if (evt.User === '0') {
            // customer typing
            user = this.customerName;
        } else {
            // other agent typing
            const confAgent = this.conferenceAgentList.filter((c) => c.AgentId === evt.User)[0];
            user = confAgent?.AgentName ?? 'User';
        }

        // in a conference scenario  check if any user stopped typing
        // then verify if the same user is currently typing then only indicate as stop typing
        if (status === 1 && this.remoteTyping?.name !== user) {
            return;
        }

        this.remoteTyping = {
            name: user,
            typing: status === 0
        };
    }

    /**
     * To process TextChatMessageReceivedEvent
     * @param evt TextChatMessageReceivedEvent evt
     */
    TextChatMessageReceivedEvent(evt: TextChatMessageReceivedEvent): void {
        this.chatMessageReceived(evt);
    }

    /**
     * To process TextChatAgentMessageReceivedEvent
     * @param evt TextChatAgentMessageReceivedEvent evt
     */
    TextChatAgentMessageReceivedEvent(evt: TextChatAgentMessageReceivedEvent): void {
        this.chatMessageReceived(evt);
    }

    /**
     * To handles ActionMessageReceivedEvent
     * @param evt ActionMessageReceivedEvent evt
     */
    ActionMessageReceivedEvent(evt: ActionMessageReceivedEvent): void {
        try {
            const msg = JSON.parse(evt.Message);
            let message = '';
            let status: SnackbarStateTypes = 'success';
            switch (msg.type.toLowerCase()) {
                case 'webrtctroubleshoot':
                    if (msg.status === 'accepted') {
                        message = 'Webrtc troubleshoot request is accepted by customer';
                    } else if (msg.status === 'ack') {
                        message = 'Webrtc troubleshoot request is received by customer';
                        status = 'loading';
                    } else {
                        message = 'Webrtc troubleshoot request is rejected by customer';
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
                                .pipe(takeUntil(this.unsubscribeAll), delay(this.widgetData.Snapshot.RemoteResponseTimeout * 1000 || 10000))
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
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * To handle InteractionDataEvent
     */
    InteractionDataEvent(evt: InteractionDataEvent): void {
        // check the channel
        if (evt.Channel !== 'TextChat') {
            return;
        }
        // check if interaction comments available
        if (evt.InteractionComments && evt.InteractionComments.length > 0) {
            this.commentsAdded = true;
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
    CallHoldEvent(evt: CallHoldEvent): void {
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
    CallHoldReconnectEvent(evt: CallHoldReconnectEvent): void {
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
    HoldTimerEvent(evt: HoldTimerEvent): void {
        this._appUIService.showAppSnackbar({
            message: `Interaction ${this.interaction.InteractionID} with [${this.customerName}] and Session ID [${this.sessionID}] is on hold for ${evt.HoldTimeString}`,
            state: evt.ColorCode,
            onClick: () => {
                const interaction = this.interactionList.filter((i) => i.interactionId === evt.InteractionID)[0];
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
    CCLDataEvent(evt: CCLDataEvent): void {
        // check if customer name available
        if (evt.CallerName) {
            this.customerName = evt.CallerName;
            // update the interaction status and user
            this._interactionManagerService.updateInteraction(evt.InteractionID, {
                user: this.customerName
            });
        }
    }

    /**
     * To process AVControlMessageReceivedEvent
     * @param {AVControlMessageReceivedEvent} evt AVControlMessageReceivedEvent data
     */
    AVControlMessageReceivedEvent(evt: AVControlMessageReceivedEvent): void {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
        //     return;
        // }

        // check if its a av request
        if (evt.Type === 'requestav') {
            // check the type
            const type = JSON.parse(evt.Message).param;
            // open the call widget
            this.openCallWidget(type, 'in', evt);
        }
    }

    /**
     * To process TextChatDisconnectedEvent
     * @param evt TextChatDisconnectedEvent data
     */
    TextChatDisconnectedEvent(evt: TextChatDisconnectedEvent): void {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
        //     return;
        // }

        this.status = 'disconnected';
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'disconnected'
        });
        // stop the duration timer
        this.stopTimer.next(null);
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
    TextChatAgentDisconnectedEvent(evt: TextChatAgentDisconnectedEvent): void {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
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
    CannedResposeEvent(evt: CustomSDKEvent): void {
        // check the interaction
        // if (evt.InteractionID !== this.interaction.InteractionID) {
        //     return;
        // }

        // send the selected template
        this.sendMessage({ ...evt.Data.Template, Type: '' });
    }

    /**
     * To process custom TextChatTransferSuccessEvent
     *
     * @param {TextChatTransferSuccessEvent} evt
     */
    TextChatTransferSuccessEvent(evt: TextChatTransferSuccessEvent): void {
        // Rahil close AV call here via opener
        this.transferConfDialogRef?.close();
    }

    /**
     * To process custom TextChatTransferFailedEvent
     *
     * @param {TextChatTransferFailedEvent} evt
     */
    TextChatTransferFailedEvent(evt: TextChatTransferFailedEvent): void {
        this.transferConfDialogRef?.close();
        this._appUIService.showSnackbar(`${evt.ResultMessage}`, 'failure');
    }

    /**
     * To process custom TextChatTransferRejectEvent
     *
     * @param {TextChatTransferRejectEvent} evt
     */
    TextChatTransferRejectEvent(evt: TextChatTransferRejectEvent): void {
        const otherData = JSON.parse(evt.Data);
        this._appUIService.showSnackbar(
            `${evt.FromAgentName} has rejected your ${otherData.type === 'conf' ? 'conference' : 'transfer'} request ${
                evt.Comment !== '' ? ' with comment: ' + evt.Comment : ''
            }`,
            'failure'
        );
    }

    /**
     * To process AgentNotificaitonEvent
     *
     * @param {AgentNotificaitonEvent} evt
     */
    async AgentNotificaitonEvent(evt: AgentNotificaitonEvent): Promise<void> {
        // check the type
        if (evt.Type === 'AsyncChatMessage') {
            // get from event
            // this.chatTranscripts.push({
            //     who: this.customerName,
            //     isAgent: false,
            //     position: 'left',
            //     messageId: evt.EventId,
            //     message: evt.Message,
            //     type: 'text',
            //     time: new Date(evt.CreatedTime)
            // });

            // get the case id from json datas
            const caseId = JSON.parse(evt.JsonData).caseId;
            if (caseId) {
                this.asyncChatRef.caseId = caseId;
            }

            // fetch after 2s to make sure the data is available
            setTimeout(() => {
                // get chat interaction history
                this.checkForAsyncChatHistory('push');
            }, 1000);
        }
    }

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
        if (!force && this.interaction.InteractionID === item.interactionId) {
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
    public confirmCloseInteraction(btn: MatButton): void {
        // confirm close interaction
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        this.confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // send end chat to server
                // show the progress bar
                this._fuseProgressBarService.show();
                // disable the button
                btn.disabled = true;
                this.closeInteraction(btn);
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
        SDKClient.freezeTextChatAutoResponse(this.interaction.InteractionID.toString())
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
        SDKClient.answerCall(this.interaction.InteractionID.toString())
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
        let otherData = null;
        if (previewData.attachment.type === 'image') {
            otherData = {
                scale: 1
            };
        }

        this.previewMediaDialogData = {
            user: previewData.who,
            timestamp: previewData.time,
            attachment: previewData.attachment,

            otherData
        };

        this.previewMediaDialogRef = this._matDialog.open(this.previewMediaDialog, {
            panelClass: 'preview-media-dialog'
        });
    }

    /**
     * To dispose call widget
     */
    public disposeCallWidget(): void {
        // update the interaction icon
        this._interactionManagerService.updateInteraction(this.data.InteractionDetails.InteractionID, {
            otherData: {
                icon: this.isSMM ? 'custom-' + this.channel : 'chat'
            }
        });

        setTimeout(() => {
            // dispose the call widget
            this.callWidget = undefined;
            // enable AV buttons
            this.disableAV = false;
        });
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
                    interactionId: this.interaction.InteractionID.toString(),
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
                 <div class="text-primary mat-body-2">${item.Message.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                 <span class="time muted-text mat-body-1">${item.User}</span>,
                 <span class="time muted-text mat-body-1">${format(new Date(item.Time), 'dd/MM/yyyy hh:mm:ss a')}</span>
                 <br />
                 <br />
                 `;
        });
        message += 'Add new comment:';

        const dialogRef = this._appUIService.showCustomDialog(
            'prompt',
            message,
            'Interaction Comments',
            { minRows: 4 },
            {
                minWidth: '30%',
                maxWidth: '30%'
            }
        );
        dialogRef.afterClosed().subscribe((resp1) => {
            if (resp1) {
                this._fuseProgressBarService.show();
                SDKClient.saveInteractionComment({
                    comment: resp1,
                    interactionId: this.interaction.InteractionID.toString()
                })
                    .then((resp2) => {
                        if (resp2.response > 0) {
                            // add comments to the reference
                            this.savedComments.push({
                                Message: resp1,
                                Time: new Date(),
                                User: this.user.agentName
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
            agent: this.widgetData.Transfer?.Agent ?? null,
            skill: this.widgetData.Transfer?.Skill ?? null
        };

        const conferenceConfig = {
            agent: this.widgetData.Conference?.Agent ?? null,
            skill: this.widgetData.Conference?.Skill ?? null
        };

        // get data based on type
        let data: AgentSkillListData =
            type === 'transfer'
                ? {
                      title: 'Transfer Chat',
                      type: 'transferChat',
                      agent: {
                          allowed: transferConfig?.agent?.Allowed,
                          consult: transferConfig?.agent?.Consult,
                          blind: transferConfig?.agent?.Blind,
                          comments: transferConfig?.agent?.Comments,
                          source: transferConfig?.agent?.Source,
                          allowedStates: transferConfig?.agent?.AllowedStates,
                          columns: transferConfig?.agent?.Columns,
                          teamFilter: transferConfig?.agent?.TeamFilter
                      },
                      skill: {
                          allowed: transferConfig?.skill?.Allowed,
                          consult: transferConfig?.skill?.Consult,
                          blind: transferConfig?.skill?.Blind,
                          comments: transferConfig?.skill?.Comments,
                          source: transferConfig?.skill?.Source,
                          channelPrfix: transferConfig?.skill?.ChannelPrefix,
                          columns: transferConfig?.skill?.Columns
                      }
                  }
                : {
                      title: 'Conference Chat',
                      type: 'conferenceChat',
                      agent: {
                          allowed: conferenceConfig?.agent?.Allowed,
                          consult: conferenceConfig?.agent?.Consult,
                          blind: conferenceConfig?.agent?.Blind,
                          comments: conferenceConfig?.agent?.Comments,
                          source: conferenceConfig?.agent?.Source,
                          allowedStates: conferenceConfig?.agent?.AllowedStates,
                          columns: conferenceConfig?.agent?.Columns,
                          teamFilter: conferenceConfig?.agent?.TeamFilter
                      },
                      skill: {
                          allowed: conferenceConfig?.skill?.Allowed,
                          consult: conferenceConfig?.skill?.Consult,
                          blind: conferenceConfig?.skill?.Blind,
                          comments: conferenceConfig?.skill?.Comments,
                          source: conferenceConfig?.skill?.Source,
                          channelPrfix: conferenceConfig?.skill?.ChannelPrefix,
                          columns: conferenceConfig?.skill?.Columns
                      }
                  };

        // add common properties
        data = {
            interactionId: this.interaction.InteractionID,
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
                ...data.otherData
            };
            data.dynamicLists = [
                {
                    label: 'Bot Conference',
                    placeholder: 'Destination',
                    data: this.selfServiceDestinations,
                    columns: ['Name', 'Value'],
                    selection: 'Value',
                    consult: true,
                    blind: false,
                    comments: false
                }
            ];
        }

        data.callback = (callbackData) => {
            // check the source
            if (callbackData.source === 'Bot Conference') {
                this.conferenceWithBot(callbackData.selectedRow.Value);
            }
        };

        // open agent skill list component in dialog
        this.transferConfDialogRef = this._matDialog.open(AgentSkillListComponent, {
            data,
            panelClass: ['agent-skill-dialog', 'twd-w-11/12', 'twd-h-10/12', 'lg:twd-w-7/12', 'lg:twd-h-8/12', 'xl:twd-w-6/12', '2xl:twd-w-5/12'],
            minWidth: '30%',
            maxWidth: '100%',
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
            contentType: item.contentType,
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
            interactionId: this.interaction.InteractionID.toString(),
            message: JSON.stringify({
                source: 'agent',
                options: {},
                data: {
                    interactionId: this.interaction.InteractionID.toString()
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
        if (this.agentFeatures.chatTemplate) {
            // check for text templates
            if (event.target.value) {
                const match = event.target.value.split(' ').pop().trim().toLowerCase();
                if (match) {
                    if (this.widgetData.ChatTemplate.Filter.toLowerCase() === 'contains') {
                        this.textTemplates.filtered = this.textTemplates.data.filter((f) => f.Name.toLowerCase().includes(match));
                    } else if (this.widgetData.ChatTemplate.Filter.toLowerCase() === 'endswith') {
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
                interactionId: this.interaction.InteractionID.toString(),
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
        this.focusReplyInput();
    }

    /**
     * Opens a whiteboard session
     */
    async openWhiteboard(): Promise<void> {
        if (!this.widgetData.Whiteboard?.Url) {
            this._appUIService.showSnackbar('No Whiteboard Url provided in Config', 'failure');
            return;
        }
        try {
            const snackRef = this._appUIService.showSnackbar('Opening whiteboard', 'loading');
            const res = await SDKClient.sendActionMessage({
                interactionId: this.interaction.InteractionID as any,
                message: JSON.stringify({
                    source: 'agent',
                    options: {},
                    data: {
                        url: `${this.widgetData.Whiteboard.Url}?sessionid=${this.sessionID}`
                    },
                    status: 'request',
                    type: 'openWhiteboard',
                    eventName: 'ActionMessage',
                    id: TUtils.Generic.uuid()
                })
            });
            if (res.response?.ResultMessage === 'Success') {
                const widget = new TwWidgetModel('Whiteboard', 'tw-custom', 'create') as AOTWidget;
                widget.Config.Actions = ['collapse', 'maximize', 'destroy'];
                widget.Config.ViewState = 'maximize';
                widget.Config.Anchor = true;
                widget.Config.Position.W = 800;
                widget.Config.Position.H = 550;
                widget.Data = {
                    AutoOpen: false,
                    Url: `${this.widgetData.Whiteboard.Url}?sessionid=${this.sessionID}`
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
            if (this.interaction.InteractionID) {
                this.interactionOnHold.loading = true;
                const res = await SDKClient.holdCall(this.interaction.InteractionID.toString());

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
    };

    /**
     * Unholds interaction
     */
    unHoldInteraction = async (): Promise<void> => {
        try {
            this._fuseProgressBarService.show();
            if (this.interaction.InteractionID) {
                this.interactionOnHold.loading = true;
                const res = await SDKClient.unHoldCall(this.interaction.InteractionID.toString());

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
    };

    /**
     * To resend failed message
     *
     * @param messageId
     */
    resendMessage(messageId: string): void {
        // get the message by messageId
        const transcript = this.chatTranscripts.filter((c) => c.messageId === messageId);
        if (transcript.length) {
            const messageToServer = transcript[0].messageToServer;
            transcript[0].status = 'init';
            this.sendTextChat(messageToServer.message, messageId, messageToServer.templateId);
        }
    }

    /**
     * To rotate an image
     * @param attachment
     */
    rotateImage(attachment: any): void {
        attachment.angle++;
        if (attachment.angle === 4) {
            attachment.angle = 0;
        }
    }

    /**
     * To download an attachment
     * @param src
     */
    downloadAttachment(src: string): void {
        if (src) {
            window.open(src);
        }
    }

    /**
     * To zoom in or zoom out
     */
    zoomInOut(zoomIn: boolean): void {
        if (zoomIn) {
            this.previewMediaDialogData.otherData.scale += 0.25;
        } else {
            this.previewMediaDialogData.otherData.scale -= 0.25;
        }
    }
}
