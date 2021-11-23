import { Widget } from '..';

export type TwWorkCodes = Widget<TwWorkCodesData>;

export interface TwWorkCodesData {
    Role: string;
    ByTeam: boolean;
    ByGroup: boolean;
}
