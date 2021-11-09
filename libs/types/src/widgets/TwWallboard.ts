import { Widget } from '..';

export type TwWallboard = Widget<TwWallboardData>;

export interface TwWallboardData {
    Role: string;
    SLEnabled: boolean;
}
