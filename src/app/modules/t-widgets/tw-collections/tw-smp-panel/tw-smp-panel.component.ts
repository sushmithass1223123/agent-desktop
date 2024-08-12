import { TwSmpPanel } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';

/**
 * Smp Panel Component
 */
@Component({
    selector: 'tw-smp-panel',
    templateUrl: './tw-smp-panel.component.html',
    styleUrls: ['./tw-smp-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSmpPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds widget data
     */
    @Input() data: TwSmpPanel;

    /**
     * Holds all the email panel widgets
     */
    widgets = [];
    /**
     * Maxmized referenece for widgets
     */
    maximized = [
        {
            'tw-smp-controls': false,
            'tw-customer-details': false
        }
    ];
    /**
     * Collapsed referenece for widgets
     */
    collapsed = [
        {
            'tw-smp-controls': false,
            'tw-customer-details': false
        }
    ];
    /**
     * Floating referenece for widgets
     */
    floating = [
        {
            'tw-smp-controls': false,
            'tw-customer-details': false
        }
    ];

    constructor() {
        super('TwSmpPanelComponent');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * OnInit
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
            widget.Data.RouteOnInteraction = this.data.Data.RouteOnInteraction ?? false;
            this.maximized[widget.Type] = widget.Config.ViewState === 'maximize';
            this.collapsed[widget.Type] = widget.Config.ViewState === 'collapse';
            this.floating[widget.Type] = widget.Config.ViewState === 'float';
        });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
