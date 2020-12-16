import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { AppDataService } from '@services/app-data.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';

/**
 * Voice panel component
 */
@Component({
    selector: 'tw-voice-panel',
    templateUrl: './tw-voice-panel.component.html',
    styleUrls: ['./tw-voice-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoicePanelComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {

    /**
     * App config json data
     */
    @Input() data: any;

    /**
     * Voice panel Widget list
     */
    voicePanelWidgets = [];

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

    constructor(
        private _contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService
    ) {
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
        this.voicePanelWidgets = this.data.Data.Widgets || [];
        // get the interaction details
        const interactionDetails = this.data.InteractionDetails;
        // loop through the widgets and pass the interaction details
        this.voicePanelWidgets.forEach((widget: IWidget) => {
            widget.InteractionDetails = interactionDetails;
        });
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngAfterViewInit(): void {
        // check if the current page is textchat page
        if (this._interactionManagerService.getInteractionCount().active <= 1 &&
            this._contentPageService.getCurrentMode() !== this.data.Path) {
            setTimeout(() => {
                this._contentPageService.mode = this.data.Data.Path;
            }, 500);
        }
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
