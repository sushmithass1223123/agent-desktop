import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppAlertDialogConstants } from 'app/constants';
import { AppAlertDialogData } from 'app/interfaces';

@Component({
    selector: 'alert-dialog',
    templateUrl: './alert-dialog.component.html',
    styleUrls: ['./alert-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AlertDialogComponent implements OnInit {
    icon: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: AppAlertDialogData) {}

    ngOnInit(): void {
        const { icon, heading } = AppAlertDialogConstants[this.data.type];
        this.data.heading = this.data.heading || heading;
        this.icon = icon;
    }
}
