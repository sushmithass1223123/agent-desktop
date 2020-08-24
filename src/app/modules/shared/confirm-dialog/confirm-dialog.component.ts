import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ConfirmDialogComponent implements OnInit {

    public title: string;
    public message: string;
    public isAlert: boolean;

    /**
     * Constructor
     *
     * @param {MatDialogRef<ConfirmDialogComponent>} dialogRef
     */
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>
    ) {
        this.title = '';
        this.message = '';
        this.isAlert = false;
    }

    ngOnInit(): void {
    }

}
