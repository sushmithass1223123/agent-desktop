import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidget } from '@modules/t-widgets/utils';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { IncomingCallEvent, InteractionClosedEvent, SDKClient } from 'tmac-sdk';

@Component({
    selector: 'twc-voice',
    templateUrl: './twc-voice.component.html',
    styleUrls: ['./twc-voice.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcVoiceComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    interactions: InteractionVoiceWidgets[] = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        this.initWrapper(this.data);

        // listen to TMAC events
        this.registerToEvents();
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    private registerToEvents(): void {
        // listen to incoming call event
        SDKClient.events.on('IncomingCallEvent', ((evt: IncomingCallEvent) => {
            const voiceWidgets: TWidget[] = [];
            // get the content widgets
            const widgets = this.data.Data.Widgets || [];
            // loop and get the widgets
            widgets.forEach((widget: IWidget) => {
                // add the interaction details
                widget.InteractionDetails = evt;
                // get the widget component by type
                const component = TWLibrary.getWidget(widget.Type, widget);
                // check if the component is proper
                if (component) {
                    // append the widget component to the list
                    voiceWidgets.push(component);
                }
            });
            // push the interaction details with widgets to the list
            this.interactions.push({
                interactionId: evt.InteractionID,
                widgets: voiceWidgets
            });
        }));

        // listen to the interaction closed event and filter out the interaction
        SDKClient.events.on('InteractionClosedEvent', (evt: InteractionClosedEvent) => {
            this.interactions = this.interactions.filter((i: InteractionVoiceWidgets) => i.interactionId !== evt.InteractionID);
        });
    }
}

interface InteractionVoiceWidgets {
    interactionId: number;
    widgets: TWidget[];
}
