import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
    selector: 'app-snackbar',
    templateUrl: './app-snackbar.component.html',
    styleUrls: ['./app-snackbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppSnackbarComponent implements OnInit {

    constructor(private _snackbar: MatSnackBar, @Inject(MAT_SNACK_BAR_DATA) public data:
        {
            /**
             * Snackbar message
             */
            message: string;
            /**
             * Snackbar icon
             */
            icon: string;
        }) {

    }

    /**
     * OnInit
     */
    ngOnInit(): void {
    }

    /**
     * To dismiss the snackbar
     */
    public dismiss(): void {
        this._snackbar.dismiss();
    }

}
