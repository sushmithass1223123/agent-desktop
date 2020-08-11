import { Type } from '@angular/core';
import { TWidget } from '../t-widget';
import { TwUnknownComponent } from '@modules/t-widgets/tw-collections/tw-unknown/tw-unknown.component';
import { TwCustomComponent } from '@modules/t-widgets/tw-collections/tw-custom/tw-custom.component';
import { TwSampleComponent } from '@modules/t-widgets/tw-collections/tw-sample/tw-sample.component';
import { TwWallboardComponent } from '@modules/t-widgets/tw-collections/tw-wallboard/tw-wallboard.component';

export class TWLibrary {

    static widgetLibrary: Record<string, Type<any>> = {
        'tw-sample': TwSampleComponent,
        'tw-custom': TwCustomComponent,
        'tw-wallbaord': TwWallboardComponent
    };

    public static getAllWidgets(): Record<string, Type<any>> {
        return { ...this.widgetLibrary };
    }

    public static getWidget(type: string, data: any): TWidget {
        const widget = this.widgetLibrary[type];
        // check the widget is found
        if (widget) {
            // retrun the widget
            return new TWidget(widget, data);
        }
        // if widget is not found return unknown widget
        return new TWidget(TwUnknownComponent, data);
    }
}


