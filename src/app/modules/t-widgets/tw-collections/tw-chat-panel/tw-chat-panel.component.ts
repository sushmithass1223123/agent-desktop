import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { AppDataService } from '@services/app-data.service';

@Component({
    selector: 'tw-chat-panel',
    templateUrl: './tw-chat-panel.component.html',
    styleUrls: ['./tw-chat-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwChatPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {

    @Input() data: any;

    chatPanelWidgets = [];

    maximized = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    collapsed = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    floating = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    constructor(
        private _appDataService: AppDataService,
        private _contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

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
        });
    }

    ngAfterViewInit(): void {
        // check if the current page is textchat page
        if (this._interactionManagerService.getInteractionCount().active <= 1 &&
            this._contentPageService.getCurrentMode() !== this.data.Path) {
            setTimeout(() => {
                this._contentPageService.mode = this.data.Data.Path;
            }, 500);
        }

        // play new chat sound 
        this._appDataService.playAudio('newchat', 0.5);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    onmaximized(ismaximized: boolean, type: string): void {
        this.maximized[type] = ismaximized;
    }

    onCollapsed(isCollapsed: boolean, type: string): void {
        this.collapsed[type] = isCollapsed;
    }

    onFloating(isFloating: boolean, type: string): void {
        this.floating[type] = isFloating;
    }
}
