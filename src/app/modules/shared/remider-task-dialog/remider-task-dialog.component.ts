import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RemiderTaskDialogConstants } from 'app/constants';
import { ReminderTaskDialogData } from 'app/interfaces';

@Component({
    selector: 'reminder-task-dialog',
    templateUrl: './remider-task-dialog.component.html',
    styleUrls: ['./remider-task-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RemiderTaskDialogComponent implements OnInit {
    type: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: ReminderTaskDialogData) { }

    ngOnInit(): void {
        const { message, type } = RemiderTaskDialogConstants[this.data.type];
        this.data.message = this.data.message || message;
        this.type = type;
    }
}
