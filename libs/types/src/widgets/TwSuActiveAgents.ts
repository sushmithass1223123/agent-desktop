import { Widget } from '..';

export type TwSuActiveAgents = Widget<TwSuActiveAgentsData>;

export interface TwSuActiveAgentsData {
    TASUrl: string;
    SortBy: string;
    SortType: 'desc' | 'asc';
}
