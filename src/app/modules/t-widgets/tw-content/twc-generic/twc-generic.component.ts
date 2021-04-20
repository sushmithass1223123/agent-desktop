import { Component, ElementRef, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@modules/t-widgets/utils/widget-wrapper/twc-wrapper';
import { AOTWidgetService } from '@services/aot-widget.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { InteractionRef, InteractionWidgets, IWidget } from 'app/interfaces';
import { cloneDeep } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { GenericInteractionEvent, InteractionClosedEvent } from 'tmac-sdk';

/**
 * Generic Content Component
 */
@Component({
    selector: 'twc-generic',
    templateUrl: './twc-generic.component.html',
    styleUrls: ['./twc-generic.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcGenericComponent extends TWContentWrapper implements OnInit {
    /**
     * Holds all the interaction related widgets and process on new interacion for interaction content page
     */
    interactions: InteractionWidgets[] = [];

    /**
     * Currently active generic interaction
     */
    activeInteraction: number;

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
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to interaction events observable
        this._tmacEventService
            .getConstructDisposeEvents(['GenericInteractionEvent', 'InteractionClosedEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        // subscribe to active interaction observable
        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            // check if there are generic interactions first
            if (this.interactions.length > 0) {
                const textInteractions = interactions.filter((i) => i.type === 'generic');
                // filter and get the active generic interaction if any
                textInteractions.forEach((interaction: InteractionRef) => {
                    this.activeInteraction = interaction.isActive ? interaction.interactionId : this.activeInteraction;
                });
            }
        });
    }

    /**
     * To process GenericInteractionEvent
     */
    private GenericInteractionEvent(evt: GenericInteractionEvent): void {
        // get the content widgets
        const genericWidgets = cloneDeep(this.data.Data.Widgets) || [];

        const staticWidgets = genericWidgets.Static || [];
        const dynamicWidgets = (evt.WidgetConfigData && JSON.parse(evt.WidgetConfigData)) || genericWidgets.Dynamic || [];
        const aotWidgets = genericWidgets.AOT || [];

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
            type: 'generic',
            status: 'incoming',
            isActive: this.interactions.length === 1,
            user: evt.Item.CustomerIdentifier || 'Customer',
            path: this.data.Data.Path
        });
    }

    /**
     * To process InteractionClosedEvent
     */
    private InteractionClosedEvent(evt: InteractionClosedEvent): void {
        this.interactions = this.interactions.filter((i: InteractionWidgets) => i.interactionId !== evt.InteractionID);
        // if there are other item in the list auto select fist generic after closing current
        if (this.interactions.length > 0) {
            this._interactionManagerService.updateInteraction(this.interactions[0].interactionId, {
                isActive: true
            });
        }
    }

    /**
     * To parse the json string
     * 
     * @param {String} str 
     */
    private jsonParser(str: string): any {
        return JSON.parse(str);
    }

    /**
     * Some function
     */
    someFunction(): void {
        const sampleJson = {
            a: 1,
            b: 2,
            c: 3
        };

        const GenericEvent = {
            Item: {
                Data: JSON.stringify(sampleJson)
            }
        };

        const str = 'jsonParser(GenericEvent.Item.Data).b';
    }



}
