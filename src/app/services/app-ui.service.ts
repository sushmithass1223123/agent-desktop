import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef, MatSnackBarVerticalPosition, MatSnackBarHorizontalPosition } from '@angular/material/snack-bar';
import { AlertDialogComponent } from '@modules/shared/alert-dialog/alert-dialog.component';
import { SnackbarComponent } from '../modules/shared/snackbar/snackbar.component';
import { AppAlertDialogTypes, AppConfirmDialogTypes, AppNotification, ReminderTaskDialogTypes } from 'app/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import * as _ from 'lodash';
import { TUtils } from 'tmac-sdk';
import { RemiderTaskDialogComponent } from '@modules/shared/remider-task-dialog/remider-task-dialog.component';
import { AppConfirmDialogComponent } from '@modules/shared/app-confirm-dialog/app-confirm-dialog.component';

@Injectable({
    providedIn: 'root'
})
export class AppUiService {
    private _audioInterval: any;
    private _audio: any;
    private _appNotificationsSubject: BehaviorSubject<AppNotification[]>;

    constructor(
        private _matSnackBar: MatSnackBar,
        private _matDialog: MatDialog
    ) {
        this._appNotificationsSubject = new BehaviorSubject([]);
    }

    public showSnackbar(
        message: string,
        state: 'info' | 'loading' | 'success' | 'failure' = 'success',
        vPos: MatSnackBarVerticalPosition = 'top',
        hPos: MatSnackBarHorizontalPosition = 'center',
        duration: number = 5000
    ): MatSnackBarRef<SnackbarComponent> {
        const icons = {
            info: 'info',
            success: 'done',
            failure: 'close',
            loading: 'loop'
        };
        const durationField = state === 'loading' ? {} : { duration };
        this._matSnackBar.dismiss();
        return this._matSnackBar.openFromComponent(SnackbarComponent, {
            data: {
                icon: icons[state],
                loading: state === 'loading',
                color: state,
                message
            },
            verticalPosition: vPos,
            horizontalPosition: hPos,
            ...durationField
        });
    }

    public showAlertModal(message: string, type: AppAlertDialogTypes = 'success', heading?: string): MatDialogRef<AlertDialogComponent> {
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

    public showRemiderTaskModal(type: ReminderTaskDialogTypes, message?: string): MatDialogRef<RemiderTaskDialogComponent> {
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
     * @param title [Optional] Title for the confirmation
     * @param message [Optional] Message for the confirmation
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

    // -----------------------------------------------------------------------------------------------------

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

    /**
     * Get the appNotifications
     */

    get appNotifications(): any | Observable<any> {
        return this._appNotificationsSubject.asObservable();
    }

    public addNotification(notification: AppNotification): string {
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

        // Notify the observers
        this._appNotificationsSubject.next(notifications);

        return notification.id;
    }

    public removeNotification(id: string): void {
        // Get the value from the behavior subject
        let notifications = this._appNotificationsSubject.getValue();

        // remove the item
        notifications = notifications.filter(n => n.id !== id);

        // Notify the observers
        this._appNotificationsSubject.next(notifications);
    }

    public clearAllNotifications(): void {
        // Notify the observers
        this._appNotificationsSubject.next([]);
    }

    // -----------------------------------------------------------------------------------------------------
}
