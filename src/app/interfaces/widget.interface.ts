import { TWidget } from '@modules/t-widgets/utils';

export interface IWidget {
    Name: string;
    ID: string;
    Description: string;
    Type: string;
    Config: IWidgetConfig;
    Data: any;
    InteractionDetails?: any;
    destroy?: () => void;
    OnDestroy?: () => boolean;
}

export interface InteractionWidgets {
    interactionId: number;
    widgets: {
        static: TWidget[];
        dynamic: TWidget[];
        aot?: TWidget[];
    };
}

export interface IWidgetConfig {
    Enabled: boolean;
    Static: boolean;
    Anchor: boolean;
    AOT: boolean;
    Icon: string;
    Class: string;
    Position: IWidgetPosition;
    Actions: IAction[];
    ViewState: 'restore' | 'maximize' | 'minimize' | 'hidden' | 'float';
    Header: boolean;
}

export type IAction = 'restore' | 'maximize' | 'minimize' | 'destroy' | 'float';

export interface IWidgetPosition {
    X: number;
    Y: number;
    H?: number;
    W?: number;
}
