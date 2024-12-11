import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppAlertDialogConstants } from 'app/constants';
import { AppAlertDialogData } from 'app/interfaces';

/**
 * Alert dialog component controlled via app ui service
 */
@Component({
    selector: 'alert-dialog',
    templateUrl: './alert-dialog.component.html',
    styleUrls: ['./alert-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AlertDialogComponent implements OnInit {
    /**
     * Custom icon
     */
    icon: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: AppAlertDialogData) {}

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        const { icon, heading } = AppAlertDialogConstants[this.data.type];
        this.data.heading = this.data.heading || heading;
        this.icon = icon;
    }
}
