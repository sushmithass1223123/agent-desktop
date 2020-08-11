import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { SDKClient, IncomingCallEvent } from 'tmac-sdk';

@Component({
    selector: 'twc-voice',
    templateUrl: './twc-voice.component.html',
    styleUrls: ['./twc-voice.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcVoiceComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    voiceWidgets = [];
    interactionList: IncomingCallEvent[] = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        this.initWrapper(this.data);

        // get the content widgets
        const widgets = this.data.Data.Widgets || [];
        // loop and get the widgets
        widgets.forEach((widget: IWidget) => {
            // get the widget component by type
            const component = TWLibrary.getWidget(widget.Type, widget);
            // check if the component is proper
            if (component) {
                // append the widget component to the list
                this.voiceWidgets.push(component);
            }
        });

        // listen to TMAC events
        this.listenToTMACEvents();
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    listenToTMACEvents(): void {
        // listen to incoming call event
        SDKClient.events.on('IncomingCallEvent', ((evt: IncomingCallEvent) => {
            this.interactionList.push(evt);
        }));
    }
}
