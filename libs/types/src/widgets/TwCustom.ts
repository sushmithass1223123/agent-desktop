import { Widget } from '..';

export type TwCustom = Widget<TwCustomData>;

export interface TwCustomData {
    OpenInNew: boolean;
    Url: string;
}
