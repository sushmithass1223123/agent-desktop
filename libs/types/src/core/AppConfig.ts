import { IConfig } from '@tmac/sdk';

export interface Proxy {
    Urls: string[];
    urls: string[];
    Type: string;
    Timeout: number;
}

export type AppThemeType =
    | 'theme-default'
    | 'theme-default-1'
    | 'theme-default-2'
    | 'theme-teal-red'
    | 'theme-default-dark'
    | 'theme-blue-grey-dark'
    | 'theme-pink-grey-dark';

export type AppFontType = 'wf-muli' | 'wf-montserrat' | 'wf-source-sans-pro';

export interface SDK {
    /**
     * @deprecated use "proxy" instead
     */
    Proxy: Proxy;
    /**
     * @deprecated Use "signalRProxy" instead
     */
    SignalRProxy: SignalRProxy;
    /**
     * @deprecated Use "logging" instead
     */
    Logging: Logging;
    /**
     * @deprecated Use "customScripts" instead
     */
    CustomScripts: string[];
    /**
     * @deprecated Use "customScripts" instead
     */
    CustomSripts?: string[];
}

export interface AppConfigs {
    TitleName: string;
    Theme: AppThemeType;
    Font: AppFontType;
    Logos: Logos;
    RefreshDisabled: boolean;
    DevToolsDisabled: boolean;
    Notifications: Notifications;
    AddAOTWidgetEnabled: boolean;
    AV: AV;
    SDK: SDK & IConfig;
}

export interface AV {
    WebRTCConfig: WebRTCConfig;
    MediaConstraints: MediaConstraints;
    OfferOptions: OfferOptions;
    AnswerOptions: AnswerOptions;
    RecordingOptions: RecordingOptions;
    AudioLevelCheck: AudioLevelCheck;
    ConnectionBandwidthUpperLimit: number;
    AudioTrackBandwidthUpperLimit: number;
    VideoTrackBandwidthUpperLimit: number;
    AudioMixerEnabled: boolean;
    LudioVideoConnectionMode: number;
    EnableCdcAutoSelection: boolean;
    TryToMergeSingleTrackStreamsFromDifferentSources: boolean;
    SendACK: boolean;
}

export interface Logos {
    Favicon: string;
    Default: Logo;
    Customer: Logo;
}

export interface Notifications {
    Sounds: boolean;
    SoundLevel: number;
    DesktopAlerts: boolean;
    DesktopAlertTimeout: number;
    AppAlertTimeout: number;
}

export interface SignalRProxy {
    Enabled: boolean;
    /**
     * @deprecated Use "Enabled" instead
     */
    enabled: boolean;
    Logging: boolean;
    Protocol: string;
    Timeout: number;
    Fallback: boolean;
}

export interface Logging {
    Enabled: boolean;
    Level: Level;
    Remote: Remote;
    SDKMethods: boolean;
    SDKEvents: boolean;
}

export interface WebRTCConfig {
    IceServers: IceServer[];
    IceTransportPolicy: string;
    SDPSemantics: string;
}

export interface MediaConstraints {
    Type: string;
    Video: Video;
}

export interface OfferOptions {
    OfferToReceiveAudio: boolean;
    OfferToReceiveVideo: boolean;
    IceRestart: boolean;
}

export interface AudioLevelCheck {
    Enabled: boolean;
    Threshold: number;
}

export interface RecordingOptions {
    Enabled: boolean;
    Codec: string;
    RecordLocal: boolean;
    AudioKbps: number;
    VideoKbps: number;
}

export interface AnswerOptions {
    IceRestart: boolean;
}

export interface Logo {
    Large: LogoSize;
    Small: LogoSize;
    Alt: string;
}

export interface LogoSize {
    Src: string;
    Width?: number;
    Height?: number;
}

export interface IceServer {
    URLs: string;
    Username: string;
    Credential: string;
}
export interface Video {
    Width: number;
    Height: number;
}

export interface Remote {
    Enabled: boolean;
    Timeout: number;
    Count: number;
}

export interface Level {
    Debug: boolean;
    Info: boolean;
    Warn: boolean;
    Error: boolean;
}
