import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar, MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA } from '@angular/material/legacy-snack-bar';

@Component({
    selector: 'app-snackbar',
    templateUrl: './app-snackbar.component.html',
    styleUrls: ['./app-snackbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppSnackbarComponent implements OnInit {
    constructor(
        private _snackbar: MatSnackBar,
        @Inject(MAT_SNACK_BAR_DATA)
        public data: {
            /**
             * Snackbar message
             */
            message: string;
            /**
             * Snackbar icon
             */
            icon: string;
            /**
             * functiontobe executed when clicked
             */
            onClick: (...args) => void;
        }
    ) {}

    /**
     * OnInit
     */
    ngOnInit(): void {}

    /**
     * To dismiss the snackbar
     */
    public dismiss(): void {
        this._snackbar.dismiss();
    }

    onSnackbarClick(): void {
        if (this.data.onClick) {
            this.data.onClick();
            this.dismiss();
        }
    }
}
