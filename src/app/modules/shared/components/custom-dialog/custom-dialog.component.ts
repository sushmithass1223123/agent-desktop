import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomDialogData, CustomDialogOtherData } from 'app/interfaces';

type CustomDialogActions = {
    /**
     * Done callback
     */
    done: (data?: any) => void;
    /**
     * Cancel callback
     */
    cancel: () => void;
};

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
    constructor(@Inject(MAT_DIALOG_DATA) public data: CustomDialogData & CustomDialogOtherData & CustomDialogActions) {
        this.promptData = '';
    }

    /**
     * OnInit
     */
    ngOnInit(): void {}
}
