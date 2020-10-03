import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'no-data-available',
    templateUrl: './no-data-available.component.html',
    styleUrls: ['./no-data-available.component.scss']
})
export class NoDataAvailableComponent implements OnInit {
    @Input() msg?: string = 'No Data Available';
    constructor() {}

    ngOnInit(): void {}
}
