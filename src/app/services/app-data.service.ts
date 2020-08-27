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
    private _audioInterval: any;
    private _audio: any;

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
