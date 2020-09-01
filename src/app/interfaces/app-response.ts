import { WorkCode } from 'tmac-sdk';

export interface ResStatus {
    loading: boolean;
    error: boolean;
    msg: string;
}

export interface ResData<T> {
    loading: boolean;
    error: boolean;
    msg: string;
    data: T;
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
