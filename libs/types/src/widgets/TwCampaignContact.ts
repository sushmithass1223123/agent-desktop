export interface TwCampaignContactCustomerInfo {
    Title: string;
    ValueSource: string;
    DefaultValue: string;
}

import { Widget } from '..';

export type TwCampaignContact = Widget<TwCampaignContactData>;

export interface TwCampaignContactData {
    CustomerInfo: TwCampaignContactCustomerInfo[];
}
