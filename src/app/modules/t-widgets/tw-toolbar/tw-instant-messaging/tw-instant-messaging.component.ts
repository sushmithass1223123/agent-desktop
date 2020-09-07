import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SDKClient, AgentNotificaitonEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-instant-messaging',
    templateUrl: './tw-instant-messaging.component.html',
    styleUrls: ['./tw-instant-messaging.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwInstantMessagingComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    opened = false;
    sidebarFolded: boolean;
    unreadMessages = 0;
    private _unsubscribeAll: Subject<any>;

    constructor(private _fuseSidebarService: FuseSidebarService) {
        super();
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key: string): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
        this.unreadMessages = 0;
    }

    AgentNotificaitonEvent = (evt: AgentNotificaitonEvent): void => {
        if (!this._fuseSidebarService.getSidebar('chatPanel').opened && evt.Type === 'IM') {
            this.unreadMessages += 1;
        }
    };
}
