import { Component, Inject } from '@angular/core';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { SnackbarStateTypes } from 'app/interfaces';

/**
 * Snackbar component
 */
@Component({
    selector: 'snackbar',
    templateUrl: './snackbar.component.html',
    styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent {
    constructor(
        private _snackbar: MatSnackBar,
        @Inject(MAT_SNACK_BAR_DATA) public data: {
            /**
             * Snackbar message
             */
            message: string;
            /**
             *
             * Snackbar state icon
             */
            icon:
            string;
            /**
             * Sncakbar state type of type SnackbarStateTypes
             */
            state: SnackbarStateTypes;
            /**
             * Loading flag
             */
            loading: boolean
        }) { }

    /**
     * To close the snackbar
     */
    public close(): void {
        this._snackbar.dismiss();
    }
}
