import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidget } from '@modules/t-widgets/utils';
import { InteractionEventService } from '@services/interaction-event.service';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
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

    @Input() data: any;

    // TODO-1 dependancy
    // textchatWidgets: TWidget[] = [];

    interactions: InteractionWidgets[] = [];
    activeInteraction: number;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService,
        private _interactionEventService: InteractionEventService
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

        // TODO-1:: check if any impact on doing on event then do it here
        // // get the content widgets
        // const widgets = this.data.Data.Widgets || [];

        // // loop and get the widgets
        // widgets.forEach((widget: IWidget) => {
        //     // get the widget component by type
        //     const component = TWLibrary.getWidget(widget.Type, widget);
        //     // check if the component is proper
        //     if (component) {
        //         // append the widget component to the list
        //         this.textchatWidgets.push(component);
        //     }
        // });
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    private textChatIncomingEvent = (evt: TextChatIncomingEvent) => {

        // TODO-1 dependancy
        // // createa a copy of textchat widgets
        // const textchatWidgets: TWidget[] = [...this.textchatWidgets];

        // create a copy of textchat widgets
        const textchatWidgets: TWidget[] = [];

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
                textchatWidgets.push(component);
            }
        });

        // TODO-1 dependancy
        // // append the interaction details to the widget data
        // textchatWidgets.forEach((item: TWidget) => {
        //     item.data.InteractionDetails = evt;
        //     item.data.Path = this.data.Data.Path;
        // });

        // push the interaction details with widgets to the list
        this.interactions.push({
            interactionId: evt.InteractionID,
            widgets: textchatWidgets
        });

        // add the construct event to the interaction manager
        this._interactionManagerService.addInteraction({
            interactionId: evt.InteractionID,
            type: 'textchat',
            status: 'incoming',
            isActive: this.interactions.length === 1,
            user: 'Customer',
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
