import { Widget } from '..';

export type TwGamification = Widget<TwGamificationData>;

export interface TwGamificationData {
    GamificationProxyUrl: string;
    TVirtualStoreUrl: string;
    LeaderBoardUrl: string;
    AgentProgressUrl: string;
}
