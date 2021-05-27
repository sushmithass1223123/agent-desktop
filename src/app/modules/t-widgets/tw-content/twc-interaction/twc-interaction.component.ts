import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    FaxReceivedEvent,
    GenericInteractionEvent,
    IncomingCallEvent,
    IncomingEmailEvent,
    InteractionClosedEvent,
    OutgoingCallEvent,
    OutgoingEmailEvent,
    TextChatIncomingEvent,
    TUtils
} from '@tmac/sdk';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { InteractionRef, InteractionWidgets, IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { InteractionManagerService } from 'app/services/interaction-manager.service';
import { cloneDeep } from 'lodash';
import { takeUntil } from 'rxjs/operators';

/**
 * TwcInteractionComponent
 */
@Component({
    selector: 'twc-interaction',
    templateUrl: './twc-interaction.component.html',
    styleUrls: ['./twc-interaction.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcInteractionComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the interaction related widgets and process on new interacion for interaction content page
     */
    interactions: InteractionWidgets[] = [];

    /**
     * Currently active interaction
     */
    activeInteraction: number;

    /**
     * Type of content widget
     */
    type: string;

    /**
     * Is interaction flag
     */
    isInteraction: boolean;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService,
        private _tmacEventService: TMACEventService,
        private _aotWidgetService: AOTWidgetService
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // assign the type
        this.type = this.data.Type.replace('twc-', '');

        this.subscribeByType();
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To subscribe by type
     *
     */
    private subscribeByType(): void {
        let eventNames = [];

        switch (this.type.toLowerCase()) {
            case 'voice':
                eventNames = ['IncomingCallEvent', 'OutgoingCallEvent'];
                break;
            case 'textchat':
                eventNames = ['TextChatIncomingEvent'];
                break;
            case 'email':
                eventNames = ['IncomingEmailEvent', 'OutgoingEmailEvent'];
                break;
            case 'fax':
                eventNames = ['FaxReceivedEvent'];
                break;
            case 'generic':
                eventNames = ['GenericInteractionEvent'];
                break;
        }

        if (eventNames.length) {
            // subscribe to interaction events observable
            this._tmacEventService
                .getConstructDisposeEvents([...eventNames, 'InteractionClosedEvent'])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

            // subscribe to active interaction observable
            this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
                // check if there are interactions first
                if (this.interactions.length > 0) {
                    interactions
                        .filter((i) => i.type === this.type)
                        .forEach((interaction: InteractionRef) => {
                            this.activeInteraction = interaction.isActive ? interaction.interactionId : this.activeInteraction;
                        });
                }
            });
        }
    }

    /**
     * To create static, dynamic, AOT widget list
     *
     * @param {Any} evt
     * @param {String} status
     * @param {String} user
     * @param {Boolean} forceActive
     * @param {Any} otherData
     */
    private createWidgetList(evt: any, status: string, user: string, forceActive: boolean, otherData: any): void {
        // get the content widgets
        const emailWidgets = cloneDeep(this.data.Data.Widgets) || [];

        const staticWidgets = emailWidgets.Static || [];
        const dynamicWidgets = (evt.WidgetConfigData && JSON.parse(evt.WidgetConfigData)) || emailWidgets.Dynamic || [];
        const aotWidgets = emailWidgets.AOT || [];

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
            widget.ID = TUtils.Generic.uuid();
            widget.InteractionDetails = evt;
            widget.Data.Path = this.data.Data.Path;
        });

        // process aot widgets
        this._aotWidgetService.processAOTWidgets(aotWidgets);

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
            type: this.type,
            status: status,
            isActive: this.interactions.length === 1 || forceActive,
            user: user || 'Customer',
            path: this.data.Data.Path,
            otherData: otherData
        });
    }

    /**
     * To process IncomingCallEvent
     *
     * @param {IncomingCallEvent} evt
     */
    IncomingCallEvent(evt: IncomingCallEvent): void {
        this.createWidgetList(evt, 'incoming', evt.PhoneNumber, false, {});
    }

    /**
     * To process IncomingCallEvent
     *
     * @param {OutgoingCallEvent} evt
     */
    OutgoingCallEvent(evt: OutgoingCallEvent): void {
        this.createWidgetList(evt, 'outgoing', evt.PhoneNumber, true, {});
    }

    /**
     * To process TextChatIncomingEvent
     */
    TextChatIncomingEvent(evt: TextChatIncomingEvent): void {
        this.createWidgetList(evt, 'incoming', '', false, { unreadCount: 0 });
    }

    /**
     * To process IncomingEmailEvent
     * @param {IncomingEmailEvent} evt
     */
    IncomingEmailEvent(evt: IncomingEmailEvent): void {
        // create email widgets
        this.createWidgetList(evt, 'connected', evt.From, false, evt);
    }

    /**
     * To process OutgoingEmailEvent
     * @param {OutgoingEmailEvent} evt
     */
    OutgoingEmailEvent(evt: OutgoingEmailEvent): void {
        // create email widgets
        this.createWidgetList(evt, 'connected', 'Customer', true, evt);
    }

    /**
     * To process FaxReceivedEvent
     */
    FaxReceivedEvent(evt: FaxReceivedEvent): void {
        this.createWidgetList(evt, 'connected', evt.FaxNumber, false, {});
    }

    /**
     * To process GenericInteractionEvent
     */
    GenericInteractionEvent(evt: GenericInteractionEvent): void {
        this.createWidgetList(evt, 'connected', evt.Item.CustomerIdentifier, false, {});
    }

    /**
     * To process interaction closed event for voice
     */
    InteractionClosedEvent(evt: InteractionClosedEvent): void {
        // close all the AOTs
        this.interactions.forEach(i => {
            if (i.interactionId === evt.InteractionID) {
                i.widgets.aot.forEach(widget => {
                    this._aotWidgetService.destroyWidget(widget.ID);
                });
            }
        });

        // filter out the interaction
        this.interactions = this.interactions.filter((i: InteractionWidgets) => i.interactionId !== evt.InteractionID);

        // if there are other item in the list auto select fist chat after closing current
        if (this.interactions.length > 0) {
            this._interactionManagerService.updateInteraction(this.interactions[0].interactionId, {
                isActive: true
            });
        }
    }
}
