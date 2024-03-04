import { InteractionWidget, WidgetConfig } from '..';
import { AgentSkillConfig } from '../components/agent-skill-list.interface';

/**
 * Snapshot config
 * This feature is shown on Audio Video Controls Widget
 */
export type TwChatControlsSnapshot = {
    /**
     * Flag to enable button to acquire snapshot.
     */
    Allowed: boolean;
    /**
     * Whether the snapshot is to be taken from the streaming customer video or from the customer's device and sent to the agent
     */
    Source: 'remote' | 'local';
    /**
     * Timout for remote source
     */
    RemoteResponseTimeout: number;
};

/**
 * Conversation Service Configs
 */
export type TwChatControlsConversationService = {
    /**
     * Conversation Service URL.
     * This feature is enabled only when URL is present.
     */
    Url: string;
    /**
     * Limit of transccripts to be received from the Conversation API
     */
    Limit: number;
};

/**
 * WebRTC test config
 * This feature is shown on Audio Video Controls Widget
 */
export type TwChatControlsWebRTCTest = {
    /**
     * Flag to enable the button for WebRTC test.
     */
    Allowed: boolean;
    /**
     * WebRTC test page URL
     */
    Url: string;
    /**
     * Flag to send the test URL to customer
     */
    Customer: boolean;
};

/**
 * Chat controls template config
 */
export type TwChatControlsChatTemplate = {
    /**
     * Flag to enable chat template suggestions
     */
    Allowed: boolean;
    /**
     * Type of filter applied to display the template suggestions
     * @default "startswith"
     */
    Filter: 'contains' | 'startswith' | 'endswith';
    /**
     * Flag to enable the filtering for the templates by current time
     */
    FilterByTime: boolean;
};

/**
 * Whiteboard config
 */
export type TwChatControlsWhiteboard = {
    /**
     * Flag to enable the button for whiteboard
     */
    Allowed: boolean;
    /**
     * Whiteboard page URL
     */
    Url: string;
    /*
     *  Whiteboard url for customer
     */
    CustomerUrl: string;
    /*
     *  socialmediachannels
     */
    socialChannels:string [];
};

/**
 * Chat controls widget is the primary widget used during a chat interaction. Some of the available features are:
 * - Answer, Transfer, Conference calls
 * - Add interaction comments
 * - AV escalation and Customer Snapshot retrieval
 * - Whiteboard and attachments
 * - Chat templates
 * The config example:
 * ```json
 * {
 *     "Name": "Chat Controls",
 *     "Description": "",
 *     "Type": "tw-chat-controls",
 *     "Config": {
 *         "Enabled": true,
 *         "Hidden": false,
 *         "Static": false,
 *         "Anchor": true,
 *         "AOT": false,
 *         "AutoOpen": false,
 *         "Icon": "chat",
 *         "Class": "",
 *         "Position": { "X": 2, "Y": 1 },
 *         "Actions": ["maximize", "collapse", "float"],
 *         "ViewState": "restore",
 *         "Header": true,
 *         "Pinned": false
 *     },
 *     "Data": {
 *         "Transfer": {
 *             "Allowed": true,
 *             "Agent": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": true,
 *                 "Comments": true,
 *                 "Source": { "Use": "agentId", "Display": "agentName", "FreeTextAllowed": false },
 *                 "AllowedStates": [],
 *                 "TeamFilter": false,
 *                 "Columns": []
 *             },
 *             "Skill": {
 *                 "Allowed": true,
 *                 "Consult": false,
 *                 "Blind": true,
 *                 "Comments": true,
 *                 "Source": { "Use": "vdn", "Display": "skill", "FreeTextAllowed": false },
 *                 "ChannelPrefix": [],
 *                 "Columns": []
 *             }
 *         },
 *         "Conference": {
 *             "Allowed": true,
 *             "Agent": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": false,
 *                 "Comments": true,
 *                 "Source": { "Use": "agentId", "Display": "agentName", "FreeTextAllowed": false },
 *                 "AllowedStates": [],
 *                 "TeamFilter": false,
 *                 "Columns": []
 *             },
 *             "Skill": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": false,
 *                 "Comments": true,
 *                 "Source": { "Use": "vdn", "Display": "skill", "FreeTextAllowed": false },
 *                 "ChannelPrefix": ["CH"],
 *                 "Columns": []
 *             }
 *         },
 *         "AudioEscalateAllowed": true,
 *         "VideoEscalateAllowed": true,
 *         "SignatureAllowed": true,
 *         "EmojiAllowed": true,
 *         "ReplyOnChatAllowed": true,
 *         "VoiceNoteAllowed": false,
 *         "AttachmentAllowed": true,
 *         "ScreenShareAllowed": true,
 *         "InteractionCommentAllowed": true,
 *         "HoldInteractionAllowed": true,
 *         "Whiteboard": { "Allowed": true, "Url": "https://dice.tetherfi.cloud/Whiteboard/ui/index.html" },
 *         "Snapshot": { "Allowed": true, "Source": "remote", "RemoteResponseTimeout": 10 },
 *         "ShowUserLabel": false,
 *         "ChatTemplate": { "Allowed": true, "Filter": "startswith", "FilterByTime": false },
 *         "WebRTCTest": {
 *             "Allowed": true,
 *             "Url": "https://mx.tetherfi.cloud/testrtc/index.html?turnURI=turn%3Amx.tetherfi.cloud%3A3585&turnUsername=tetherfi&turnCredential=nuwan",
 *             "Customer": true
 *         },
 *         "ConversationService": { "Url": "", "Limit": 50, "Label": false },
 *         "ReplyAllowed": true,
 *         "EndInteractionOnAVEnd": false,
 *         "CloseInteractionOnEnd": false,
 *         "MuteAVOnHold": {
 *             "AgentAudio": true,
 *             "AgentVideo": true,
 *             "CustomerAudio": true,
 *             "CustomerVideo": false
 *         },
 *         "ToggleUserViewAllowed": true
 *     }
 * }
 * ```
 */
