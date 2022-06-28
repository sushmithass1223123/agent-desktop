import { WidgetConfig } from '@ad/types';
import { TUtils } from '@tmac/sdk';
/**
 * Widget model
 */
export class TwWidgetModel {
    /**
     * Name of the widget
     */
    Name: string;
    /**
     * ID of the widget
     */
    ID: string;
    /**
     * Description for the widget
     */
    Description: string;
    /**
     * Type of widget
     */
    Type: string;
    /**
     * Configuration object of widget of type WidgetConfig
     */
    Config: WidgetConfig;
    /**
     * Any extra data for the widget
     */
    Data: any;
    /**
     * [OPTIONAL] For interaction widget to pass interaction details
     */
    InteractionDetails?: any;
    /**
     * [OPTIONAL] To destory the widget
     */
    destroy?: () => void;
    /**
     * [OPTIONAL] To trigger an event before destroying the widget
     */
    OnDestroy?: () => boolean;

    constructor(name: string, type: string, icon?: string) {
        this.Name = name || 'Widget';
        this.ID = TUtils.Generic.uuid();
        this.Description = '';
        this.Type = type || '';
        this.Config = {
            Enabled: true,
            Hidden: false,
            Static: false,
            Anchor: false,
            AOT: false,
            AutoOpen: false,
            LocalAOT: false,
            Icon: icon || 'widgets',
            Class: '',
            Position: {
                X: 0,
                Y: 0
            },
            Actions: [],
            ViewState: 'restore',
            Pinned: false,
            Header: true
        };
        this.Data = new Object();
    }
}
