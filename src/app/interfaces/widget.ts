import { TWidget } from '@modules/t-widgets/utils';

export interface IWidget {
    Name: string;
    Description: string;
    Type: string;
    Config: IWidgetConfig;
    Data: any;
    InteractionDetails?: any;
}

export interface InteractionWidgets {
    interactionId: number;
    widgets: TWidget[];
}

export interface IWidgetConfig {
    Static: boolean;
    Anchor: boolean;
    Icon: string;
    Class: string;
    Position: IWidgetPosition;
    Actions: any[];
    ViewState: string;
    PinState: boolean;
    FloatState: boolean;
    Resizable: boolean;
    Header: boolean;
    Disabled: boolean;
}

export interface IWidgetPosition {
    X: number;
    Y: number;
}
