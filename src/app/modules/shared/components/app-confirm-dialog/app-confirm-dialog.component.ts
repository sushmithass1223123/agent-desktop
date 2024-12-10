import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
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

    constructor(@Inject(MAT_DIALOG_DATA) public data: AppConfirmDialogData) {}

    /**
     * OnInit
     */
    ngOnInit(): void {
        const { title, message, type } = AppConfirmDialogConstants[this.data.type];
        this.data.title = this.data.title || title;
        this.data.message = this.data.message || message;
        this.type = type;
        this.vector = ['endInteraction', 'closeInteraction'].includes(type) ? 'vector-1' : 'vector-2';
    }
}
