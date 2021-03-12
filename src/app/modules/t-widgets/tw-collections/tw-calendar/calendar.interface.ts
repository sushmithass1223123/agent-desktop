import { AnyMxRecord } from "dns";

export interface EventColor {
    primary: string;
    secondary: string;
}
export interface CustomEventAction {
    id?: string | number;
    label: string;
    cssClass?: string;
    a11yLabel?: string;
    onClick({ event, sourceEvent, }: {
        event: CustomCalendarEvent;
        sourceEvent: MouseEvent | KeyboardEvent;
    }): any;
}
export interface CustomCalendarEvent<MetaType = any> {
    id?: string | number;
    start: Date;
    end?: Date;
    title: string;
    color?: EventColor;
    type: string;
    status: string;
    data?: any;
    actions?: CustomEventAction[];
    allDay?: boolean;
    cssClass?: string;
    resizable?: {
        beforeStart?: boolean;
        afterEnd?: boolean;
    };
    draggable?: boolean;
    meta?: MetaType;
}
