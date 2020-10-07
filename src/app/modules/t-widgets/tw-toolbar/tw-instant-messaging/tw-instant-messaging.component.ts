import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentNotificaitonEvent, SDKClient } from 'tmac-sdk';
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
    @Input() data: any;

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

    constructor(private _fuseSidebarService: FuseSidebarService) {
        super();
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

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
            this.unreadMessages += 1;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     * @param {String} key
     */
    toggleSidebarOpen(key: string): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
        this.unreadMessages = 0;
    }
}
