import { Type } from '@angular/core';
import { TWidget } from '../t-widget';
import { TwUnknownComponent } from '@modules/t-widgets/tw-collections/tw-unknown/tw-unknown.component';
import { TwCustomComponent } from '@modules/t-widgets/tw-collections/tw-custom/tw-custom.component';
import { TwSampleComponent } from '@modules/t-widgets/tw-collections/tw-sample/tw-sample.component';
import { TwWallboardComponent } from '@modules/t-widgets/tw-collections/tw-wallboard/tw-wallboard.component';
import { TwVoicePanelComponent } from '@modules/t-widgets/tw-collections/tw-voice-panel/tw-voice-panel.component';
import { TwAdTotalCallsComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-calls/tw-ad-total-calls.component';
import { TwAdTotalChatsComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-chats/tw-ad-total-chats.component';
import { TwAdTotalAvComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-av/tw-ad-total-av.component';
import { TwAdTotalInteractionsComponent } from '@modules/t-widgets/tw-collections/tw-ad-total-interactions/tw-ad-total-interactions.component';
import { TwAdInteractionDetailsComponent } from '@modules/t-widgets/tw-collections/tw-ad-interaction-details/tw-ad-interaction-details.component';
import { TwAdCallbacksComponent } from '@modules/t-widgets/tw-collections/tw-ad-callbacks/tw-ad-callbacks.component';

export class TWLibrary {
    static widgetLibrary: Record<string, Type<any>> = {
        'tw-sample': TwSampleComponent,
        'tw-custom': TwCustomComponent,
        'tw-wallbaord': TwWallboardComponent,
        'tw-voice-panel': TwVoicePanelComponent,
        'tw-ad-total-calls': TwAdTotalCallsComponent,
        'tw-ad-total-interactions': TwAdTotalInteractionsComponent,
        'tw-ad-total-av': TwAdTotalAvComponent,
        'tw-ad-total-chats': TwAdTotalChatsComponent,
        'tw-ad-interaction-details': TwAdInteractionDetailsComponent,
        'tw-ad-callbacks': TwAdCallbacksComponent
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
