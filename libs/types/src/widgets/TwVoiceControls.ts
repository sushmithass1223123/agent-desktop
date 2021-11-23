import { AgentSkillConfig } from '../components/AgentSkillComponent';
import { InteractionWidgetBaseData } from '../core';

export interface TwVoiceControlsIVR {
    MenuEnabled: boolean;
    DefaultMenu: string[];
    Transfer: IVRAgentSkillTransfer;
}

export interface IVRAgentSkillTransfer {
    Allowed: boolean;
    Menu: IVrAgentSkillMenu[];
}

export interface IVrAgentSkillMenu {
    Text: string;
    Type: string;
    Value: string;
    Icon: string;
}

import { Widget } from '..';

export type TwVoiceControls = Widget<TwVoiceControlsData>;

export interface TwVoiceControlsData {
    Transfer: AgentSkillConfig;
    Conference: AgentSkillConfig;
    IVR: TwVoiceControlsIVR;
    DialpadAllowed: boolean;
    InteractionCommentAllowed: boolean;
    MakeCallAllowed: boolean;
    SendSMSAllowed: boolean;
    CloseInteractionOnEnd: boolean;
}
