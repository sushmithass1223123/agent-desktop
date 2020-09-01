import { Component, Inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { ThemePalette } from '@angular/material/core';

@Component({
    selector: 'snackbar',
    templateUrl: './snackbar.component.html',
    styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent implements OnInit {
    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: { message: string; icon: string; color: ThemePalette; loading: boolean }) {}

    ngOnInit(): void {}
}
