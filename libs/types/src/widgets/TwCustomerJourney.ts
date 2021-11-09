import { Widget } from '..';

export type TwCustomerJourney = Widget<TwCustomerJourneyData>;

export interface TwCustomerJourneyData {
    IframeBaseUrl: string;
    NoOfRecords: number;
    SentimentDashboardUrl: string;
    Columns: any[];
}
