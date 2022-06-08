import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { AppUiService } from '@services/app-ui.service';
import { AgentNotificaitonEvent, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils';
import { IWidget } from 'app/interfaces';
import { InstantMessagingService } from 'app/layout/components/instant-messaging/instant-messaging.service';
/**
 * Instant messaging sidebar component
 */
@Component({
    selector: 'tw-instant-messaging',
    templateUrl: './tw-instant-messaging.component.html',
    styleUrls: ['./tw-instant-messaging.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwInstantMessagingComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config data for widget
     */
    @Input() data: IWidget;

    /**
     * Opened Flag
     */
    opened = false;
    /**
     * Side bar folded flag
     */
    sidebarFolded: boolean;
    /**
     * Unread messages
     */
    unreadMessages = 0;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _appUIService: AppUiService,
        private _instantMessagingService: InstantMessagingService
    ) {
        super('TwInstantMessagingComponent');
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // send the widget config
        this._instantMessagingService.shareConfig(this.data.Data);

        // register to event
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     *  AgentNotificaitonEvent Handler
     * @method  AgentNotificaitonEvent
     * @param { AgentNotificaitonEvent} evt
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent): void => {
        // check if the interaction id is there then return
        if (evt.InteractionID > 0) {
            return;
        }

        if (!this._fuseSidebarService.getSidebar('chatPanel').opened && evt.Type === 'IM') {
            this._appUIService.showSnackbar(`IM: ${evt.FromAgentName} <br /> ${evt.Message}`, 'close', 'top', 'right', 5000, () => {
                setTimeout(() => {
                    this.toggleSidebarOpen();

                    setTimeout(() => {
                        this._instantMessagingService.selectUser(evt.FromAgentId);
                    });
                });
            });
            this._appUIService.playAudio(undefined, 0.5, false);
            this.unreadMessages += 1;
        }
    };

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     */
    toggleSidebarOpen(): void {
        this._fuseSidebarService.getSidebar('chatPanel').toggleOpen();
        this.unreadMessages = 0;
    }
}
