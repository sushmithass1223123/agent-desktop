import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { InteractionRef, InteractionWidgets, IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { InteractionManagerService } from 'app/services/interaction-manager.service';
import { takeUntil } from 'rxjs/operators';
import { InteractionClosedEvent, TextChatIncomingEvent } from 'tmac-sdk';

@Component({
    selector: 'twc-textchat',
    templateUrl: './twc-textchat.component.html',
    styleUrls: ['./twc-textchat.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcTextchatComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    interactions: InteractionWidgets[] = [];
    activeInteraction: number;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService,
        private _interactionEventService: TMACEventService
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
                if (evt.EventName === 'TextChatIncomingEvent') {
                    this.textChatIncomingEvent(evt);
                }
                else if (evt.EventName === 'InteractionClosedEvent') {
                    this.interactionClosed(evt);
                }
            });

        // subscribe to active interaction observable
        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                // check if there are textchat interactions first
                if (this.interactions.length > 0) {
                    const textInteractions = interactions.filter(i => i.type === 'textchat');
                    // filter and get the active textchat interaction if any
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

    private textChatIncomingEvent = (evt: TextChatIncomingEvent) => {

        // get the content widgets
        const textchatWidgets = this.data.Data.Widgets || [];

        const staticWidgets = textchatWidgets.Static || [];
        const dynamicWidgets = textchatWidgets.Dynamic || [];
        const aotWidgets = textchatWidgets.AOT || [];

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
            type: 'textchat',
            status: 'incoming',
            isActive: this.interactions.length === 1,
            user: 'Customer',
            path: this.data.Data.Path,
            otherData: {
                unreadCount: 0
            }
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
