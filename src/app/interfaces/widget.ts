import { TWidget } from '@modules/t-widgets/utils';

export interface IWidget {
    Name: string;
    Description: string;
    Type: string;
    Config: any;
    Data: any;
    InteractionDetails?: any;
}

export interface InteractionWidgets {
    interactionId: number;
    widgets: TWidget[];
    status: string;
}
