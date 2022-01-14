import { IUIEvent } from '@tmac/sdk';

export interface IWidget<T = any, K = any> {
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
    Data: K;
    /**
     * Widget Interaction Details
     */
    InteractionDetails?: T;
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
     * Interaction details
     */
    interactionDetails: Partial<IUIEvent>;
    /**
     * Widgets
     */
    widgets: {
        /**
         * Static Widgets
         */
        static: IWidget[];
        /**
         * Dynamic Widgets
         */
        dynamic: IWidget[];
        /**
         * AOT widgets
         */
        aot?: IWidget[];
    };
}

export interface IWidgetConfig {
    /**
     * Enabled flag
     */
    Enabled: boolean;
    /**
     * Hidden widget flag
     */
    Hidden: boolean;
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
     * Flag to auto open AOT widget
     */
    AutoOpen: boolean;
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
    ViewState: 'restore' | 'maximize' | 'collapse' | 'hidden' | 'float';
    /**
     * Pinned widget
     */
    Pinned: boolean;
    /**
     * Header flag
     */
    Header: boolean;
}

export type IAction = 'restore' | 'maximize' | 'collapse' | 'destroy' | 'float' | 'pin' | 'refresh' | 'resize';

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
