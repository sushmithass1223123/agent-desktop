import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';

/**
 * Email Panel Component
 */
@Component({
    selector: 'tw-email-panel',
    templateUrl: './tw-email-panel.component.html',
    styleUrls: ['./tw-email-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwEmailPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds widget data
     */
    @Input() data: IWidget;

    /**
     * Holds all the email panel widgets
     */
    widgets = [];
    /**
     * Maxmized referenece for widgets
     */
    maximized = [
        {
            'tw-email-controls': false,
            'tw-customer-journey': false
        }
    ];
    /**
     * Collapsed referenece for widgets
     */
    collapsed = [
        {
            'tw-email-controls': false,
            'tw-customer-journey': false
        }
    ];
    /**
     * Floating referenece for widgets
     */
    floating = [
        {
            'tw-email-controls': false,
            'tw-customer-journey': false
        }
    ];

    constructor() {
        super();
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
