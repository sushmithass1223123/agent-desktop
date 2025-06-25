import { AppRootConfig } from '@ad/types';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import {
    MatSnackBar,
    MatSnackBarHorizontalPosition,
    MatSnackBarRef,
    MatSnackBarVerticalPosition
} from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertDialogComponent } from '@modules/shared/components/alert-dialog/alert-dialog.component';
import { AppConfirmDialogComponent } from '@modules/shared/components/app-confirm-dialog/app-confirm-dialog.component';
import { AppSnackbarComponent } from '@modules/shared/components/app-snackbar/app-snackbar.component';
import { CustomDialogComponent } from '@modules/shared/components/custom-dialog/custom-dialog.component';
import { ReminderTaskDialogComponent } from '@modules/shared/components/reminder-task-dialog/reminder-task-dialog.component';
import { SnackbarComponent } from '@modules/shared/components/snackbar/snackbar.component';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { TUtils } from '@tmac/sdk';
import {
    AppAlertDialogTypes,
    AppConfirmDialogTypes,
    AppNotification,
    AppSnackBarArgs,
    CustomDialogOtherData,
    ReminderTaskDialogTypes,
    SnackBarArgs,
    SnackbarStateTypes
} from 'app/interfaces';
import { map } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppDataService } from './app-data.service';
import { TSnackbarService } from '../modules/shared/components/t-snackbar/t-snackbar.service';
import { PreviewActionType, PreviewComponentTypes } from '@modules/shared/components/preview-dialog/preview.dialog';
import { PreviewDialogComponent } from '@modules/shared/components/preview-dialog/preview-dialog.componet';

type UiChanActions = 'hold/select-chat';

/**
 * App ui service
 * for communication across distant components
 */
@Injectable({
    providedIn: 'root'
})
export class AppUiService extends SharedWrapper {
    /**
     * Audio interval reference to repeat
     */
    private _audioInterval: any;
    /**
     * Flag object for manual hold AV call use
     */
    public isAvInteractionOnHold: any = {};
    /**
     * To hold Audio reference
     */
    private _audio: any;
    /**
     * App notification subject to emit notification
     */
    private _appNotificationsSubject: BehaviorSubject<AppNotification[]>;
    /**
     * App configuration data
     */
    private _appConfig: AppRootConfig;
    /**
     * Subject to unsubscribe for all subscriptions
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * Notification settings
     */
    private _notificationSettings: {
        /**
         * Browser notification enabled
         */
        desktopAlert: boolean;
        /**
         * Notification sound enabled
         */
        sounds: boolean;
    };
    /**
     * Notification reference
     */
    private _notificationRef: Notification;

    _reloginTriggered: boolean = false;
    /**
     * UI channel subject
     */
    uiChannel$: Subject<{
        /**
         * UI channel actions
         */
        type: UiChanActions;
        /**
         * Data
         */
        data?: any;
    }>;
    /**
     * onlineStatus
     */
    private onlineStatus: BehaviorSubject<boolean>;

    /**
     * Constructor
     * @param {MatSnackBar} _matSnackBar
     * @param {MatDialog} _matDialog
     * @param {AppDataService} _appDataService
     */
    constructor(
        private _matSnackBar: MatSnackBar,
        private _matDialog: MatDialog,
        private _appDataService: AppDataService,
        private domSanitizer: DomSanitizer,
        private _tSnackbarService: TSnackbarService
    ) {
        super('AppUiService');
        this.init();

        this.onlineStatus = new BehaviorSubject<boolean>(navigator.onLine);

        // Add event listeners for online and offline events
        window.addEventListener('online', () => {
            this.onlineStatus.next(true);
        });

        window.addEventListener('offline', () => {
            this.onlineStatus.next(false);
        });
    }

