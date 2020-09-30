import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarRef, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { AlertDialogComponent } from '@modules/shared/alert-dialog/alert-dialog.component';
import { AppConfirmDialogComponent } from '@modules/shared/app-confirm-dialog/app-confirm-dialog.component';
import { AppSnackbarComponent } from '@modules/shared/app-snackbar/app-snackbar.component';
import { CustomDialogComponent } from '@modules/shared/custom-dialog/custom-dialog.component';
import { RemiderTaskDialogComponent } from '@modules/shared/remider-task-dialog/remider-task-dialog.component';
import { AppAlertDialogTypes, AppConfirmDialogTypes, AppNotification, AppSnackBarArgs, ReminderTaskDialogTypes, SnackbarStateTypes } from 'app/interfaces';
import * as _ from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TUtils } from 'tmac-sdk';
import { SnackbarComponent } from '../modules/shared/snackbar/snackbar.component';
import { AppDataService } from './app-data.service';

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
     * Constructor
     * @param {MatSnackBar} _matSnackBar
     * @param {MatDialog} _matDialog
     * @param {AppDataService} _appDataService
     */
    constructor(
        private _matSnackBar: MatSnackBar,
        private _matDialog: MatDialog,
        private _appDataService: AppDataService
    ) {
        // init the subject
        this._unsubscribeAll = new Subject();
        this._appNotificationsSubject = new BehaviorSubject([]);
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
        duration: number = this._appConfig.AppConfigs.AppNotificationTimeout || 5000
    ): MatSnackBarRef<SnackbarComponent> {
        const icons = {
            info: 'info',
            success: 'done',
            warning: 'warning',
            failure: 'close',
            loading: 'loop'
        };
        const durationField = state === 'loading' ? {} : { duration };
        this._matSnackBar.dismiss();
        return this._matSnackBar.openFromComponent(SnackbarComponent, {
            data: {
                icon: icons[state],
                loading: state === 'loading',
                state,
                message
            },
            verticalPosition: vPos,
            horizontalPosition: hPos,
            ...durationField
        });
    }

    /**
     * To show customized app snackbar
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
                icon: icons[snackBarArgs.state || 'info']
            },
            verticalPosition: snackBarArgs.vPos || 'top',
            horizontalPosition: snackBarArgs.hPos || 'center',
            duration: snackBarArgs.duration || this._appConfig.AppConfigs.AppNotificationTimeout || 5000,
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
        this.playAudio('alert', 0.5);
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
        message?: string
    ): MatDialogRef<RemiderTaskDialogComponent> {
        // play new chat sound 
        this.playAudio('alert', 0.5);
        const dialogRef = this._matDialog.open(RemiderTaskDialogComponent, {
            data: {
                type,
                message,
                accept: () => dialogRef.close('accept'),
                reject: () => dialogRef.close('reject'),
                snooze: () => dialogRef.close('snooze')
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
    public showAppConfirmDialog(
        type: AppConfirmDialogTypes,
        title?: string,
        message?: string): MatDialogRef<AppConfirmDialogComponent> {
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
    public showCustomDialog(type: 'alert' | 'prompt' | 'confirm', message: any, title?: string): MatDialogRef<CustomDialogComponent> {
        const dialogRef = this._matDialog.open(CustomDialogComponent, {
            data: {
                type,
                title,
                message,
                done: (data?: any) => dialogRef.close(data || true),
                cancel: () => dialogRef.close(false)
            },
            panelClass: 'custom-dialog',
            minWidth: '350px',
            autoFocus: false,
            disableClose: true
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
        // clear if any interval
        clearInterval(this._audioInterval);
        // start dial tone
        this._audio = new Audio(`assets/sounds/${type}.mp3`);
        // set the volume 
        this._audio.volume = volume;
        // play once
        this._audio.play();
        // if repeat then loop it
        if (repeat) {
            // start interval
            this._audioInterval = setInterval((x: any) => {
                x.play();
            }, 5000, this._audio);
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
        this.playAudio('alert', 0.5);

        // Get the value from the behavior subject
        let notifications = this._appNotificationsSubject.getValue();

        // if id is given, it can be a update
        if (notification.id) {
            notifications = _.map(notifications, (item) => {
                if (item.id === notification.id) {
                    return { ...item, ...notification };
                }
            });
        }
        else {
            // add the id
            notification.id = TUtils.Generic.uuid();
            // Merge the new notification
            notifications = [...notifications, notification];
            // add the time
            notification.time = new Date();
        }

        // check whether to show an alert
        if (notification.showAlert) {
            this.showSnackbar(notification.message, 'info');
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
        notifications = notifications.filter(n => n.id !== id);

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

    // -----------------------------------------------------------------------------------------------------
    // Subscription methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To subscribe to App UI service
     */
    public subscribe(): void {
        TUtils.Logger.console('info', 'AppUiService.subscribe');

        // get the config and check for AOT widgets
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this._appConfig = config;
                });
    }

    /**
     * To unsubscribe to App UI service
     */
    public unsubscribe(): void {
        TUtils.Logger.console('info', 'AppUiService.unsubscribe');

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
