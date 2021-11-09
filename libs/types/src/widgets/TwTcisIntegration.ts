export interface TwTcisIntegrationAction {
    EventName: string;
    Channel: string;
    Parameters: string[];
    Method: string;
    ExeName: string;
}

import { Widget } from '..';

export type TwTcisIntegration = Widget<TwTcisIntegrationData>;

export interface TwTcisIntegrationData {
    Urls: any[];
    Hub: string;
    Actions: TwTcisIntegration[];
}
