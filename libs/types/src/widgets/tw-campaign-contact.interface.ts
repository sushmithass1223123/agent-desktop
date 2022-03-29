export interface TwCampaignContactCustomerInfo {
    Title: string;
    ValueSource: string;
    DefaultValue: string;
}

import { InteractionWidget } from '..';

/**
 * WIP
 * @ignore
 */
export interface TwCampaignContact<T> extends InteractionWidget<TwCampaignContactData, T> {}

/**
 * Campaign contact widget's config data
 * @ignore
 */
export type TwCampaignContactData = {
    CustomerInfo: TwCampaignContactCustomerInfo[];
    ReasonEnabled: boolean;
};
