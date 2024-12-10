import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { RemiderTaskDialogConstants } from 'app/constants';
import { ReminderTaskDialogData, ReminderTaskDialogTypes } from 'app/interfaces';

/**
 * Reminder task dialog component
 */
@Component({
    selector: 'reminder-task-dialog',
    templateUrl: './reminder-task-dialog.component.html',
    styleUrls: ['./reminder-task-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ReminderTaskDialogComponent implements OnInit {
    /**
     * Type of reminder
     */
    type: ReminderTaskDialogTypes;
    /**
     * Snooze timer types
     */
    snoozeTimerTypes = ['reminder', 'makecall', 'meeting', 'changestate'];
    /**
     * Snooze time
     */
    snoozeTime: number;
    /**
     * Snooze timer
     */
    snoozeTimer: number[] = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

    constructor(@Inject(MAT_DIALOG_DATA) public data: ReminderTaskDialogData) {}

    /**
     * On Init
     */
    ngOnInit(): void {
        const { title, message, type } = RemiderTaskDialogConstants[this.data.type];
        this.data.title = this.data.title || title;
        this.data.message = this.data.message || message;
        this.type = type;
    }
}
