import { IWidgetConfig } from 'app/interfaces';

export class TwWidgetModel {
    Name: string;
    Description: string;
    Type: string;
    Config: IWidgetConfig;
    Data: any;

    constructor(name: string, type: string, icon?: string) {
        this.Name = name || 'Widget';
        this.Description = '';
        this.Type = type || '';
        this.Config = {
            Static: false,
            Anchor: false,
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
