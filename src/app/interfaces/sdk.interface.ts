// import { AgentChannelDataModel } from '@tmac/sdk';

import { TMACEventTypes } from '@tmac/sdk';

export interface QuizEvent {
    ACK: any;
    CreatedTime: string;
    EventId: string;
    EventName: string;
    InteractionID: number;
    IsInteractionConstructEvent: boolean;
    IsInteractionDisposeEvent: boolean;
    JsonData: string;
    QueuedEvent: boolean;
    RecoveryEvent: boolean;
    SubEventName: 'QuizEvent';
}

export interface QuizEventJsonData {
    url: string;
    params: {
        intentName: string;
        customerId: number;
        inSimulation: boolean;
        enableQuiz: boolean;
    };
}

export type CustomTMACEventTypes =
    | TMACEventTypes
    | 'QuizEvent'
    | 'AgentInteractionDetailsEvent'
    | 'OnLoadMetricsToAgent'
    | 'OnAssignPointsToAgent'
    | 'TeamAgentListEvent'
    | 'SupervisorAgentListEvent'
    | 'CallbackDataReceivedForAgent'
    | 'TeamAgentInteractionDetailsEvent'
    | 'TeamrWorkCodeDetailsEvent'
    | 'AgentChannelListEvent'
    | 'AgentStatusDetailsEvent'
    | 'TeamAgentListDataEvent'
    | 'TeamIntentListEvent'
    | 'TeamActiveStatusDetailsEvent'
    | 'TeamActiveChannelListEvent'
    | 'TeamChannelListEvent'
    | 'CannedResposeEvent'
    | 'VoiceCannedResponseEvent'
    | 'CustomerContactInfoReceivedEvent';
