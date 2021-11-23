import { AgentSkillConfig } from '../components/AgentSkillComponent';
import { InteractionWidgetBaseData } from '../core';

export interface TwChatControlsSnapshot {
    Allowed: boolean;
    Source: string;
    RemoteResponseTimeout: number;
}
export interface TwChatControlsConversationService {
    Url: string;
    Limit: number;
}
export interface TwChatControlsWebRTCTest {
    Allowed: boolean;
    Url: string;
    Customer: boolean;
}
export interface TwChatControlsChatTemplate {
    Allowed: boolean;
    Filter: string;
    FilterByTime: boolean;
}
export interface TwChatControlsWhiteboard {
    Allowed: boolean;
    Url: string;
}

import { Widget } from '..';

export type TwChatControls = Widget<TwChatControlsData>;

export interface TwChatControlsData {
    Transfer: AgentSkillConfig;
    Conference: AgentSkillConfig;
    AudioEscalateAllowed: boolean;
    VideoEscalateAllowed: boolean;
    SignatureAllowed: boolean;
    EmojiAllowed: boolean;
    ReplyOnChatAllowed: boolean;
    VoiceNoteAllowed: boolean;
    AttachmentAllowed: boolean;
    ScreenShareAllowed: boolean;
    InteractionCommentAllowed: boolean;
    HoldInteractionAllowed: boolean;
    Whiteboard: TwChatControlsWhiteboard;
    Snapshot: TwChatControlsSnapshot;
    ShowUserLabel: boolean;
    ChatTemplate: TwChatControlsChatTemplate;
    WebRTCTest: TwChatControlsWebRTCTest;
    ConversationService: TwChatControlsConversationService;
    ReplyAllowed: boolean;
    EndInteractionOnAVEnd: boolean;
    CloseInteractionOnEnd: boolean;
}
