import { Widget } from '..';

export type TwAhtTc = Widget<TwAhtTcData>;

export interface TwAhtTcData {
    Type: string;
    Role: string;
    Limit: number;
    Label: boolean;
}
