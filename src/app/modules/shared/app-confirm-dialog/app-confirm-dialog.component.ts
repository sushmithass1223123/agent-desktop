import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppConfirmDialogConstants } from 'app/constants';
import { AppConfirmDialogData } from 'app/interfaces';

/**
 * App confirmation dialog component
 */
@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './app-confirm-dialog.component.html',
    styleUrls: ['./app-confirm-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppConfirmDialogComponent implements OnInit {
    /**
     * Type of confirmation
     */
    type: string;

    /**
     * Type of vector image based on type
     */
    vector: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: AppConfirmDialogData) { }

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        const { title, message, type } = AppConfirmDialogConstants[this.data.type];
        this.data.title = this.data.title || title;
        this.data.message = this.data.message || message;
        this.type = type;
        this.vector = ['endInteraction', 'closeInteraction', 'generic'].includes(type) ? 'vector-1' : 'vector-2';
    }
}
