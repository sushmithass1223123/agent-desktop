import { Type } from '@angular/core';
import { TWidget } from '../t-widget';

import { TwcUnknownComponent } from '@modules/t-widgets/tw-content/twc-unknown/twc-unknown.component';
import { TwcCustomComponent } from '@modules/t-widgets/tw-content/twc-custom/twc-custom.component';
import { TwcHomeComponent } from '@modules/t-widgets/tw-content/twc-home/twc-home.component';
import { TwcSupervisorComponent } from '@modules/t-widgets/tw-content/twc-supervisor/twc-supervisor.component';
import { TwcVoiceComponent } from '@modules/t-widgets/tw-content/twc-voice/twc-voice.component';

export class TWContentLibrary {

    static widgetLibrary: Record<string, Type<any>> = {
        // 'twc-sample': SampleContentComponent,
        'twc-home': TwcHomeComponent,
        'twc-voice': TwcVoiceComponent,
        'twc-supervisor': TwcSupervisorComponent,
        // 'twc-textchat': TextchatComponent,
        // 'twc-email': EmailComponent,
        'twc-custom': TwcCustomComponent
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
        return new TWidget(TwcUnknownComponent, data);
    }
}


