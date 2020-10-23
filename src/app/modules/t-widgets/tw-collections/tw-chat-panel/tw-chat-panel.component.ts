import {
    AfterViewInit,
    Component,
    ComponentFactoryResolver,
    Input,
    OnDestroy,
    OnInit,
    Type,
    ViewChild,
    ViewContainerRef,
    ViewEncapsulation
} from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwChatControlsComponent } from '../tw-chat-controls/tw-chat-controls.component';
import { TwCustomerDetailsComponent } from '../tw-customer-details/tw-customer-details.component';
import { TwCustomerJourneyComponent } from '../tw-customer-journey/tw-customer-journey.component';

/**
 * Chat Panel Component
 * A Static Widget
 * Nests Voice tw-voice-controls , tw-customer-details , tw-customer-journey
 */
@Component({
    selector: 'tw-chat-panel',
    templateUrl: './tw-chat-panel.component.html',
    styleUrls: ['./tw-chat-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwChatPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * To hold all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Widget template
     */
    @ViewChild('widgetTemplate', { read: ViewContainerRef, static: true }) widgetTemplate: ViewContainerRef;
    /**
     * To hold chat panel widget
     */
    chatPanelWidgets = [];
    /**
     * ID of the interaction
     */
    interactionId: number;

    /**
     * Static widget collection
     */
    widgetLibrary: Record<string, Type<any>> = {
        'tw-chat-controls': TwChatControlsComponent,
        'tw-customer-details': TwCustomerDetailsComponent,
        'tw-customer-journey': TwCustomerJourneyComponent
    };

    /**
     * Constructor
     */
    constructor(private _componentFactoryResolver: ComponentFactoryResolver) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // get the toolbar menu widgets
        this.chatPanelWidgets = this.data.Data.Widgets || [];
        // get the interaction details
        const interactionDetails = this.data.InteractionDetails;
        // loop through the widgets and pass the interaction details
        this.chatPanelWidgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = interactionDetails;
            widget.Data.Path = this.data.Data.Path;
        });
    }
    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    /**
     * After View Init
     */
    ngAfterViewInit(): void {
        this.chatPanelWidgets?.forEach((widget: IWidget) => {
            // filter and load the enabled widgets
            if (widget.Config.Enabled) {
                this.loadComponent(widget);
            }
        });
    }

    /**
     * Lifecycle Hook
     * @method
     */
    private loadComponent(widgetModel: IWidget): void {

        // create the component factory
        const componentFactory = this._componentFactoryResolver.resolveComponentFactory(this.widgetLibrary[widgetModel.Type]);

        // get the view container reference from widget host
        const componentRef = this.widgetTemplate.createComponent(componentFactory);

        // add the data params
        componentRef.instance.data = widgetModel;
    }
}
