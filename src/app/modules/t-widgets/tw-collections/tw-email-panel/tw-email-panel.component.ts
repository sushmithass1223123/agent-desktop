import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';

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
    emailPanelWidgets = [];
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
        this.emailPanelWidgets = this.data.Data.Widgets || [];
        // get the interaction details
        const interactionDetails = this.data.InteractionDetails;
        // loop through the widgets and pass the interaction details
        this.emailPanelWidgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = interactionDetails;
            widget.Data.Path = this.data.Data.Path;
        });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }
}
