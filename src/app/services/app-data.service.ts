import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatSnackBar, MatSnackBarVerticalPosition, MatSnackBarHorizontalPosition } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class AppDataService {
    // Private
    private _configSubject: BehaviorSubject<any>;

    constructor(
        private _snackBar: MatSnackBar
    ) {
        // Set the config from the default config
        this._configSubject = new BehaviorSubject(new Object());
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set and get the config
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

    playAudio(type: string = 'default', volume: number = 1): void {
        const audio = new Audio();
        audio.src = `assets/sounds/${type}.mp3`;
        audio.load();
        audio.volume = volume;
        audio.play();
    }

    showMessage(message: string, vPos?: MatSnackBarVerticalPosition, hPos?: MatSnackBarHorizontalPosition, style?: string, duration?: number): void {
        this._snackBar.open(message, 'x', {
            duration: duration || 2000,
            verticalPosition: vPos || 'top', // 'top' | 'bottom'
            horizontalPosition: hPos || 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
            panelClass: style ? [style] : ['snackbar']
        });
    }
}
