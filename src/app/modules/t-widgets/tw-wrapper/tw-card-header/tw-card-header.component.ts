import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'tw-card-header',
    templateUrl: './tw-card-header.component.html',
    styleUrls: ['./tw-card-header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardHeaderComponent implements OnInit {

    @Input() data: any;

    @Input() fuseConfig: any;

    constructor() { }

    ngOnInit(): void {

    }

    maximize(event: any): void {
        event.preventDefault();
        event.stopPropagation();

        console.log('##### MAXIMIZE #####');

    }

}
