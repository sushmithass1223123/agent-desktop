import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    ): void {
        const icons = {
            success: 'done',
            failure: 'close',
            loading: 'loop'
        };
        this._matSnackBar.openFromComponent(SnackbarComponent, {
            data: {
                icon: icons[state],
                color: state === 'success' ? 'success' : 'primary',
                message
            },
            duration,
            verticalPosition: position
        });
    }
}
