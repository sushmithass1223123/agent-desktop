import { Widget } from '..';

export type TwCannedResponses = Widget<TwCannedResponsesData>;

export interface TwCannedResponsesData {
    ResponseMode: string;
    EditAllowed: boolean;
}
