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
     * List of allowed states whilte transferring/conferencing
     */
    AllowedStates: any[];
    /**
     * List of columns displayed during transfer/conference
     */
    Columns: K[];
    /**
     * Channel prefix to filter
     */
    ChannelPrefix: [];
};

/**
 * Agent's Transfer/Conference config
 */
export type AgentTransferConferenceConfig = TransferConfig<
    AgentSources | AgentSkillListSource<AgentSources, AgentSources | 'agentName'>,
    'AgentID' | 'FirstName' | 'LastName' | 'CurrentAgentStatus'
> & {
    /**
     * Flag to enable team based list of agents
     */
    TeamFilter: boolean;
};

export type SkillTransferConferenceConfig = TransferConfig<
    SkillSources | AgentSkillListSource<SkillSources, SkillSources>,
    'Name' | 'VDN' | 'ID' | 'Stf' | 'Avl' | 'CIQ'
>;

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

export type AgentSkillListData = {
    /**
     * Type of dialog
     */
    type: 'makeCall' | 'transferCall' | 'conferenceCall' | 'transferChat' | 'conferenceChat' | 'transferEmail' | 'transferFax' | 'pushChat';
    /**
     * Title of dialog
     */
    title?: string;
    /**
     * Agent settings
     */
    agent: {
        /**
         * Agent allowed flag
         */
        allowed: boolean;
        /**
         * Consult allowed flag
         */
        consult: boolean;
        /**
         * Comments allowed flag
         */
        comments: boolean;
        /**
         * Blind allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: AgentSources | AgentSkillListSource<AgentSources, AgentSources | 'agentName'>;
        /**
         * Allowed states to do action
         */
        allowedStates: string[];
        /**
         * Allowed Columns
         */
        columns?: string[];
        /**
         * To filter agent list based on team visibility
         */
        teamFilter?: boolean;
    };
    /**
     * Skill settings
     */
    skill: {
        /**
         * Agent allowed flag
         */
        allowed: boolean;
        /**
         * Consult allowed flag
         */
        consult: boolean;
        /**
         * Comments allowed flag
         */
        comments: boolean;
        /**
         * Blind allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: SkillSources | AgentSkillListSource<SkillSources, SkillSources>;
        /**
         * Channel prefix to filter skill list
         */
        channelPrfix: string[];
        /**
         * Allowed Columns
         */
        columns?: string[];
    };
    /**
     * speed dial settings
     */
    speedDial?: {
        /**
         * Agent allowed flag
         */
        allowed: boolean;
        /**
         * Consult allowed flag
         */
        consult: boolean;
        /**
         * Comments allowed flag
         */
        comments: boolean;
        /**
         * Blind allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: SpeedDialSources | AgentSkillListSource<SpeedDialSources, SpeedDialSources>;
        /**
         * Allowed Columns
         */
        columns?: string[];
        /**
         * To filter agent list based on team visibility
         */
        teamFilter?: boolean;
    };

    /**
     * FOR INTERNAL USE ONLY
     * Dynamic lists to be displayed while teransferring / conferencing
     */
    dynamicLists?: {
        /**
         * Label of the column
         */
        label: string;
        /**
         * Place holder used for the seelected row
         */
        placeholder: string;
        /**
         * List of data to be displayed
         */
        data: any[];
        /**
         * List of columns to be displayed
         */
        columns: string[];
        /**
         * Key to be passed when a row selected
         */
        selection: string;
        /**
         * Flag to enabled consult
         */
        consult: boolean;
        /**
         * Flag to enable blind transfers
         */
        blind: boolean;
        /**
         * Flag to enable comments
         */
        comments: boolean;
    }[];
    /**
     * Interaction Id
     */
    interactionId?: number;
    /**
     * Any extra info to pass
     */
    otherData?: any;
    /**
     *  Callback on close
     */
    callback?: (data?: any) => void;
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
