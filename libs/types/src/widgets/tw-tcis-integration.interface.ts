export type TwTcisIntegrationAction = {
    EventName: string;
    Channel: string;
    Parameters: string[];
    Method: string;
    ExeName: string;
};

import { Widget } from '..';

/**
 * [need more information]
 */
export interface TwTcisIntegration extends Widget<TwTcisIntegrationData> {}

export type TwTcisIntegrationData = {
    Urls: any[];
    Hub: string;
    Actions: TwTcisIntegrationAction[];
};
