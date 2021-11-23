import { AgentSkillConfig } from '../components/AgentSkillComponent';

export interface TwWorkbenchPanelConfig {
    Transfer?: AgentSkillConfig;
    SearchPollingInterval: number;
    QueueTransferForAgent?: boolean;
    PullAllowed?: boolean;
    AskPullConfirmation?: boolean;
    PushAllowed?: boolean;
}
export interface TwWorkbenchPanelSkill {
    Allowed: boolean;
    Consult: boolean;
    Blind: boolean;
    Comments: boolean;
    Source: AgentSkillConfig;
    ChannelPrefix: string[];
    Columns: any[];
}
export interface TwWorkbenchPanelChannel {
    Type: string;
    Enabled: boolean;
    Icon: string;
    Config: TwWorkbenchPanelConfig;
}

export interface TwWorkbenchPanelGeneral {
    WorkbenchUrl: string;
}

import { Widget } from '..';

export type TwWorkbenchPanel = Widget<TwWorkbenchPanelData>;

export interface TwWorkbenchPanelData {
    General: TwWorkbenchPanelGeneral;
    Channels: TwWorkbenchPanelChannel[];
}
