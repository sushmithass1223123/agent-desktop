import { IConfig, ILogging, IProxy, ISignalRProxy } from '@tmac/sdk';
import { LoginConfig } from './login.interface';
import { Main } from './main.interface';

/**
 * Agent Desktop's config
 */
export interface AppRootConfig {
    /**
     * Login Page Config
     */
    Login: LoginConfig;
    /**
     * Main Page config
     */
    Main: Main;
    /**
     * General application config
     */
    AppConfigs: AppConfigs;
    /**
     * Versoin of AD
     */
    Version: string;
    /**
     * ONLY FOR PRODUCTION BUILDS
     * Proxy URl
     */
    ProxyUrl?: string[];
    /**
     * ONLY FOR PRODUCTION BUILDS
     * Config mode used to define the source of the config
     * - local: uses the development.json hosted with AD
     * - remote: uses the default.json defined in TMAC server
     */
    ConfigMode?: 'remote' | 'local';
}

/**
 * Available themes
 */
export type AppThemeType =
    | 'theme-default'
    | 'theme-default-1'
    | 'theme-default-2'
    | 'theme-teal-red'
    | 'theme-default-dark'
    | 'theme-blue-grey-dark'
    | 'theme-pink-grey-dark';

/**
 * Available fonts
 */
export type AppFontType = 'wf-muli' | 'wf-montserrat' | 'wf-source-sans-pro';

/**
 * App configs
 */
export type AppConfigs = {
    /**
     * Title of the application
     */
    TitleName: string;
    /**
     * Default theme
     */
    Theme: AppThemeType;
    /**
     * Default Font type
     */
    Font: AppFontType;
    /**
     * Logos to be displayed
     */
    Logos: Logos;
    /**
     * Flag to disable refresh of webpage
     */
    RefreshDisabled: boolean;
    /**
     * Flag to disabled opening of console
     */
    DevToolsDisabled: boolean;
    /**
     * Notification settings
     */
    Notifications: Notifications;
    /**
     * Flag to enable the "Add widget" button
     */
    AddAOTWidgetEnabled: boolean;
    /**
     * Flag to check for display resolution and alert
     */
    CheckForResolution: boolean;
    /**
     * AV config
     */
    AV: AVConfig;
    /**
     * SDK config
     */
    SDK: SDK & IConfig;
    /**
     * Flag to check for device permission in case of webphone call
     */
     DisableCheckForDevicePermission: boolean;

};

/**
 * Logo config
 */
export type Logos = {
    /**
     * URL path for the favicon
     */
    Favicon: string;
    /**
     * Default logo config
     */
    Default: LogoConfig;
    /**
     * Customer Logo config. Default logo used when this not provided.
     */
    Customer: LogoConfig;
};

/**
 * Logo config
 */
export type LogoConfig = {
    /**
     * Config of the large logo
     */
    Large: LogoSize;
    /**
     * Config of the small logo
     */
    Small: LogoSize;
    /**
     * Alternate text to be displayed when no logo provided
     */
    Alt: string;
};

/**
 * Logo size config
 */
export type LogoSize = {
    /**
     * Logo image url
     */
    Src: string;
    /**
     * Width of the logo
     */
    Width?: number;
    /**
     * Height of the logo
     */
    Height?: number;
};

/**
 * Notification config
 */
export type Notifications = {
    /**
     * Flag to enable notification sounds
     */
    Sounds: boolean;
    /**
     * Sound volume. Accepts values from 0.0 to 1.0
     */
    SoundLevel: number;
    /**
     * Flag to enable browser notifications
     */
    DesktopAlerts: boolean;
    /**
     * Timeout for browser notifications
     * @default 5000 milliseconds
     */
    DesktopAlertTimeout: number;
    /**
     * In-App alerts timeout
     * @default 5000 milliseconds
     */
    AppAlertTimeout: number;
};

/**
 * AV config
 */
