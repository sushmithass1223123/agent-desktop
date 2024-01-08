import { InteractionWidget } from '..';

/**
 * Audio-Video widget handles the AV communication in AD.
 *
 * This widget can be standalone with limited features.
 */

/**
 * Audio-Video widget handles the AV communication in AD.
 *
 * This widget can be standalone with limited features.
 * The config example for standalone widget:
 * ```json
 * {
 *     "Name": "Chat Controls",
 *     "Description": "",
 *     "Type": "tw-audio-video-controls",
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
 *         "ScreenShareAllowed": true,
 *         "HoldInteractionAllowed": true,
 *         "Snapshot": { "Allowed": true, "Source": "remote", "RemoteResponseTimeout": 10 },
 *         "WebRTCTest": {
 *             "Allowed": true,
 *             "Url": "https://mx.tetherfi.cloud/testrtc/index.html?turnURI=turn%3Amx.tetherfi.cloud%3A3585&turnUsername=tetherfi&turnCredential=nuwan",
 *             "Customer": true
 *         },
 *         "EndInteractionOnAVEnd": false,
 *         "MuteAVOnHold": {
 *             "AgentAudio": true,
 *             "AgentVideo": true,
 *             "CustomerAudio": true,
 *             "CustomerVideo": false
 *         },
 *         "ToggleUserViewAllowed": true,
 *         "Source": "TwChatControlsComponent"
 *     }
 * }
 * ```
 */
export interface TwAudioVideoControls<T = any> extends InteractionWidget<TwAudioVideoControlsData, T> {}

export type TwAudioVideoControlsData = {
    /**
     * [STANDALONE] Flag to end interaaction on AV end
     */
    EndInteractionOnAVEnd: boolean;
    /**
     * [STANDALONE] WebRTC test ref
     */
    WebRTCTest: {
        /**
         * Flag to allow WebRTC test
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
     * [STANDALONE] Snapshot ref
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
         * If 'Source' is remote, the timeout for snapshot retrieval
         */
        RemoteResponseTimeout: 10;
        /**
         * If 'Source' is remote, the timeout for the request
         */
        RemoteRequestTimeout: 10;
    };
    /**
     * [STANDALONE] Flag to mute agent/customer audio/video on interaction hold
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
     * [INTERNAL] Source components from where this widget can be opened.
     */
    Source: 'TwChatControlsComponent' | 'InstantMessagingComponent';
    /**
     * [INTERNAL] Send messsge function from opener
     */
    SendMessage?: () => {};
    /**
     * [INTERNAL] Flag to end call from opener
     */
    EndCall?: () => void;
    /**
     * To auto start the call if the value is provided
     *
     * [INTERNAL] Used when opened as AOT from tw-chat-controls-widget
     */
    CallType?: 'audio' | 'video';
    /**
     * To identify the direction of call
     *
     * [INTERNAL] Used when opened as AOT from tw-chat-controls-widget
     */
    Direction?: 'in' | 'out';
    /**
     * [STANDALONE] Flag to hold interaction
     */
    HoldInteractionAllowed: boolean;
    /**
     * [STANDALONE] Flag to allow screenshare
     */
    ScreenShareAllowed: boolean;
    /**
     * [STANDALONE] Flag to toggle user view
     */
    ToggleUserViewAllowed: boolean;
    /**
     * [STANDALONE] To hide audio mute button or not
     */
    MuteAudioHidden: boolean;
};
