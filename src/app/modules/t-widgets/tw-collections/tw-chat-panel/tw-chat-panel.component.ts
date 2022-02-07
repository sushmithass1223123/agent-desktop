import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwChatPanel } from '@ad/types';

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
export class TwChatPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * To hold all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * To hold chat panel widget
     */
    widgets = [];
    /**
     * ID of the interaction
     */
    interactionId: number;
    /**
     * Maximized flag for each chat panel widget
     */
    maximized = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false
        }
    ];
    /**
     * * Collapsed flag for each chat panel widget
     */
    collapsed = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false
        }
    ];
    /**
     * * Floating flag for each chat panel widget
     */
    floating = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false
        }
    ];

    /**
     * Constructor
     */
    constructor() {
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
        this.widgets = this.data.Data.Widgets.filter((w: IWidget) => w.Config.Enabled);
        // loop through the widgets and pass the interaction details
        this.widgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = this.data.InteractionDetails;
            widget.Data.Path = this.data.Data.Path;
            widget.Data.RouteOnInteraction = this.data.Data.RouteOnInteraction ?? true;
            this.maximized[widget.Type] = widget.Config.ViewState === 'maximize';
            this.collapsed[widget.Type] = widget.Config.ViewState === 'collapse';
            this.floating[widget.Type] = widget.Config.ViewState === 'float';
        });
    }
    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