export type AVConfig = {
    /**
     * WebRTC configuration dictionary as specified at
     * https://www.w3.org/TR/webrtc
     */
    webRTCConfig: WebRTCConfig;
    /**
     * Media Constraints config as specified at
     *  https://www.w3.org/TR/mediacapture-streams
     */
    mediaConstraints: MediaConstraints;
    /**
     * A WebRTC offer options dictionary as specified at
     *  https://www.w3.org/TR/webrtc.
     */
    offerOptions: OfferOptions;
    /**
     * A WebRTC answer options dictionary as specified at
     *  https://www.w3.org/TR/webrtc
     */
    answerOptions: AnswerOptions;
    /**
     * AV recording config
     */
    recordingOptions: RecordingOptions;
    /**
     * Audio level check config
     */
    audioLevelCheck: AudioLevelCheck;
    /**
     * The bandwidth upper limit for the entire connection (i.e. all tracks)
     * in kbps (kilobits per second).
     */
    connectionBandwidthUpperLimit: number;
    /**
     * The bandwidth upper limit for a single audio track in kbps (kilobits per second).
     */
    audioTrackBandwidthUpperLimit: number;
    /**
     * The bandwidth upper limit for a single video track in kbps (kilobits per second).
     */
    videoTrackBandwidthUpperLimit: number;
    /**
     *  Flag to enable audio mixing capabilities. When Mixing is enabled
     *  the WrsPeerConnection can be user as a valid input to WrsConferenceMixer to mix audio that allows
     *  conference like behavior.
     */
    audioMixerEnabled: boolean;
    /**
     * Specifies whether to (or not to) create two underlying
     *  connections for audio and video communication and which streams should direct connect to
     *  other end.
     *  This parameter should be carefully set in all parties for the solution to work properly.
     *  Changing the default behavior is only necessary in very specific scenarios only; thus
     *  application users should not be overriding this in normal scenarios.
     */
    audioVideoConnectionMode: number;
    /**
     *  Flag to merge unrelated streams that has single tracks
     *  of opposite types in to one stream. If set this would cause incoming stream with
     *  single audio track of one source (e.g. Sip Phone, Other Peer) to be merged with a
     *  stream of single video track of another source. This will not merge single track
     *  streams coming form same source. The sources are distinguished based on the underlying
     *  connection as specified by getAudioVideoConnectionMode function.
     */
    tryToMergeSingleTrackStreamsFromDifferentSources: boolean;
    /**
     * Flag to enable sending of acknowledgement for AV negotiations
     */
    sendACK: boolean;
};

/**
 * WebRTC configuration dictionary as specified at
 * https://www.w3.org/TR/webrtc
 */
export type WebRTCConfig = {
    /**
     * Ice servers for the WebRTC
     */
    iceServers: IceServer[];
    /**
     * Transport policy of ICE servers.
     */
    iceTransportPolicy: 'all' | 'relay';
    /**
     *  Note: plan-b SDP is deprecated and we will not support it in future. Need to use MS v1.1.3.10+ to allow
     *  conference/screenshare support with unified SDP.
     */
    sdpSemantics: 'unified-plan' | 'plan-b';
};

/**
 *  Media Constraints config as specified at
 *  https://www.w3.org/TR/mediacapture-streams. In addition to those keys specified by the mentioned
 *  W3C specification, the existence of the key-value "custom" with a value "true" would allow
 *  the caller to use a custom stream by overriding WrsPeerConnection.onAcquireUserMedia method. In addition to this
 *  if a specific device needs to be captured for audio/video the existence of "deviceName" with a value
 *  either as an Array containing multiple regular expression patterns of  the names of the device(s) or a string with a single regular expression pattern
 *  which would allow the caller to use a specific camera(s)/mic(s) for audio/video
 *  These regular expression pattern(s) have to be configured correctly by escaping special characters
 *  Special characters include [ \ ^ $ . | ? * + ( )
 *  To escape these special characters, each and every special character in the string(s) needs to be prefixed with \\
 */
export type MediaConstraints = {
    /**
     * Type of the Media
     */
    type?: 'custom' | 'onewayvideo';
    /**
     * Video constraints config
     */
    video?: VideoConstraints;
    /**
     * Audio constraints config
     */
    audio?: AudioConstraints;
};

/**
 * A WebRTC offer options dictionary as specified at
 *  https://www.w3.org/TR/webrtc.
 */
