import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUiService } from '@services/app-ui.service';
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
export class CustomDialogComponent implements OnInit, OnDestroy {
    /**
     * Prompt data entered
     */
    promptData: string;

    /**
     * dialog reference for confirmation dialog
     */
    confirmDialogRef!: MatDialogRef<any, any>;

    /**
     * Constructor
     *
     * @param {CustomDialogData} data
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: CustomDialogData & CustomDialogOtherData & CustomDialogActions,
        private _appUIService: AppUiService
    ) {
        this.promptData = '';
    }

    /**
     * OnInit
     */
    ngOnInit(): void {}

    /**
     * OnDestroy
     */

    ngOnDestroy(): void {
        this.confirmDialogRef?.close();
    }

    /**
     * showing a confirmation before closing
     */
    confirmClose() {
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog('generic',
            '',
            this.data.confirmMessage ? this.data.confirmMessage : 'Are you sure to close'
        );
        this.confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // close main dialog
                this.data.cancel();
            }
        });
    }
}
