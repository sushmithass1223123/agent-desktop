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
     * Allow freetext to redirect user to specified source's use key
     */
    FreeTextAllowed: boolean;
};

export interface AgentSkillListData {
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
}

export interface AgentSkillConfig {
    Allowed: boolean;
    Agent: AgentTransferConfig;
    Skill: SkillTransferConfig;
}

interface TransferConfig<T> {
    Allowed: boolean;
    Consult: boolean;
    Blind: boolean;
    Comments: boolean;
    Source: T;
    AllowedStates: any[];
    Columns: any[];

    /**
     * Channel prefix to filter
     */
    ChannelPrefix: [];
}

export interface AgentTransferConfig extends TransferConfig<AgentSources | AgentSkillListSource<AgentSources, AgentSources | 'agentName'>> {
    TeamFilter: boolean;
}

export interface SkillTransferConfig extends TransferConfig<SkillSources | AgentSkillListSource<SkillSources, SkillSources>> {}
