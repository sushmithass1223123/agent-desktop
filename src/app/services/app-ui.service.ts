import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { AlertDialogComponent } from '@modules/shared/alert-dialog/alert-dialog.component';
import { SnackbarComponent } from '../modules/shared/snackbar/snackbar.component';
import { AppAlertDialogTypes } from 'app/interfaces';

@Injectable({
    providedIn: 'root'
})
export class AppUiService {
    constructor(private _matSnackBar: MatSnackBar, private _matDialog: MatDialog) {}

    showSnackbar(
        message: string,
        state: 'loading' | 'success' | 'failure' = 'success',
        duration: number = 5000,
        position: 'top' | 'bottom' = 'top'
    ): MatSnackBarRef<SnackbarComponent> {
        const icons = {
            success: 'done',
            failure: 'close',
            loading: 'loop'
        };
        const durationField = state === 'loading' ? {} : { duration };
        this._matSnackBar.dismiss();
        return this._matSnackBar.openFromComponent(SnackbarComponent, {
            data: {
                icon: icons[state],
                loading: state === 'loading',
                color: state === 'success' ? 'success' : 'primary',
                message
            },
            verticalPosition: position,
            ...durationField
        });
    }

    showAlertModal(message: string, type: AppAlertDialogTypes = 'success', heading?: string): MatDialogRef<AlertDialogComponent> {
        const dialogRef = this._matDialog.open(AlertDialogComponent, {
            data: {
                message,
                heading,
                type,
                close: () => dialogRef.close()
            },
            panelClass: 'alert-dialog',
            width: '400px'
        });
        return dialogRef;
    }
}
