import { AgentSkillDataType, AgentSkillListData, AgentSkillListSource, AgentSources, SkillSources, SpeedDialSources } from '@ad/types';

export class AgentSkillListDataModel implements AgentSkillListData {
    Type: AgentSkillDataType;
    Title?: string;
    Agent: {
        Allowed: boolean;
        Consult: boolean;
        Comments: boolean;
        Blind: boolean;
        Source: AgentSources | AgentSkillListSource<AgentSources, AgentSources | 'agentName'>;
        AllowedStates: string[];
        Columns?: string[];
        TeamFilter?: boolean;
    };
    Skill: {
        Allowed: boolean;
        Consult: boolean;
        Comments: boolean;
        Blind: boolean;
        Source: SkillSources | AgentSkillListSource<SkillSources, SkillSources>;
        ChannelPrefix: string[];
        Columns?: string[];
    };
    SpeedDial?: {
        Allowed: boolean;
        Consult: boolean;
        Comments: boolean;
        Blind: boolean;
        Source: SpeedDialSources | AgentSkillListSource<SpeedDialSources, SpeedDialSources>;
        Columns?: string[];
        TeamFilter?: boolean;
    };
    DynamicLists?: {
        Label: string;
        Placeholder: string;
        Data: any[];
        Columns: string[];
        Selection: string;
        Consult: boolean;
        Blind: boolean;
        Comments: boolean;
    }[];
    InteractionId?: number;
    OtherData?: any;
    Callback?: (data?: any) => void;

    constructor(type: AgentSkillDataType, title?: string) {
        this.Type = type;
        this.Title = title;

        this.Agent = {
            Allowed: false,
            AllowedStates: [],
            Blind: false,
            Columns: [],
            Comments: false,
            Consult: false,
            Source: 'agentId',
            TeamFilter: false
        };

        this.Skill = {
            Allowed: false,
            ChannelPrefix: [],
            Blind: false,
            Columns: [],
            Comments: false,
            Consult: false,
            Source: 'skill'
        };

        this.SpeedDial = {
            Allowed: false,
            Blind: false,
            Columns: [],
            Comments: false,
            Consult: false,
            Source: 'Number',
            TeamFilter: false
        };
    }
}
