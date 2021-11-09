export interface TwRegisterCallbackDataMap {
    Name: TwRegisterCallbackName;
    Phone: TwRegisterCallbackName;
}
export interface TwRegisterCallbackName {
    ValueSource: string;
    DefaultValue: string;
}

import { Widget } from '..';

export type TwRegisterCallback = Widget<TwRegisterCallbackData>;

export interface TwRegisterCallbackData {
    TCMProxyUrl: string;
    DataMap: TwRegisterCallbackDataMap;
}
