import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { AppUiService } from '@services/app-ui.service';
import { AgentNotificaitonEvent, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils';
import { AppNotification } from 'app/interfaces';
import { urlify } from 'app/utils';
import { orderBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';

/**
 * Notfications Component
 */
@Component({
    selector: 'tw-notifications',
    templateUrl: './tw-notifications.component.html',
    styleUrls: ['./tw-notifications.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwNotificationsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config data
     */
    @Input() data: any;

    /**
     * Opened Flag
     */
    opened = false;
    /**
     * Unread notifications
     */
    unreadCount = 0;
    /**
     * Notifications list
     */
    notifications: AppNotification[];

    constructor(private _appUIService: AppUiService) {
        super();
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // register to event
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);

        this._appUIService.appNotifications.pipe(takeUntil(this.unsubscribeAll)).subscribe((nots: AppNotification[]) => {
            const notifications = nots.filter((x) => x.message);
            if (notifications.length > 0 && !this.opened) {
                ++this.unreadCount;
            }
            this.notifications = orderBy(notifications, ['time'], ['desc']);
        });
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);

        // clear all the notifications in the service
        this.clearAllNotifications();
    }

    /**
     * AgentNotificaitonEvent Handler
     * @method AgentNotificaitonEvent
     * @param {AgentNotificaitonEvent} evt
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // check if the interaction id is there then return
        if (evt.InteractionID > 0 || !evt.Message) {
            return;
        }

        // get the type
        const type = evt.Type?.toLowerCase() || '';

        // check the type
        if (
            type !== 'im' &&
            type !== 'interactionim' &&
            type !== 'executeaction' &&
            type !== 'executetask' &&
            type !== 'customersentimentdetected' &&
            type !== 'agentsentimentdetected'
        ) {
            this._appUIService.addNotification({
                icon: type === 'broadcast' ? 'announcement' : type === 'notify' ? 'notification_important' : 'info',
                message: urlify(evt.Message),
                status: 'new',
                showAlert: type !== 'broadcast'
            });
        }
    }

    /**
     * Toggle Menu
     * @method menuOpened
     * @param {Boolean} opened
     */
    menuOpened(opened: boolean): void {
        this.opened = opened;
        if (this.opened) {
            this.unreadCount = 0;
        }
    }

    /**
     * Clear single Notification
     * @method clearNotification
     * @param {AppNotification} item
     */
    clearNotification(item: AppNotification): void {
        this._appUIService.removeNotification(item.id);
    }

    /**
     * Clear notifications
     * @method clearAllNotifications
     */
    clearAllNotifications(): void {
        this._appUIService.clearAllNotifications();
    }
}
