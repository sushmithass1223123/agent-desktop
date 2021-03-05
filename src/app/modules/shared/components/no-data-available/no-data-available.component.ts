import { Component, Input, OnInit } from '@angular/core';

/**
 * Display when no dta aavailable in widget to show
 */
@Component({
    selector: 'no-data-available',
    templateUrl: './no-data-available.component.html',
    styleUrls: ['./no-data-available.component.scss']
})
export class NoDataAvailableComponent implements OnInit {
    /**
     * Custom message
     */
    @Input() msg = 'No Data Available';

    constructor() { }

    /**
     * Llifecycle hoook
     * @method
     */
    ngOnInit(): void { }
}
