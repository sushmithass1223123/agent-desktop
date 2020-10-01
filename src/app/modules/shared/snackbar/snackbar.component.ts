import { Component, Inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { SnackbarStateTypes } from 'app/interfaces';

@Component({
    selector: 'snackbar',
    templateUrl: './snackbar.component.html',
    styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent {
    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: {
        /**
         * Snackbar message
         */
        message: string;
        /**
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
        loading: boolean
    }) { }
}
