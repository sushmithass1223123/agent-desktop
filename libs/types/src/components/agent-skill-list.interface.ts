export type AgentSources = 'station' | 'agentId';
export type SkillSources = 'skill' | 'vdn';
export type AgentSkillListSource<
    /**
     * export Type of Use Key. Default: any
     */
    T = any,
    /**
     * export Type of Display Key. Default : any
     */
    K = any
> = {
    /**
     * This agent source is forwarded to any api calls / value assigning
     */
    Use: T;
    /**
     * This agent source is displayed
     */
    Display: K;
    /**
     * Flag to allow freetext to redirect user to specified source's use key
     */
    FreeTextAllowed: boolean;
};

export type SpeedDialSources = 'Name' | 'Number';

/**
 * Transfer config for agents, skills and speed dials
 */
export type TransferConfig<T, K = string> = {
    /**
     * Flag to anable transfer / conference
     */
    Allowed: boolean;
    /**
     * Flag to enable consult button
     */
    Consult: boolean;
    /**
     * Flag to enable button for blind transfers
     */
    Blind: boolean;
    /**
     * Flag to enable comments button
     */
    Comments: boolean;
    /**
     * Key to be used as source when transferring/conferencing
     */
    Source: T;
    /**
     * List of columns displayed during transfer/conference
     */
    Columns: K[];
};

type SkillTransferConferenceRulesConfig = {
    /**
     * Enabled flag
     */
    Enabled: boolean;
    /**
     * Minimum count
     */
    Min: number;
    /**
     * Maximum count
     */
    Max: number;
};

/**
 * Skill Transfer/Conference rules config
 */
export type SkillTransferConferenceRules = {
    /**
     * Enabled flag
     */
    Enabled: boolean;
    /**
     * Agent's staffed rules config
     */
    STF: SkillTransferConferenceRulesConfig;
    /**
     * Agent's available rules config
     */
    AVL: SkillTransferConferenceRulesConfig;
    /**
     * Calls in queue rules config
     */
    CIQ: SkillTransferConferenceRulesConfig;
};

/**
 * Agent's Transfer/Conference config
 */
export type AgentTransferConferenceConfig = TransferConfig<
    AgentSources | AgentSkillListSource<AgentSources, AgentSources | 'agentName'>,
    'AgentID' | 'FirstName' | 'LastName' | 'CurrentAgentStatus'
> & {
    /**
     * List of allowed states whilte transferring/conferencing
     */
    AllowedStates: string[];
    /**
     * Flag to enable team based list of agents
     */
    TeamFilter: boolean;
};

export type SkillTransferConferenceConfig = TransferConfig<
    SkillSources | AgentSkillListSource<SkillSources, SkillSources>,
    'Name' | 'VDN' | 'ID' | 'Stf' | 'Avl' | 'CIQ'
> & {
    /**
     * Channel prefix to filter
     */
    ChannelPrefix: string[];
    /**
     * Rules to allow skill transfer/conference
     */
    Rules: SkillTransferConferenceRules;
};

/**
 * Speed Dial Transfer/Conference config
 */
export type SpeedDialTransferConferenceConfig = TransferConfig<
    SpeedDialSources | AgentSkillListSource<SpeedDialSources, SpeedDialSources>,
    'Name' | 'Number'
> & {
    /**
     * Flag to enable team based list of agents
     */
    TeamFilter: boolean;
};

/**
 * Agent Skill Data type
 */
export type AgentSkillDataType =
    | 'makeCall'
    | 'transferCall'
    | 'conferenceCall'
    | 'transferChat'
    | 'conferenceChat'
    | 'transferEmail'
    | 'transferFax'
    | 'pushChat';

export type AgentSkillListData = {
    /**
     * Type of dialog
     */
    Type: AgentSkillDataType;
    /**
     * Title of dialog
     */
    Title?: string;
    /**
     * Agent settings
     */
    Agent: {
        /**
         * Agent allowed flag
         */
        Allowed: boolean;
        /**
         * Consult allowed flag
         */
        Consult: boolean;
        /**
         * Comments allowed flag
         */
        Comments: boolean;
        /**
         * Blind allowed flag
         */
        Blind: boolean;
        /**
         * Source to select
         */
        Source: AgentSources | AgentSkillListSource<AgentSources, AgentSources | 'agentName'>;
        /**
         * Allowed states to do action
         */
        AllowedStates: string[];
        /**
         * Allowed Columns
         */
        Columns?: string[];
        /**
         * To filter agent list based on team visibility
         */
        TeamFilter?: boolean;
    };
    /**
     * Skill settings
     */
    Skill: {
        /**
         * Agent allowed flag
         */
        Allowed: boolean;
        /**
         * Consult allowed flag
         */
        Consult: boolean;
        /**
         * Comments allowed flag
         */
        Comments: boolean;
        /**
         * Blind allowed flag
         */
        Blind: boolean;
        /**
         * Source to select
         */
        Source: SkillSources | AgentSkillListSource<SkillSources, SkillSources>;
        /**
         * Channel prefix to filter skill list
         */
        ChannelPrefix: string[];
        /**
         * Allowed Columns
         */
        Columns?: string[];
        /**
         * Rules to allow skill transfer/conference
         */
        Rules?: SkillTransferConferenceRules;
    };
    /**
     * speed dial settings
     */
    SpeedDial?: {
        /**
         * Agent allowed flag
         */
        Allowed: boolean;
        /**
         * Consult allowed flag
         */
        Consult: boolean;
        /**
         * Comments allowed flag
         */
        Comments: boolean;
        /**
         * Blind allowed flag
         */
        Blind: boolean;
        /**
         * Source to select
         */
        Source: SpeedDialSources | AgentSkillListSource<SpeedDialSources, SpeedDialSources>;
        /**
         * Allowed Columns
         */
        Columns?: string[];
        /**
         * To filter agent list based on team visibility
         */
        TeamFilter?: boolean;
    };

    /**
     * FOR INTERNAL USE ONLY
     * Dynamic lists to be displayed while teransferring / conferencing
     */
    DynamicLists?: {
        /**
         * Label of the column
         */
        Label: string;
        /**
         * Place holder used for the seelected row
         */
        Placeholder: string;
        /**
         * List of data to be displayed
         */
        Data: any[];
        /**
         * List of columns to be displayed
         */
        Columns: string[];
        /**
         * Key to be passed when a row selected
         */
        Selection: string;
        /**
         * Flag to enabled consult
         */
        Consult: boolean;
        /**
         * Flag to enable blind transfers
         */
        Blind: boolean;
        /**
         * Flag to enable comments
         */
        Comments: boolean;
    }[];
    /**
     * Interaction Id
     */
    InteractionId?: number;
    /**
     * Any extra info to pass
     */
    OtherData?: any;
    /**
     *  Callback on close
     */
    Callback?: (data?: any) => void;
};

/**
 * Agent skill config is used to configure the transfer settings during interactions
 */
export type AgentSkillConfig = {
    /**
     * Flag to allow the Transfer / conference
     */
    Allowed: boolean;
    /**
     * Agent's Transfer/Conference config
     */
    Agent: AgentTransferConferenceConfig;

    /**
     * Skill based Transfer/Conference config
     */
    Skill: SkillTransferConferenceConfig;
    /**
     * Speed Dial Transfer/Conference config
     */
    SpeedDial: SpeedDialTransferConferenceConfig;
};
