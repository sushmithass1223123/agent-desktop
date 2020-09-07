import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { InteractionEventService } from '@services/interaction-event.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { InteractionWidgets, IWidget, InteractionRef } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { takeUntil } from 'rxjs/operators';
import { IncomingCallEvent, InteractionClosedEvent } from 'tmac-sdk';

@Component({
    selector: 'twc-voice',
    templateUrl: './twc-voice.component.html',
    styleUrls: ['./twc-voice.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcVoiceComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    interactions: InteractionWidgets[] = [];
    activeInteraction: number;

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

        // subscribe to active interaction observable
        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                // check if there are voice interactions first
                if (this.interactions.length > 0) {
                    const textInteractions = interactions.filter(i => i.type === 'voice');
                    // filter and get the active voice interaction if any
                    textInteractions.forEach((interaction: InteractionRef) => {
                        this.activeInteraction = interaction.isActive ? interaction.interactionId : this.activeInteraction;
                    });
                }
            });
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    private incomingCallEvent = (evt: IncomingCallEvent) => {

        // get the content widgets
        const voiceWidgets = this.data.Data.Widgets || [];

        const staticWidgets = voiceWidgets.Static || [];
        const dynamicWidgets = voiceWidgets.Dynamic || [];
        const aotWidgets = voiceWidgets.AOT || [];

        // loop the widgets and add append interaction details
        staticWidgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = evt;
            widget.Data.Path = this.data.Data.Path;
        });

        dynamicWidgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = evt;
            widget.Data.Path = this.data.Data.Path;
        });

        aotWidgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = evt;
            widget.Data.Path = this.data.Data.Path;
        });

        // push the interaction details with widgets to the list
        this.interactions.push({
            interactionId: evt.InteractionID,
            widgets: {
                static: staticWidgets,
                dynamic: dynamicWidgets,
                aot: aotWidgets
            }
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
                isActive: true
            });
        }
    }
}
