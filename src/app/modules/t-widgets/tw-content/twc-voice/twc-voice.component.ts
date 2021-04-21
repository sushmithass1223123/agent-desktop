import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { InteractionRef, InteractionWidgets, IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { cloneDeep } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { IncomingCallEvent, InteractionClosedEvent, OutgoingCallEvent } from '@tmac/sdk';

/**
 * Voice content component
 */
@Component({
    selector: 'twc-voice',
    templateUrl: './twc-voice.component.html',
    styleUrls: ['./twc-voice.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcVoiceComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the interaction related widgets and process on new interacion for interaction content page
     */
    interactions: InteractionWidgets[] = [];
    /**
     * Currently active email interaction
     */
    activeInteraction: number;

    /**
     * Constructor
     * 
     * @param {ElementRef} hostElement
     * @param {ContentPageService} contentPageService
     * @param {TMACEventService} _tmacEventService
     * @param {InteractionManagerService} _interactionManagerService
     */
    constructor(
        hostElement: ElementRef,
        contentPageService: ContentPageService,
        private _tmacEventService: TMACEventService,
        private _interactionManagerService: InteractionManagerService,
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

        // subscribe to interaction events observable
        this._tmacEventService.getConstructDisposeEvents(['IncomingCallEvent', 'OutgoingCallEvent', 'InteractionClosedEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(evts => evts.forEach(evt => this[evt.EventName](evt)));

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

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To process IncomingCallEvent
     * 
     * @param {IncomingCallEvent} evt 
     */
    private IncomingCallEvent = (evt: IncomingCallEvent) => {
        this.incomingOutgoingCallEvent(evt);
    }

    /**
     * To process IncomingCallEvent
     * 
     * @param {OutgoingCallEvent} evt 
     */
    private OutgoingCallEvent = (evt: OutgoingCallEvent) => {
        this.incomingOutgoingCallEvent(evt);
    }

    /**
     * To process incoming or outgoing call event
     */
    private incomingOutgoingCallEvent = (evt: IncomingCallEvent | OutgoingCallEvent) => {

        // get the content widgets
        const voiceWidgets = cloneDeep(this.data.Data.Widgets) || [];

        const staticWidgets = voiceWidgets.Static || [];
        const dynamicWidgets = (evt.WidgetConfigData && JSON.parse(evt.WidgetConfigData)) || voiceWidgets.Dynamic || [];
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
            type: 'voice',
            status: evt.EventName === 'IncomingCallEvent' ? 'incoming' : 'outgoing',
            isActive: evt.EventName === 'OutgoingCallEvent' ? true : this.interactions.length === 1,
            user: evt.PhoneNumber,
            path: this.data.Data.Path,
            otherData: {}
        });
    }

    /**
     * To process interaction closed event for voice
     */
    private InteractionClosedEvent = (evt: InteractionClosedEvent) => {
        this.interactions = this.interactions.filter((i: InteractionWidgets) => i.interactionId !== evt.InteractionID);
        // if there are other item in the list auto select fist chat after closing current
        if (this.interactions.length > 0) {
            this._interactionManagerService.updateInteraction(this.interactions[0].interactionId, {
                isActive: true
            });
        }
    }
}
