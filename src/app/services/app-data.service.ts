import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatSnackBar, MatSnackBarVerticalPosition, MatSnackBarHorizontalPosition } from '@angular/material/snack-bar';
import { AppNotification } from 'app/interfaces';
import { TUtils } from 'tmac-sdk';

@Injectable({
    providedIn: 'root'
})
export class AppDataService {
    // Private
    private _configSubject: BehaviorSubject<any>;
    private _appConfigSubject: BehaviorSubject<any>;
    private _appNotificationsSubject: BehaviorSubject<AppNotification[]>;
    private _audioInterval: any;
    private _audio: any;

    constructor(
        private _snackBar: MatSnackBar
    ) {
        // Set the config from the default config
        this._configSubject = new BehaviorSubject(new Object());
        this._appConfigSubject = new BehaviorSubject(new Object());
        this._appNotificationsSubject = new BehaviorSubject([]);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set and Get the config
     */
    set config(value) {
        // Get the value from the behavior subject
        let config = this._configSubject.getValue();

        // Merge the new config
        config = _.merge({}, config, value);

        // Notify the observers
        this._configSubject.next(config);
    }

    get config(): any | Observable<any> {
        return this._configSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the appNotifications
     */

    get appNotifications(): any | Observable<any> {
        return this._appNotificationsSubject.asObservable();
    }

    addNotification(notification: AppNotification): string {
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

    removeNotification(id: string): void {
        // Get the value from the behavior subject
        let notifications = this._appNotificationsSubject.getValue();

        // remove the item
        notifications = notifications.filter(n => n.id !== id);

        // Notify the observers
        this._appNotificationsSubject.next(notifications);
    }

    clearAllNotifications(): void {
        // Notify the observers
        this._appNotificationsSubject.next([]);
    }

    // -----------------------------------------------------------------------------------------------------

    /**
     * Set and Get the appConfig
     */
    set appConfig(value) {
        // Get the value from the behavior subject
        let config = this._appConfigSubject.getValue();

        // Merge the new config
        config = _.merge({}, config, value);

        // Notify the observers
        this._appConfigSubject.next(config);
    }

    get appConfig(): any | Observable<any> {
        return this._appConfigSubject.asObservable();
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

    public showMessage(message: string, vPos?: MatSnackBarVerticalPosition, hPos?: MatSnackBarHorizontalPosition, style?: string, duration?: number): void {
        this._snackBar.open(message, 'x', {
            duration: duration || 2000,
            verticalPosition: vPos || 'top', // 'top' | 'bottom'
            horizontalPosition: hPos || 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
            panelClass: style ? [style] : ['snackbar']
        });
    }
}
