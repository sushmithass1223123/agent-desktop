import { Component, Input, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
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
    @Input() msg;

    constructor(private translocoService: TranslocoService) {}

    /**
     * Llifecycle hoook
     * @method
     */
    ngOnInit(): void {
        this.msg = this.translocoService.translate('contentComponent.noDataAvailable');
    }
}
