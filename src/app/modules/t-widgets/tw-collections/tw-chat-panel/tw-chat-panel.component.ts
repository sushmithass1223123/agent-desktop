import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';

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
    chatPanelWidgets = [];
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
            'tw-customer-journey': false,
        }
    ];
    /**
     * * Collapsed flag for each chat panel widget
     */
    collapsed = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];
    /**
     * * Floating flag for each chat panel widget
     */
    floating = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
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

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To updted the maximized reference of widget based on type
     * @param isMaximized Maximized flag
     * @param type Widget type
     */
    public onmaximized(isMaximized: boolean, type: string): void {
        this.maximized[type] = isMaximized;
    }
    /**
     * To updted the collapsed reference of widget based on type
     * @param isCollapsed Collapsed flag
     * @param type Widget type
     */
    public onCollapsed(isCollapsed: boolean, type: string): void {
        this.collapsed[type] = isCollapsed;
    }
    /**
     * To updted the floating reference of widget based on type
     * @param isFloating Floating flag
     * @param type Widget type
     */
    public onFloating(isFloating: boolean, type: string): void {
        this.floating[type] = isFloating;
    }
}
