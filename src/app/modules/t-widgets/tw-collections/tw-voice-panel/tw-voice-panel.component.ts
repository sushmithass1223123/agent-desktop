import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';

/**
 * Voice panel component
 */
@Component({
    selector: 'tw-voice-panel',
    templateUrl: './tw-voice-panel.component.html',
    styleUrls: ['./tw-voice-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoicePanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    /**
     * App config json data
     */
    @Input() data: any;

    /**
     * Voice panel Widget list
     */
    widgets = [];

    /**
     * Default values for maximize state
     */
    maximized = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    /**
     * Default values for collapsed state
     */
    collapsed = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    /**
     * Default values for floating state
     */
    floating = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    constructor() {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // get the toolbar menu widgets
        this.widgets = (this.data.Data.Widgets).filter((w: IWidget) => w.Config.Enabled);
        // loop through the widgets and pass the interaction details
        this.widgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = this.data.InteractionDetails;
            widget.Data.Path = this.data.Data.Path;
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
