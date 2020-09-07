import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../modules/shared/snackbar/snackbar.component';

@Injectable({
    providedIn: 'root'
})
export class AppUiService {
    constructor(private _matSnackBar: MatSnackBar) {}

    showSnackbar(
        message: string,
        state: 'loading' | 'success' | 'failure' = 'success',
        duration: number = 5000,
        position: 'top' | 'bottom' = 'top'
    ): MatSnackBarRef<SnackbarComponent> {
        const icons = {
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
                color: state === 'success' ? 'success' : 'primary',
                message
            },
            verticalPosition: position,
            ...durationField
        });
    }
}