export interface TwChatControls<T> extends InteractionWidget<TwChatControlsData, T> {}

/**
 * Chat control config's Data
 */
export type TwChatControlsData = {
    /**
     * Transfer configurations
     */
    Transfer: AgentSkillConfig;
    /**
     * Conference ref
     */
    Conference: AgentSkillConfig;
    /**
     * Flag to allow esacalation to audio
     */
    AudioEscalateAllowed: boolean;
    /**
     * Flag to allow audio call request
     */
    RequestAudioCallAllowed: boolean;
    /**
     * Flag to allow esacalation to video
     */
    VideoEscalateAllowed: boolean;
    /**
     * Flag to allow video call request
     */
    RequestVideoCallAllowed: boolean;
    /**
     * Flag to enable signature
     */
    SignatureAllowed: boolean;
    /**
     * Flag to enable emoji while replying
     */
    EmojiAllowed: boolean;
    /**
     * Flag to allow reply to a chat
     */
    ReplyOnChatAllowed: boolean;
    /**
     * To allow reply to a chat at SMM channel level
     */
    ReplyOnSMM: TReplyOnSMM;
    /**
     * Flag to allow voice note
     */
    VoiceNoteAllowed: boolean;
    /**
     * Flag to allow attachment
     */
    AttachmentAllowed: boolean;
    /**
     * Flag to allow screenshare
     */
    ScreenShareAllowed: boolean;
    /**
     * Flag to allow interaction comment
     */
    InteractionCommentAllowed: boolean;
    /**
     * Flag to hold interaction
     */
    HoldInteractionAllowed: boolean;

    /**
     * Hides audio mute button
     */
    MuteAudioHidden: boolean;

    /**
     * Whiteboard reference
     */
    Whiteboard: {
        /**
         * Flag to enable whiteboard
         */
        Allowed: boolean;
        /**
         * Whiteboard url
         */
        Url: string;
        /*
         *  Whiteboard url for customer
         */
        CustomerUrl: string;
    };
    /**
     * Cobrowse reference
     */
    Cobrowse: {
        /**
         * Flag to enable cobrowse
         */
        Allowed: boolean;
        /**
         * Agent url
         */
        AgentUrl: string;
        /*
         *  cobrowse url for customer
         */
        CustomerUrls: { [name: string]: string }[];
    };
    /**
     * Snapshot ref
     */
    Snapshot: {
        /**
         * Flag to allow snapshot
         */
        Allowed: boolean;
        /**
         * Source of snapshot
         */
        Source: 'local' | 'remote';
        /**
         * If 'Source' is remote the timeout for that
         */
        RemoteResponseTimeout: 10;
    };
    /**
     * Flag to show user lable on chat box
     */
    ShowUserLabel: boolean;
    /**
     * Chat template ref
     */
    ChatTemplate: {
        /**
         * Flag to allow chat template filtering
         */
        Allowed: boolean;
        /**
         * Filter types for chat templates
         */
        Filter: 'statsWith' | 'contails' | 'endsWith';
        /**
         * Flag to allow filter by time
         */
        FilterByTime: boolean;
    };
    /**
     * WebRTC test ref
     */
    WebRTCTest: {
        /**
         *  Flag to enable WebRTC test
         */
        Allowed: boolean;
        /**
         * Test url
         */
        Url: string;
        /**
         * FLag to send to customer
         */
        Customer: boolean;
    };
    /**
     * Conversation service ref
     */
    ConversationService: {
        /**
         * Conversation service url
         */
        Url: string;
        /**
         * Data limit
         */
        Limit: number;
    };
    /**
     * Flag to enable reply for the interaction
     */
    ReplyAllowed: boolean;
    /**
     * Flag to end interaaction on AV end
     */
    EndInteractionOnAVEnd: boolean;
    /**
     * Flag to close interaction on chat end
     */
    CloseInteractionOnEnd: boolean;
    /**
     * Flag to mute agent/customer audio/video on interaction hold
     */
    MuteAVOnHold: {
        /**
         * Flag to mute agent audio
         */
        AgentAudio: boolean;
        /**
         * Flag to mute agent video
         */
        AgentVideo: boolean;
        /**
         * Flag to mute customer audio
         */
        CustomerAudio: boolean;
        /**
         * Flag to mute customer video
         */
        CustomerVideo: boolean;
    };
    /**
     * Call widget config.
     * This is used to override audio-video controls widget config.
     */
    CallWidget: {
        /**
         * Audio call widget config
         */
        Audio: Partial<WidgetConfig>;
        /**
         * Video call widget config
         */
        Video: Partial<WidgetConfig>;
    };
    /**
     * Flag to toggle user view
     */
    ToggleUserViewAllowed: boolean;
};

export type TReplyOnSMM = {
    channels: string;
};