export type OfferOptions = {
    /**
     * This setting provides additional control over the directionality of audio.
     * For example, it can be used to ensure that audio can be received, regardless if audio is sent or not.
     */
    offerToReceiveAudio: boolean;
    /**
     * This setting provides additional control over the directionality of video.
     * For example, it can be used to ensure that video can be received, regardless if video is sent or not.
     */
    offerToReceiveVideo: boolean;
    /**
     * When the value of this is true,
     * then the generated description will have ICE credentials that are different from the current credentials
     * (as visible in the currentLocalDescription attribute's SDP). Applying the generated description will restart ICE.
     * When the value of this is false,
     * then the generated description will have the same ICE credentials as the current value from the currentLocalDescription attribute.
     */
    iceRestart: boolean;
};

/**
 * Audio level check config
 */
export type AudioLevelCheck = {
    /**
     * Flag that specifies whether to talk detection techniques are enabled using stat's audio level or not.
     * By default we have disabled it. If application is interested to fetch who is speaking in the during
     * conference, then application needs to override this function and return true. true return value indicates
     * its talk detection is enabled, false indicates its disabled.
     */
    enabled: boolean;
    /**
     * Config that specifies the minimum threshold audiolevel value needed to mark the remote stream is
     * talking, the remote audio stream stat's audioLevel is compared against this threshold audioLevel value,
     * if the remote stream audiolevel is above the this value, then only that stream is considered as talking else it will
     * be considered as not talking.
     */
    threshold: number;
};

/**
 * AV recording config
 */
export type RecordingOptions = {
    /**
     * Flag to enable recordings
     */
    enabled: boolean;
    /**
     * Specifies output codec. The codec can be "vp8", "vp9" or "h264" depending on the browser support.
     * When unspecified, this will automatically determined based on web browser.
     */
    codec: string;
    /**
     * Flag to enable recording local streams as well. By default
     * the local streams will be recorded;
     * this behaviour can be changed by setting it to false.
     */
    recordLocal: boolean;
    /**
     * audio recording bitrates in Kbps.
     * Setting this to unnecessarily higher values may increase the max bandwidth required between
     * communication from this api to the  temporary media storage (i.e. MediaServer) system. When
     * unspecified audio track will be encoded at 32Kbps and video track at 512Kbps.
     */
    audioKbps: number;
    /**
     * video recording bitrates in Kbps.
     * Setting this to unnecessarily higher values may increase the max bandwidth required between
     * communication from this api to the  temporary media storage (i.e. MediaServer) system. When
     * unspecified audio track will be encoded at 32Kbps and video track at 512Kbps.
     */
    videoKbps: number;
};

/**
 * A WebRTC answer options dictionary as specified at
 *  https://www.w3.org/TR/webrtc
 */
export type AnswerOptions = {
    /**
     * When the value of this is true,
     * then the generated description will have ICE credentials that are different from the current credentials
     * (as visible in the currentLocalDescription attribute's SDP). Applying the generated description will restart ICE.
     * When the value of this is false,
     * then the generated description will have the same ICE credentials as the current value from the currentLocalDescription attribute.
     */
    iceRestart: boolean;
};

/**
 * Ice server config
 */
export type IceServer = {
    /**
     * Urls  of the ice servers
     */
    urls: string;
    /**
     * Username
     */
    username: string;
    /**
     * Credential of the server
     */
    credential: string;
};

/**
 * Audio constraints config
 */
export type AudioConstraints = {
    /**
     * Flag to enable audio constraints
     */
    enabled: true;
    /**
     * Refer https://www.w3.org/TR/mediacapture-streams/#def-constraint-autoGainControl
     */
    autoGainControl: true;
    /**
     * Refer https://www.w3.org/TR/mediacapture-streams/#def-constraint-noiseSuppression
     */
    noiseSuppression: true;
    /**
     * Refer https://www.w3.org/TR/mediacapture-streams/#def-constraint-echoCancellation
     */
    echoCancellation: true;
};

/**
 * Video constraints config
 */
