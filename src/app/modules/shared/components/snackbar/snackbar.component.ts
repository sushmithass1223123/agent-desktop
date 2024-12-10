import { Component, Inject } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar, MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA } from '@angular/material/legacy-snack-bar';
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
        @Inject(MAT_SNACK_BAR_DATA)
        public data: {
            /**
             * Snackbar message
             */
            message: string;
            /**
             *
             * Snackbar state icon
             */
            icon: string;
            /**
             * Sncakbar state type of type SnackbarStateTypes
             */
            state: SnackbarStateTypes;
            /**
             * Loading flag
             */
            loading: boolean;
            /**
             * On click function
             */
            onClick?: () => void;
        }
    ) {}

    /**
     * To close the snackbar
     */
    public close(): void {
        this._snackbar.dismiss();
    }

    /**
     * On click of the snackbar
     */
    public onClick(): void {
        if (typeof this.data.onClick === 'function') {
            this._snackbar.dismiss();
            this.data.onClick();
        }
    }
}
