// import { AgentChannelDataModel } from '@tmac/sdk';

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
