import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidget } from '@modules/t-widgets/utils';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { InteractionRef, InteractionWidgets, IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { InteractionManagerService } from 'app/services/interaction-manager.service';
import { takeUntil } from 'rxjs/operators';
import { InteractionClosedEvent, SDKClient, TextChatIncomingEvent } from 'tmac-sdk';

@Component({
    selector: 'twc-textchat',
    templateUrl: './twc-textchat.component.html',
    styleUrls: ['./twc-textchat.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcTextchatComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    pageActive: boolean;

    interactions: InteractionWidgets[] = [];
    activeInteraction: number;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to active interaction observable
        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (interactions: InteractionRef[]) => {
                    // check if there are textchat interactions first
                    if (this.interactions.length > 0) {
                        const textInteractions = interactions.filter(i => i.type === 'textchat');
                        // filter and get the active textchat interaction if any
                        textInteractions.forEach((interaction: InteractionRef) => {
                            this.activeInteraction = interaction.isActive ? interaction.interactionId : this.activeInteraction;
                        });
                    }
                }
            );

        // listen to TMAC events
        this.registerToEvents();
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    private registerToEvents(): void {
        // listen to incoming texchat event
        SDKClient.events.on('TextChatIncomingEvent', ((evt: TextChatIncomingEvent) => {
            const textchatWidgets: TWidget[] = [];
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
                    textchatWidgets.push(component);
                }
            });
            // push the interaction details with widgets to the list
            this.interactions.push({
                interactionId: evt.InteractionID,
                widgets: textchatWidgets,
                status: 'incoming'
            });

            // add the construct event to the interaction manager
            this._interactionManagerService.addInteraction({
                interactionId: evt.InteractionID,
                type: 'textchat',
                status: 'incoming',
                isActive: this.interactions.length === 1
            });

            // check if the page is active if not open it
            if (!this.pageActive && this.interactions.length === 1) {
                this.contentPageService.mode = this.data.Data.Path;
            }
        }));

        // listen to the interaction closed event and filter out the interaction
        SDKClient.events.on('InteractionClosedEvent', (evt: InteractionClosedEvent) => {
            this.interactions = this.interactions.filter((i: InteractionWidgets) => i.interactionId !== evt.InteractionID);
            // if there are other item in the list auto select fist chat after closing current
            if (this.interactions.length > 0) {
                this._interactionManagerService.updateInteraction(this.interactions[0].interactionId, 'isActive', true);
            }
        });
    }

    onActive = () => {
        this.pageActive = true;
    }
}