    /**
     * Init method
     */
    private init(): void {
        this.uiChannel$ = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // Snackbar methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To show snackbar
     * @param message Snackbar message
     * @param state Snackbar state of type SnackbarStateTypes
     * @param vPos Snackbar vertical position
     * @param hPos Snackbar horizontal position
     * @param duration Duration of the snackbar
     */
    public showSnackbar(
        message: string,
        state: SnackbarStateTypes = 'success',
        vPos: MatSnackBarVerticalPosition = 'top',
        hPos: MatSnackBarHorizontalPosition = 'center',
        duration: number = this._appConfig?.AppConfigs?.Notifications?.AppAlertTimeout || 5000,
        onClick?: () => void
    ) {
        if (message) {
            // configuration for icons
            const icons = {
                info: 'info',
                success: 'done',
                warning: 'warning',
                failure: 'error',
                loading: 'loop'
            };

            // data needed to show snackbar
            const input = {
                icon: icons[state],
                loading: state === 'loading',
                state,
                message,
                onClick,
                duration: duration
            };

            // configuration to enable/disable custom snackbar
            const customSnackbarConfig = {
                enable: true,
                enableSingle: false
            };

            // using custom snackbar
            if (customSnackbarConfig.enable) {
                return this._tSnackbarService.loadSnackbar(input, customSnackbarConfig);
            }

            // using angular material snackbar
            const durationField = state === 'loading' ? {} : { duration };
            this._matSnackBar.dismiss();
            return this._matSnackBar.openFromComponent(SnackbarComponent, {
                data: input,
                verticalPosition: vPos,
                horizontalPosition: hPos,
                ...durationField
            });
        } else {
            console.error('Empty message passed for notification');
        }
    }

    /**
     * To show snackbar
     *
     * @param {SnackBarArgs} args
     */
    public showSnackbarAd(args: SnackBarArgs): MatSnackBarRef<SnackbarComponent> {
        if (args.message) {
            const icons = {
                info: 'info',
                success: 'done',
                warning: 'warning',
                failure: 'error',
                loading: 'loop'
            };
            const durationField = args.state === 'loading' ? {} : { duration: args.duration };
            this._matSnackBar.dismiss();
            return this._matSnackBar.openFromComponent(SnackbarComponent, {
                data: {
                    icon: icons[args.state],
                    loading: args.state === 'loading',
                    state: args.state,
                    message: args.message,
                    onClick: args.onClick,
                    onClose: args.onClose
                },
                verticalPosition: args.vPos,
                horizontalPosition: args.hPos,
                ...durationField
            });
        } else {
            console.error('Empty message passed for notification');
        }
    }

    /**
     * To show customized app snackbar
     *
     * @param {AppSnackBarArgs} snackBarArgs
     */
    public showAppSnackbar(snackBarArgs: AppSnackBarArgs): MatSnackBarRef<AppSnackbarComponent> {
        const icons = {
            info: 'info',
            success: 'done',
            warning: 'warning',
            danger: 'error'
        };
        this._matSnackBar.dismiss();

        // add desktop alert
        if (!snackBarArgs.disableNotification) {
            this.showDesktopAlert('You have a new notification', snackBarArgs.message, false);
        }
        // add to the notifications
        this.addNotification({
            icon: 'notification_important',
            message: snackBarArgs.message,
            status: 'new'
        });

        return this._matSnackBar.openFromComponent(AppSnackbarComponent, {
            data: {
                message: snackBarArgs.message,
                icon: icons[snackBarArgs.state || 'info'],
                onClick: snackBarArgs.onClick
            },
            verticalPosition: snackBarArgs.vPos || 'top',
            horizontalPosition: snackBarArgs.hPos || 'center',
            duration: snackBarArgs.duration || this._appConfig.AppConfigs.Notifications.AppAlertTimeout || 5000,
            panelClass: ['app-snackbar', `${snackBarArgs.state || 'info'}-snackbar`]
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // Dialog methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To show app alerts
     * @param message Message for the app alert
     * @param type Type of app alert
     * @param heading [OPTIONAL] Heading for app alert
     */
    public showAlertModal(
        message: string,
        type: AppAlertDialogTypes = 'success',
        heading?: string
    ): MatDialogRef<AlertDialogComponent> {
        // play new chat sound
        this.playAudio('alert', 0.5, false);

        // add desktop alert
        this.showDesktopAlert('You have a new notification', message, false);

        // show alert
        const dialogRef = this._matDialog.open(AlertDialogComponent, {
            data: {
                message,
                heading,
                type,
                close: () => dialogRef.close()
            },
            panelClass: 'alert-dialog',
            width: '350px',
            disableClose: true
        });
        return dialogRef;
    }

    /**
     * To show Remider task dialog
     * @param type Type of reminder task dialog
     * @param message [OPTIONAL] Message to show in reminder task dialog
     */
    public showRemiderTaskModal(
        type: ReminderTaskDialogTypes,
        message?: string,
        title?: string
    ): MatDialogRef<ReminderTaskDialogComponent> {
        // play new chat sound
        this.playAudio('alert', 0.5, false);
        const dialogRef = this._matDialog.open(ReminderTaskDialogComponent, {
            data: {
                type,
                message,
                title,
                accept: () => dialogRef.close('accept'),
                reject: () => dialogRef.close('reject'),
                snooze: (time?: number) => dialogRef.close('snooze:' + time)
            },
            panelClass: 'reminder-task-dialog',
            width: '350px',
            autoFocus: false,
            disableClose: true
        });
        return dialogRef;
    }

    /**
     * Method to show app confirmation dialog
     * @param type Type of dialog
     *
     * @param title [OPTIONAL] Title for the confirmation
     * @param message [OPTIONAL] Message for the confirmation
     * @param customActionButtons [OPTIONAL] Confirmation custom action button names
     */
    public showAppConfirmDialog(
        type: AppConfirmDialogTypes,
        title?: string,
        message?: string,
        customActionButtons?: string
    ): MatDialogRef<AppConfirmDialogComponent> {
        const dialogRef = this._matDialog.open(AppConfirmDialogComponent, {
            data: {
                title,
                type,
                message,
                customActionButtons: customActionButtons ? customActionButtons.split(':') : [],
                confirm: () => dialogRef.close(true),
                cancel: () => dialogRef.close(false)
            },
            panelClass: 'app-confirm-dialog',
            width: '350px',
            autoFocus: false,
            disableClose: true
        });
        return dialogRef;
    }

    /**
     * To show custom dialog
     *
     * @param {'alert' | 'prompt' | 'confirm'} type
     * @param message
     * @param title
     */
    public showCustomDialog(
        type: 'alert' | 'prompt' | 'confirm',
        message: any,
        title?: string,
        otherData?: CustomDialogOtherData,
        matConfig?: Partial<MatDialogConfig>
    ): MatDialogRef<CustomDialogComponent> {
        const dialogRef = this._matDialog.open(CustomDialogComponent, {
            data: {
                type,
                title,
                message,
                ...(otherData || {}),
                done: (data?: any) => dialogRef.close(data || true),
                cancel: () => dialogRef.close(false)
            },
            panelClass: 'custom-dialog',
            minWidth: '350px',
            autoFocus: false,
            ...(matConfig || {})
        });
        return dialogRef;
    }

    // -----------------------------------------------------------------------------------------------------
    // Audio methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Tp play any audio, mainly used for notification tones
     * @param type To get the file based on type
     * @param volume Volume range for the tone
     * @param repeat To repeat the tone or not
     */
    public playAudio(type: string = 'default', volume: number = 1, repeat = false): void {
        // check if sound is enabled for notification
        if ((!type || type === 'notification') && !this._notificationSettings.sounds) {
            return;
        }
        // clear if any interval
        clearInterval(this._audioInterval);
        // start dial tone
        this._audio = new Audio(`assets/sounds/${type || 'default'}.mp3`);
        // set the volume
        this._audio.volume = volume;
        // play once
        this._audio.play();
        // if repeat then loop it
        if (repeat) {
            // start interval
            this._audioInterval = setInterval(
                (x: any) => {
                    x.play();
                },
                5000,
                this._audio
            );
        }
    }

    /**
     * To clear currently playing audio set using 'playAudio' method
     */
    public clearAudio(): void {
        // if audio playing
        if (this._audio) {
            // pause the audio
            this._audio.pause();
        }
        // clear interval
        clearInterval(this._audioInterval);
        // set the interval to null
        this._audioInterval = null;
    }

    // -----------------------------------------------------------------------------------------------------
    // App notification methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the appNotifications
     */
    get appNotifications(): any | Observable<any> {
        return this._appNotificationsSubject.asObservable();
    }

    /**
     * To add app notifications
     * @param notification Notification of type AppNotification
     */
    public addNotification(notification: AppNotification): string {
        // play new chat sound
        this.playAudio('notification', 0.5, false);

        // Get the value from the behavior subject
        let notifications = this._appNotificationsSubject.getValue();

        // if id is given, it can be a update
        if (notification.id) {
            notifications = map(notifications, (item) => {
                if (item.id === notification.id) {
                    return { ...item, ...notification };
                }
            });
        } else {
            // add the id
            notification.id = TUtils.Generic.uuid();
            // Merge the new notification
            notifications = [...notifications, notification];
            // add the time
            notification.time = new Date();
        }

        // check whether to show an alert
        if (notification.showAlert) {
            let message = '';
            if (notification.icon.includes('external_av_widget_creds')) {
                message = `External AV Widget Credentials Saved!`;
            } else if (!notification.icon.includes('sm')) {
                message = notification.message;
            } else {
                if (notification.icon.includes('smrc')) {
                    message = `${notification.message?.Comments?.ToName}: Reaction to ${notification.message?.Engagement?.smmType} on ${notification.message?.Posts?.Channel}`;
                } else if (notification.icon.includes('smrp')) {
                    message = `${notification.message?.Posts?.AccountName}: Reaction to ${notification.message?.Engagement?.smmType} on ${notification.message?.Posts?.Channel}`;
                } else if (notification.icon.includes('smm_a')) {
                    message = `${notification.message?.Posts?.AccountName}: Got mentioned on ${
                        notification.message?.Comments?.CommentId ? 'comment' : 'post'
                    } in ${notification.message?.Posts?.Channel}`;
                } else if (notification.icon.includes('smc_e') || notification.icon.includes('smco_e')) {
                    message = `${notification.message?.Comments?.ToName}: Comment edited on ${notification.message?.Posts?.Channel}`;
                } else if (notification.icon.includes('smpc_e')) {
                    message = `${notification.message?.Comments?.ToName}: Parent comment edited on ${notification.message?.Posts?.Channel}`;
                } else if (notification.icon.includes('smc_d') || notification.icon.includes('smco_d')) {
                    message = `${notification.message?.Comments?.ToName}: Comment deleted on ${notification.message?.Posts?.Channel}`;
                } else if (notification.icon.includes('smp_d')) {
                    message = `${notification.message?.Posts?.AccountName}: Post deleted on ${notification.message?.Posts?.Channel}`;
                } else if (notification.icon.includes('smp_e')) {
                    message = `${notification.message?.Posts?.AccountName}: Post edited on ${notification.message?.Posts?.Channel}`;
                }
            }

            this.showSnackbar(message, 'info', 'top', 'center');
        }

        // Notify the observers
        this._appNotificationsSubject.next(notifications);

        return notification.id;
    }

    /**
     * To remove the notification from the list based on ID
     * @param id ID of the app notification
     */
    public removeNotification(id: string): void {
        // Get the value from the behavior subject
        let notifications = this._appNotificationsSubject.getValue();

        // remove the item
        notifications = notifications.filter((n) => n.id !== id);

        // Notify the observers
        this._appNotificationsSubject.next(notifications);
    }

    /**
     * To clear all the app notifications
     */
    public clearAllNotifications(): void {
        // Notify the observers
        this._appNotificationsSubject.next([]);
    }

    /**
     * To set notification settings
     *
     * @param settings
     */
    public setNotificationSettings(settings: any): void {
        this._notificationSettings = settings;
    }

    /**
     * To show browser notfication
     */
    public showDesktopAlert(title: string, message: string, sound: boolean, soundType?: string): void {
        // get the config
        const config = this._appConfig?.AppConfigs?.Notifications;

        // check if notification is enabled
        if (!this._notificationSettings.desktopAlert || document.hasFocus()) {
            return;
        }

        // check if any existing notification
        if (this._notificationRef) {
            this._notificationRef.close();
        }

        // recheck if the notification permission is granted
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        } else {
            this._notificationRef = new Notification(title, {
                icon: 'assets/images/logos/desktop-alert.png',
                body: message,
                requireInteraction: true,
                silent: true
            });

            // check if sound needed
            if (this._notificationSettings.sounds && sound) {
                this.playAudio(soundType, 0.5, false);
            }

            // check the timeout
            if (config.DesktopAlertTimeout && config.DesktopAlertTimeout > 1000) {
                setTimeout(
                    (x) => {
                        x.close();
                    },
                    config.DesktopAlertTimeout,
                    this._notificationRef
                );
            }

            // on click of notification
            this._notificationRef.onclick = () => {
                window.focus();
            };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // Subscription methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To subscribe to App UI service
     */
    public subscribe(): void {
        this.logger.info('subscribe', false);

        // init the subject
        this._unsubscribeAll = new Subject();
        this._appNotificationsSubject = new BehaviorSubject([]);

        // get the config and check for AOT widgets
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            this._appConfig = config;

            // set the notification settings from server
            this._notificationSettings = {
                desktopAlert: config.AppConfigs?.Notifications?.DesktopAlerts,
                sounds: config.AppConfigs?.Notifications?.Sounds
            };

            // check for desktop notification and permission is granted
            if (config.AppConfigs?.Notifications?.DesktopAlerts) {
                if (typeof Notification !== 'function') {
                    this.showSnackbar('Notification is not supported by the browser!', 'warning', 'top', 'center');
                    return;
                }
                // check if the notification permission is granted
                if (Notification.permission !== 'granted') {
                    // check if the permission is denied
                    if (Notification.permission === 'denied') {
                        this.showSnackbar(
                            'Notification is enabled but permission is denied! Please go to browser settings and allow to receive notifications for this site.',
                            'failure',
                            'top',
                            'center',
                            10000
                        );
                    } else {
                        this.showSnackbar('Please grant permission for notifications', 'info', 'top', 'center');
                    }
                    Notification.requestPermission();
                }
            }
        });
    }

    /**
     * To unsubscribe to App UI service
     */
    public unsubscribe(): void {
        this.logger.info('unsubscribe', false);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        this._appNotificationsSubject.next([]);
        this._appNotificationsSubject.complete();
    }

    /**
     * This method sanitizes email body and adds all <a>  tags with a target='_blank'
     * This makes it safer for injecttion in innerHtml and when a link is opened , it opens in new Tab
     */
    public sanitizeEmailBody(
        /**
         * Email's body as html string
         */
        body: string
    ): SafeHtml {
        return this.domSanitizer.bypassSecurityTrustHtml(body.replaceAll('<a', '<a target="_blank"'));
    }

    /**
     * To check for display resolution
     */
    public checkForDisplayResolution() {
        if (!this._appConfig?.AppConfigs?.CheckForResolution) {
            return;
        }

        if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            // for desktop zoom based on display resolutions
            let zoomLevel = 0;
            let message = '';
            const pixelRatio = Number(window.devicePixelRatio.toFixed(2));
            const height = screen.height;

            if (height > 900 && height < 1080) {
                zoomLevel = 0.9;
            } else if (height > 800 && height <= 900) {
                zoomLevel = 0.8;
            } else if (height <= 800) {
                zoomLevel = 0.67;
            }

            // // check the display resolutions
            // switch (screen.height) {
            //     case 1050:
            //     case 1024:
            //         zoomLevel = 0.9;
            //         break;
            //     case 900:
            //         zoomLevel = 0.8;
            //         break;
            //     case 800:
            //         zoomLevel = 0.67;
            //         break;
            //     default:
            //         if (screen.height <= 768) {
            //             zoomLevel = 0.67;
            //         }
            //         break;
            // }

            if (zoomLevel > 0 && pixelRatio !== 1 && pixelRatio > zoomLevel) {
                message = `Your display resolution <b>(<span class="text-alt-danger">${screen.width}x${
                    screen.height
                }</span>)</b> seems to be lesser than recommended, please zoom out to at least <b class="text-alt-success">${
                    zoomLevel * 100
                }%</b> or lesser for better user experience. Recommended to use a display with Resolution <b class="text-alt-success">1920x1080</b> and Scale <b class="text-alt-success">100%</b>.`;
            }

            if (message) {
                this.showAppSnackbar({
                    message,
                    duration: 60000,
                    state: 'warning',
                    hPos: 'right',
                    disableNotification: true
                });
            }
        }
    }

    /**
     * To set the av hold interaction flag
     */
    public setAvInteractionHoldFlag(interactionId: number, onHold: boolean) {
        try {
            this.isAvInteractionOnHold[interactionId] = {
                onHold
            };
        } catch (error) {
            console.error(error);
        }
    }

    // Expose Observable for online/offline status
    getOnlineStatus(): Observable<boolean> {
        return this.onlineStatus.asObservable();
    }

    public previewComponentOnDialog(
        message?: any,
        title?: string,
        component?: PreviewComponentTypes,
        previewData?: any,
        matConfig?: Partial<MatDialogConfig>,
        actions?: PreviewActionType[]
    ): MatDialogRef<PreviewDialogComponent> {
        const dialogRef = this._matDialog.open(PreviewDialogComponent, {
            data: {
                component,
                title,
                message,
                previewData,
                actions,
                done: (data?: any) => dialogRef.close(data || true),
                cancel: () => dialogRef.close(false)
            },
            minWidth: '350px',
            autoFocus: false,
            ...(matConfig || {})
        });
        return dialogRef;
    }

    public findMaxZIndexElement(): number {
        const allElements = document.body.getElementsByTagName('*');
        let maxZIndex = -Infinity;

        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;

            if (!el.offsetParent || el.style.display === 'none' || el.style.visibility === 'hidden') {
                continue;
            }

            const z = window.getComputedStyle(el).zIndex;

            if (!z || isNaN(+z)) {
                continue;
            }

            const zIndex = +z;
            if (zIndex > maxZIndex) {
                maxZIndex = zIndex;
            }
        }

        return maxZIndex;
    }
}
