import { WorkCode } from 'tmac-sdk';

export interface ResData<T> {
    loading: boolean;
    error: boolean;
    msg?: string;
    data?: T;
}

export interface ResGamification {
    AgentId: string;
    AgentName: string;
    Position: number;
    ProfilePic: string;
    SupervisorName: string;
    TeamId: number;
    TeamName: string;
    TotalBadges: ResGamificationBadge[];
    TotalPoints: number;
}

export interface ResGamificationBadge {
    BadgeId: number;
    BadgeName: string;
    BadgeUrl: string;
}

export interface ResLoadWorkCodes {
    response: WorkCode[];
    userObject: any;
}

export interface ResCampaign {
    IsMaxConcurrentReached: string;
    campaignName: string;
    campaignStatus: string;
    campaignType: string;
    channel: string;
    contactCountStr: string;
    contactType: string;
    dialPrefix: string;
    dynamicContactDataCount: string;
    dynamicContactDataFields: string;
    emailAccountId: string;
    emailSenderId: string;
    emailTemplateId: string;
    id: string;
    intent: string;
    isDirectAgent: boolean;
    isForever: boolean;
    lastChangedBy: string;
    lastChangedOn: string;
    maxConcurrentCalls: string;
    messageTemplate: string;
    retryCount: number;
    scheduleStatus: string;
    screenPopType: string;
    screenPopURL: string;
    totalContacts: string;
    waitTimeBeforeDial: number;
}
