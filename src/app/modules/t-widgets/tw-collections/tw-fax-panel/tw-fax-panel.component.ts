import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwFaxPanel } from '@ad/types';

/**
 * Fax Panel Component
 * A Static Widget
 * Nests Voice tw-fax-controls, tw-customer-journey
 */
@Component({
    selector: 'tw-fax-panel',
    templateUrl: './tw-fax-panel.component.html',
    styleUrls: ['./tw-fax-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwFaxPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds widget data
     */
    @Input() data: IWidget;

    /**
     * Holds all the fax panel widgets
     */
    widgets = [];
    /**
     * Maxmized referenece for widgets
     */
    maximized = [
        {
            'tw-fax-controls': false,
            'tw-customer-journey': false
        }
    ];
    /**
     * Collapsed referenece for widgets
     */
    collapsed = [
        {
            'tw-fax-controls': false,
            'tw-customer-journey': false
        }
    ];
    /**
     * Floating referenece for widgets
     */
    floating = [
        {
            'tw-fax-controls': false,
            'tw-customer-journey': false
        }
    ];

    constructor() {
        super('TwFaxPanelComponent');
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
        });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }
}
