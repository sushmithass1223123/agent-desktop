import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
    selector: 'app-snackbar',
    templateUrl: './app-snackbar.component.html',
    styleUrls: ['./app-snackbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppSnackbarComponent implements OnInit {

    constructor(@Inject(MAT_SNACK_BAR_DATA) public data:
        {
            /**
             * Snackbar type
             */
            type: string
            /**
             * Snackbar message
             */
            message: string;
            /**
             * Snackbar state
             */
            state: string;
            /**
             * Snackbar icon
             */
            icon: string;
        }) {

    }

    ngOnInit(): void {
    }

}
