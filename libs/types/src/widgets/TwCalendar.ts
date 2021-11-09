export interface TwCalendarTaskOption {
    Name: string;
    Value: string;
}

import { Widget } from '..';

export type TwCalendar = Widget<TwCalendarData>;

export interface TwCalendarData {
    TaskOptions: TwCalendarTaskOption[];
}
