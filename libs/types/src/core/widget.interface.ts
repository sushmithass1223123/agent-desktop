/**
 * Common widget Interface
 */
export type Widget<T = any> = {
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
};

/**
 * Common interaction widget Interface
 */
export type InteractionWidget<
    /**
     * Data config for an interaction widget
     */
    T = any,
    /**
     * Interaction event for an interaction event
     */
    K = any
> = Widget<T> & {
    /**
     * Config data for the interaction widget
     */
    Data: InteractionWidgetBaseData & T;
    /**
     * Widget Interaction Details
     */
    InteractionDetails: K;
};

export type InteractionWidgetBaseData = {
    /**
     * Path of route
     */
    Path?: string;
    /**
     * Flag to enable route on interaction
     */
    RouteOnInteraction?: boolean;
};

export type AOTWidget<T = any, K = undefined> = Widget<T> & {
    /**
     * Widget Interaction Details
     */
    InteractionDetails?: K;
    /**
     * FOR INTERNAL USAGE
     * Widget destroy function
     */
    destroy?: () => void;
    /**
     * FOR INTERNAL USAGE
     * Widget on destroy callback
     */
    OnDestroy?: () => boolean;
};

export type WidgetConfig = {
    /**
     * Flag to enable this widget
     */
    Enabled: boolean;
    /**
     * Flag to hide this widget
     */
    Hidden: boolean;
    /**
     * Flag to make this widget static
     */
    Static: boolean;
    /**
     * Flag to make this widget anchored
     */
    Anchor: boolean;
    /**
     * Flag to make this widget AOT
     */
    AOT: boolean;
    /**
     * Flag to auto open AOT widget
     * NOTE: This is applicable only for AOT widgets
     */
    AutoOpen: boolean;
    /**
     * Flag to open AOT within the interaction page.
     * NOTE: This is applicable only for Interaction AOT's
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
     * Flag to allow this widget to be pinned
     */
    Pinned: boolean;
    /**
     * Flag to show the header
     */
    Header: boolean;
};

export type ViewState = 'maximize' | 'float' | 'restore' | 'collapse' | 'hidden';

export type WidgetPosition = {
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
};

/**
 * Available states of the widgets
 */
export type WidgetAction = 'maximize' | 'float' | 'restore' | 'collapse' | 'destroy' | 'refresh' | 'resize';
