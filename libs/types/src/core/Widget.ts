/**
 * Common widget Interface
 */
export interface Widget<T = any, K = any> {
    /**
     * Name of widget
     */
    Name: string;
    /**
     * Description of widget
     */
    Description: string;
    /**
     * Key of widget
     */
    Key: string;
    /**
     * Type of widget
     */
    Type: string;
    /**
     * Config of widget
     */
    Config: WidgetConfig;
    Data: T;
    /**
     * Widget Id
     */
    ID: string;
    /**
     * Widget Interaction Details
     */
    InteractionDetails?: K;
}

export interface InteractionWidget<T = any, K = undefined> extends Widget<T, K> {
    Data: InteractionWidgetBaseData & T;
}

export interface InteractionWidgetBaseData {
    /**
     * Path of route
     */
    Path?: string;
    /**
     * Route on interaction flag
     */
    RouteOnInteraction?: boolean;
}

export interface AOTWidget<T = any, K = undefined> extends Widget<T, K> {
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

export interface WidgetConfig {
    Enabled: boolean;
    Hidden: boolean;
    Static: boolean;
    Anchor: boolean;
    AOT: boolean;
    AutoOpen: boolean;
    Icon: string;
    Class: string;
    Position: WidgetPosition;
    Actions: WidgetAction[];
    ViewState: ViewState;
    Header: boolean;
    Pinned: boolean;
}

export type ViewState = 'maximize' | 'float' | 'restore' | 'collapse' | 'hidden';
export interface WidgetPosition {
    X: number;
    Y: number;
    W?: number;
    H?: number;
}

export type WidgetAction = 'maximize' | 'float' | 'restore' | 'collapse' | 'destroy' | 'refresh';
