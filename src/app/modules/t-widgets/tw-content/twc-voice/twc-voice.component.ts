import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidget } from '@modules/t-widgets/utils';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget, InteractionWidgets } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { IncomingCallEvent, InteractionClosedEvent, SDKClient } from 'tmac-sdk';
import { InteractionEventService } from '@services/interaction-event.service';
import { takeUntil } from 'rxjs/operators';
import { InteractionManagerService } from '@services/interaction-manager.service';

@Component({
    selector: 'twc-voice',
    templateUrl: './twc-voice.component.html',
    styleUrls: ['./twc-voice.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcVoiceComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    interactions: InteractionWidgets[] = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _interactionEventService: InteractionEventService,
        private _interactionManagerService: InteractionManagerService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to interaction events observable
        this._interactionEventService.constructDisposeEvents
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evt: any) => {
                // filter the event name
                if (evt.EventName === 'IncomingCallEvent') {
                    this.incomingCallEvent(evt);
                }
                else if (evt.EventName === 'InteractionClosedEvent') {
                    this.interactionClosed(evt);
                }
            });
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    private incomingCallEvent = (evt: IncomingCallEvent) => {
        const voiceWidgets: TWidget[] = [];
        // get the content widgets
        const widgets = this.data.Data.Widgets || [];
        // loop and get the widgets
        widgets.forEach((widget: IWidget) => {
            // append the interaction details to the widget data
            widget.InteractionDetails = evt;
            // append the path to the widget data
            widget.Data.Path = this.data.Data.Path;
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

        // add the construct event to the interaction manager
        this._interactionManagerService.addInteraction({
            interactionId: evt.InteractionID,
            type: 'voice',
            status: 'incoming',
            isActive: this.interactions.length === 1,
            user: evt.PhoneNumber,
            path: this.data.Data.Path,
            otherData: {}
        });
    }

    private interactionClosed = (evt: InteractionClosedEvent) => {
        this.interactions = this.interactions.filter((i: InteractionWidgets) => i.interactionId !== evt.InteractionID);
        // if there are other item in the list auto select fist chat after closing current
        if (this.interactions.length > 0) {
            this._interactionManagerService.updateInteraction(this.interactions[0].interactionId, {
                'isActive': true
            });
        }
    }
}