export type VideoConstraints = {
    /**
     * Flag to enable video constraints
     */
    enabled: boolean;
    /**
     * Width of the video dialog
     */
    width: number;
    /**
     * Height of the video dialog
     */
    height: number;
    /**
     * The exact frame rate (frames per second) or frame rate range.
     * If video source's pre-set can determine frame rate values, the range, as a capacity,
     * should span the video source's pre-set frame rate values with min being equal to 0
     * and max being the largest frame rate.
     * The User Agent MUST support frame rates obtained from integral decimation of the native resolution frame rate.
     * If this frame rate cannot be determined (e.g. the source does not natively provide a frame rate,
     * or the frame rate cannot be determined from the source stream), then this value MUST refer to the User Agent's vsync display rate.
     */
    frameRate: number;
    /**
     * ID of the device
     */
    deviceId: string;
};

/**
 * SDK config
 */
export type SDK = {
    /**
     * @deprecated use "proxy" instead
     */
    Proxy: Proxy & IProxy;
    /**
     * @deprecated Use "signalRProxy" instead
     */
    SignalRProxy: SignalRProxy & ISignalRProxy;
    /**
     * @deprecated Use "logging" instead
     */
    Logging: Logging & ILogging;
    /**
     * @deprecated Use "customScripts" instead
     */
    CustomScripts: string[];
    /**
     * @deprecated Use "customScripts" instead
     */
    CustomSripts?: string[];
};

/**
 * Proxy config
 */
export type Proxy = {
    /**
     * List of URLs to be used.
     * Note that this is a list because of the fallback mechanism ie when first url fails,
     * second one is considered and so on.
     * @deprecated Use "urls" instead
     */
    Urls: string[];
    /**
     * type of the protocol used
     * @deprecated Use "type" instead
     */
    Type: string;
    /**
     * Timeout of the connection in milliseconds
     * @deprecated Use "timeout" instead
     */
    Timeout: number;
};

/**
 * SignalR config
 */
export type SignalRProxy = {
    /**
     * Flag to enable SignalRProxy
     * @deprecated Use "enabled" instead
     */
    Enabled: boolean;
    /**
     * Flag to enable looging for the connection
     * @deprecated Use "logging" instead
     */
    Logging: boolean;
    /**
     * Protocol for signalR.
     * Note: Only websocket supported for now.
     * @deprecated Use "protocol" instead
     */
    Protocol: 'webSockets' | 'longPolling';
    /**
     * Connection timeout
     * @deprecated Use "logging" instead
     */
    Timeout: number;
    /**
     * Flag to enable fallback to event polling if any connection interruptions.
     * SignalR retry will not happen, instead it will fallback to event polling based on this config.
     * @deprecated Use "fallback" instead
     */
    Fallback: boolean;
};

/**
 * Logging config
 */
export type Logging = {
    /**
     * Flag to enable SDK logging
     * @deprecated use "enabled" instead
     */
    Enabled: boolean;
    /**
     * Logging levels config
     * @deprecated use "level" instead
     */
    Level: Level;
    /**
     * Remote log config
     * @deprecated use "remote" instead
     */
    Remote: Remote;
    /**
     * Flag to enable logging of SDK method calls
     * @deprecated use "sdkMethods" instead
     */
    SDKMethods: boolean;
    /**
     * Flag to enable logging of  SDK events
     * @deprecated use "sdkEvents" instead
     */
    SDKEvents: boolean;
};

/**
 * Log level config
 */
export type Level = {
    /**
     * Flag to enable Debug log level
     * @deprecated use "debug" instead
     */
    Debug: boolean;
    /**
     * Flag to enable Info log level
     * @deprecated use "info" instead
     */
    Info: boolean;
    /**
     * Flag to enable Warn log level
     * @deprecated use "warn" instead
     */
    Warn: boolean;
    /**
     * Flag to enable Error Log level
     * @deprecated use "error" instead
     */
    Error: boolean;
};

/**
 * Remote log config
 */
export type Remote = {
    /**
     * Flag to enable remote logging
     * @deprecated use "enabled" instead
     */
    Enabled: boolean;
    /**
     * Interval for logging
     * @deprecated use "timeout" instead
     */
    Timeout: number;
    /**
     * Number of logs to be sent to remote logging.
     * Note: if the timeout expires, the logs are sent to server no matter how many logs
     * have been accumulated
     * @deprecated use "count" instead
     */
    Count: number;
};
