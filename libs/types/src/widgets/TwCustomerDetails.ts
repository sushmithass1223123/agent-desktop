export interface TwCustomerDetailsCustomerInfo {
    Title: string;
    ValueSource: string;
    Unit: string;
    DefaultValue: string;
    MaskData: TwCustomerDetailsMaskData;
}
export interface TwCustomerDetailsMaskData {
    MaskWith: string;
    MaxMaskedChars: number;
    UnMaskedStartChars: number;
    UnMaskedEndChars: number;
}

import { Widget } from '..';

export type TwCustomerDetails = Widget<TwCustomerDetailsData>;

export interface TwCustomerDetailsData {
    CustomerInfo: TwCustomerDetailsCustomerInfo[];
}
