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
    Key?: string;
    /**
     * Type of widget
     */
    Type: string;
    /**
     * Config of widget
     */
    Config: WidgetConfig;
    /**
     * Widget data
     */
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
     * NOTE: This is application only for AOT widgets
     */
    AutoOpen: boolean;
    /**
     * Flag to open AOT within the interaction page.
     * NOTE: This is application only for Interaction AOT's
     */
    LocalAOT: boolean;
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
    Position: WidgetPosition;
    /**
     * Available widget actions
     */
    Actions: WidgetAction[];
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

export type ViewState = 'maximize' | 'float' | 'restore' | 'collapse' | 'hidden';

export interface WidgetPosition {
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

export type WidgetAction = 'maximize' | 'float' | 'restore' | 'collapse' | 'destroy' | 'refresh' | 'resize';
