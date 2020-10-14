import { TWidget } from '@modules/t-widgets/utils';

export interface IWidget {
    /**
     * Name of the Widget
     */
    Name: string;
    /**
     * Widget Key
     */
    Key?: string;
    /**
     * Widget Id
     */
    ID: string;
    /**
     * Widget Description
     */
    Description: string;
    /**
     * Type of widget from widget library
     */
    Type: string;
    /**
     * Widget Configs
     */
    Config: IWidgetConfig;
    /**
     * Widget Custom Data
     */
    Data: any;
    /**
     * Widget Interaction Details
     */
    InteractionDetails?: any;
    /**
     * Need more description
     * Widget on destroy callback
     */
    destroy?: () => void;
    /**
     * Need more description
     * Widget on destroy callback
     */
    OnDestroy?: () => boolean;
}

export interface InteractionWidgets {
    /**
     * Interaction Id
     */
    interactionId: number;
    /**
     * Widgets
     */
    widgets: {
        /**
         * Static Widgets
         */
        static: TWidget[];
        /**
         * Dynamic Widgets
         */
        dynamic: TWidget[];
        /**
         * AOT widgets
         */
        aot?: TWidget[];
    };
}

export interface IWidgetConfig {
    /**
     * Enabled flag
     */
    Enabled: boolean;
    /**
     * Static flag
     */
    Static: boolean;
    /**
     * Anchor flag
     */
    Anchor: boolean;
    /**
     * AOT flag
     */
    AOT: boolean;
    /**
     * Icon of Widget
     */
    Icon: string;
    /**
     * class of widget
     */
    Class: string;
    /**
     * Widget position
     */
    Position: IWidgetPosition;
    /**
     * Available widget actions
     */
    Actions: IAction[];
    /**
     * Initail state of widget
     */
    ViewState: 'restore' | 'maximize' | 'minimize' | 'hidden' | 'float';
    /**
     * Pinned widget
     */
    Pinned: boolean;
    /**
     * Header flag
     */
    Header: boolean;
}

export type IAction = 'restore' | 'maximize' | 'minimize' | 'destroy' | 'float';

export interface IWidgetPosition {
    /**
     * X axis position
     */
    X: number;
    /**
     * Y axis position
     */
    Y: number;
    /**
     * Height of widget
     */
    H?: number;
    /**
     * Width of widget
     */
    W?: number;
}
