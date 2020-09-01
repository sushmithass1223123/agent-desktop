export interface HistoryInteraction {
    ID: string;
    ItemID: number;
    GroupID: string;
    Channel: string;
    Direction: string;
    InteractionDate: string;
    InteractionText: string;
    LastServicedAgentName: string;
    SessionID: string;
    Intent: string;
    IntentStatus: string;
    AgentID: string;
    AgentName: string;
    GroupHeaderText: string;
    DisplayText: string;
    CIF: string;
    EmailID: string;
    PhoneNumber: string;
    ChannelSpecificIdentifier: string;
    ItemType: number;
    LastID: number;
    SubType: string;
}

export interface WorkCode {
    Code: string;
    Name: string;
    ParentID: string;
    TeamID: string;
    __type: string;
}

export interface ResLoadWorkCodes {
    response: WorkCode[];
    userObject: any;
}
