import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { AppDataService } from '@services/app-data.service';
import { takeUntil } from 'rxjs/operators';
import { AppNotification } from 'app/interfaces';
import { SDKClient, AgentNotificaitonEvent } from 'tmac-sdk';
import { fuseAnimations } from '@fuse/animations';
import * as _ from 'lodash';

@Component({
    selector: 'tw-notifications',
    templateUrl: './tw-notifications.component.html',
    styleUrls: ['./tw-notifications.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwNotificationsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    opened = false;
    unreadCount = 0;
    notifications: AppNotification[];

    constructor(
        private _appDataService: AppDataService
    ) {
        super();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);

        this._appDataService.appNotifications
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (notifications: AppNotification[]) => {
                    if (notifications.length > 0 && !this.opened) {
                        ++this.unreadCount;
                    }
                    this.notifications = _.orderBy(notifications, ['time'], ['desc']);
                }
            );

        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    ngOnDestroy(): void {
        this.destroyWrapper();

        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // check the type
        if (evt.Type !== 'IM' && evt.Type !== 'InteractionIM') {
            this._appDataService.addNotification({
                icon: evt.Type === 'Broadcast' ? 'announcement' : evt.Type === 'Notify' ? 'notification_important' : 'info',
                message: this.urlify(evt.Message),
                status: 'new'
            });
        }
    }

    private urlify(text: string): string {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url: string) => {
            return '<a target="_blank" href="' + url + '">' + url + '</a>';
        });
    }

    menuOpened(opened: boolean): void {
        this.opened = opened;
        if (this.opened) {
            this.unreadCount = 0;
        }
    }

    clearNotification(item: AppNotification): void {
        this._appDataService.removeNotification(item.id);
    }

    clearAllNotifications(): void {
        this._appDataService.clearAllNotifications();
    }
}
