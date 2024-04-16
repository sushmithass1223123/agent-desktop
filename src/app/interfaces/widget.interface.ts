import { AOTWidget, WidgetConfig } from '@ad/types';
import { IUIEvent } from '@tmac/sdk';
import { Observable } from 'rxjs';

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
    Config: WidgetConfig;
    /**
     * Widget Extra Configs
     */
    ExtraConfig?: T;
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
        /**
         * Local AOT widgets observable
         */
        localAOT$: Observable<AOTWidget<any, any>[]>;
    };
}
