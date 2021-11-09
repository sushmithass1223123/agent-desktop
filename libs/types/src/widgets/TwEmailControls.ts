import { AgentSkillConfig } from '../components/AgentSkillComponent';
import { InteractionWidgetBaseData } from '../core';

import { Widget } from '..';

export type TwEmailControls = Widget<TwEmailControlsData>;

export interface TwEmailControlsData {
    Transfer: AgentSkillConfig;
    ForwardAllowed: boolean;
    ReplyAllAllowed: boolean;
    InteractionCommentAllowed: boolean;
    DraftPollingInterval: number;
}
