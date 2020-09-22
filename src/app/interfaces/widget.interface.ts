import { TWidget } from '@modules/t-widgets/utils';

export interface IWidget {
    Name: string;
    ID: string;
    Description: string;
    Type: string;
    Config: IWidgetConfig;
    Data: any;
    InteractionDetails?: any;
    OnDestroy?: () => void;
}

export interface InteractionWidgets {
    interactionId: number;
    widgets: {
        static: TWidget[];
        dynamic: TWidget[];
        aot?: TWidget[]
    };
}

export interface IWidgetConfig {
    Static: boolean;
    Anchor: boolean;
    AOT: boolean;
    OIN: boolean;
    Icon: string;
    Class: string;
    Position: IWidgetPosition;
    Actions: ('restore' | 'maximize' | 'minimize' | 'destroy' | 'float')[];
    ViewState: 'restore' | 'maximize' | 'minimize' | 'hidden' | 'float';
    Header: boolean;
}

export interface IWidgetPosition {
    X: number;
    Y: number;
    H?: number;
    W?: number;
}
