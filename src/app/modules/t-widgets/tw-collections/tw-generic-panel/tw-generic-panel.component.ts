import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwGenericPanel } from '@ad/types';

/**
 * Generic Panel Component
 */
@Component({
    selector: 'tw-generic-panel',
    templateUrl: './tw-generic-panel.component.html',
    styleUrls: ['./tw-generic-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwGenericPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: IWidget;

    /**
     * Gentic panel Widget list
     */
    widgets = [];

    /**
     * Default values for maximize state
     */
    maximized = [
        {
            'tw-generic-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false
        }
    ];

    /**
     * Default values for collapsed state
     */
    collapsed = [
        {
            'tw-generic-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false
        }
    ];

    /**
     * Default values for floating state
     */
    floating = [
        {
            'tw-generic-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false
        }
    ];

    constructor() {
        super('TwGenericPanelComponent');
    }

    /**
     * Lifecycle hook
     * @method
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
     * Lifecycle hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * On maximised event handler
     * @param {Boolean} ismaximized
     * @param {String} type
     */
    onmaximized(ismaximized: boolean, type: string): void {
        this.maximized[type] = ismaximized;
    }

    /**
     * On collapsed event handler
     * @param {Boolean} isCollapsed
     * @param {String} type
     */
    onCollapsed(isCollapsed: boolean, type: string): void {
        this.collapsed[type] = isCollapsed;
    }

    /**
     * On floating event handler
     * @param {Boolean} isFloating
     * @param {String} type
     */
    onFloating(isFloating: boolean, type: string): void {
        this.floating[type] = isFloating;
    }
}
