import { IWidgetConfig } from 'app/interfaces';
import { TUtils } from 'tmac-sdk';

export class TwWidgetModel {
    Name: string;
    ID: string;
    Description: string;
    Type: string;
    Config: IWidgetConfig;
    Data: any;
    InteractionDetails?: any;

    constructor(name: string, type: string, icon?: string) {
        this.Name = name || 'Widget';
        this.ID = TUtils.Generic.uuid();
        this.Description = '';
        this.Type = type || '';
        this.Config = {
            Static: false,
            Anchor: false,
            AOT: false,
            Icon: icon || 'widgets',
            Class: '',
            Position: {
                X: 0,
                Y: 0
            },
            Actions: [],
            ViewState: 'restore',
            PinState: false,
            FloatState: false,
            Resizable: false,
            Header: true,
            Disabled: false
        };
        this.Data = new Object();
    }
}
