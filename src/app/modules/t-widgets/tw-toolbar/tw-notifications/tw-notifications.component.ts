import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { AppUiService } from '@services/app-ui.service';
import { AgentNotificaitonEvent, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils';
import { AppNotification, InteractionRef } from 'app/interfaces';
import { urlify } from '@tmac/operators';
import { orderBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { SocialMediaPostsService } from '@modules/shared/components/social-media-posts/social-media-posts.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { MatMenuTrigger } from '@angular/material/menu';

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
    postInteractionList: InteractionRef[] = [];
    /**
     * Menu trigger ref
     */
    @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

    constructor(
        private _appUIService: AppUiService,
        private _smpService: SocialMediaPostsService,
        private _contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService
    ) {
        super('TwNotificationsComponent');
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // Observe all active post interactions
        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                this.postInteractionList = interactions.filter((i: InteractionRef) => i.type === 'smp');
            });

        // register to event
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);

        this._appUIService.appNotifications
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((nots: AppNotification[]) => {
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
        const type = evt.Type?.toLowerCase() ?? '';

        if (type === 'socialmediareactionscomment_add') {
            this._appUIService.addNotification({
                icon: 'smrc_a',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediacomment_edit') {
            this._appUIService.addNotification({
                icon: 'smc_e',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediaparentcomment_edit') {
            this._appUIService.addNotification({
                icon: 'smpc_e',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediapost_edit') {
            this._appUIService.addNotification({
                icon: 'smp_e',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediacommentout_edit') {
            this._appUIService.addNotification({
                icon: 'smco_e',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediareactionspost_add') {
            this._appUIService.addNotification({
                icon: 'smrp_a',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type == 'socialmediamention_add') {
            this._appUIService.addNotification({
                icon: 'smm_a',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediacomment_delete') {
            this._appUIService.addNotification({
                icon: 'smc_d',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediacommentout_delete') {
            this._appUIService.addNotification({
                icon: 'smco_d',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        } else if (type === 'socialmediapost_delete') {
            this._appUIService.addNotification({
                icon: 'smp_d',
                message: JSON.parse(evt.Message),
                status: 'new',
                showAlert: true
            });
            return;
        }

        if (
            type !== 'im' &&
            type !== 'interactionim' &&
            type !== 'executeaction' &&
            type !== 'executetask' &&
            type !== 'customersentimentdetected' &&
            type !== 'agentsentimentdetected' &&
            type !== 'parentagentstatus'
        ) {
            this._appUIService.addNotification({
                icon: type === 'broadcast' ? 'announcement' : type === 'notify' ? 'notification_important' : 'info',
                message: urlify(evt.Message),
                status: 'new',
                showAlert: type !== 'broadcast'
            });
        }
    };

    onChoosePost(postData: any, action: string): void {
        const isActiveInteractionAvailable = this.postInteractionList.findIndex(
            (intData: InteractionRef) =>
                intData.otherData?.SessionId === postData.message?.SocialMediaData?.Comments?.SessionId ||
                intData.otherData?.OutSessionID === postData.message?.SocialMediaData?.Comments?.SessionId
        );
        this.closeMenu();
        if (isActiveInteractionAvailable >= 0) {
            this._smpService.triggerEmittedNotificationData({message: postData.message, action});
            return;
        };
        this._contentPageService.mode = '/workbench';
        this._smpService.setSwitchTabFromNotification('Social Media');
        this._smpService.setPostFromNotification({ postData: postData.message, action });
        this.clearNotification(postData);
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

    /**
     * Method to close mat menu
     */
    closeMenu() {
        this.menuTrigger?.closeMenu();
    }
}
