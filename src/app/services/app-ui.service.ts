import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarRef, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { AlertDialogComponent } from '@modules/shared/components/alert-dialog/alert-dialog.component';
import { AppConfirmDialogComponent } from '@modules/shared/components/app-confirm-dialog/app-confirm-dialog.component';
import { AppSnackbarComponent } from '@modules/shared/components/app-snackbar/app-snackbar.component';
import { CustomDialogComponent } from '@modules/shared/components/custom-dialog/custom-dialog.component';
import { ReminderTaskDialogComponent } from '@modules/shared/components/reminder-task-dialog/reminder-task-dialog.component';
import { SnackbarComponent } from '@modules/shared/components/snackbar/snackbar.component';
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
import { TUtils } from '@tmac/sdk';
import { AppDataService } from './app-data.service';

type UiChanActions = 'hold/select-chat';

/**
 * App ui service
 * for communication across distant components
 */
@Injectable({
    providedIn: 'root'
})
export class AppUiService {
    /**
     * Audio interval reference to repeat
     */
    private _audioInterval: any;
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
    private _appConfig: any;
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
     * Constructor
     * @param {MatSnackBar} _matSnackBar
     * @param {MatDialog} _matDialog
     * @param {AppDataService} _appDataService
     */
    constructor(private _matSnackBar: MatSnackBar, private _matDialog: MatDialog, private _appDataService: AppDataService) {
        this.init();
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
        duration: number = this._appConfig.AppConfigs.Notifications.AppAlertTimeout || 5000,
        onClick?: () => void
    ): MatSnackBarRef<SnackbarComponent> {
        if (message) {
            const icons = {
                info: 'info',
                success: 'done',
                warning: 'warning',
                failure: 'error',
                loading: 'loop'
            };
            const durationField = state === 'loading' ? {} : { duration };
            this._matSnackBar.dismiss();
            return this._matSnackBar.openFromComponent(SnackbarComponent, {
                data: {
                    icon: icons[state],
                    loading: state === 'loading',
                    state,
                    message,
                    onClick
                },
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
    public showAlertModal(message: string, type: AppAlertDialogTypes = 'success', heading?: string): MatDialogRef<AlertDialogComponent> {
        // play new chat sound
        this.playAudio('alert', 0.5, false);
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
    public showRemiderTaskModal(type: ReminderTaskDialogTypes, message?: string, title?: string): MatDialogRef<ReminderTaskDialogComponent> {
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
     */
    public showAppConfirmDialog(type: AppConfirmDialogTypes, title?: string, message?: string): MatDialogRef<AppConfirmDialogComponent> {
        const dialogRef = this._matDialog.open(AppConfirmDialogComponent, {
            data: {
                title,
                type,
                message,
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
            disableClose: true,
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
            this.showSnackbar(notification.message, 'info', 'top', 'center');
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
        const config = this._appConfig.AppConfigs.Notifications;

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
        TUtils.Logger.console('info', 'AppUiService.subscribe');

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
                        this.showSnackbar('Please grand permission for notifications', 'info', 'top', 'center');
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
        TUtils.Logger.console('info', 'AppUiService.unsubscribe');

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        this._appNotificationsSubject.next([]);
        this._appNotificationsSubject.complete();
    }
}
