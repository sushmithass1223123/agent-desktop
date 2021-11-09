import { Widget } from '..';

export type TwAccountInformation = Widget<TwAccountInformationData, TwAccountInformationInteraction>;
export interface TwAccountInformationData {
    IsAuthenticated: true;
}

export interface TwAccountInformationInteraction {
    InteractionID: number;
    PhoneNumber: string;
}
