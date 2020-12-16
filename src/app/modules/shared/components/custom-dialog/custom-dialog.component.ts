import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomDialogData } from 'app/interfaces';

@Component({
    selector: 'custom-dialog',
    templateUrl: './custom-dialog.component.html',
    styleUrls: ['./custom-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CustomDialogComponent implements OnInit {

    /**
     * Prompt data entered
     */
    promptData: string;

    /**
     * Constructor
     *
     * @param {CustomDialogData} data
     */
    constructor(@Inject(MAT_DIALOG_DATA) public data: CustomDialogData) {
        this.promptData = '';
    }

    /**
     * OnInit
     */
    ngOnInit(): void {

    }
}
