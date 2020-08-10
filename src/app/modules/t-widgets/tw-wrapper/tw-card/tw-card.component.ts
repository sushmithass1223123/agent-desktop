import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

@Component({
    selector: 'tw-card',
    templateUrl: './tw-card.component.html',
    styleUrls: ['./tw-card.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardComponent implements OnInit {

    @Input() data: any;

    @Input() fuseConfig: any;

    constructor() { }

    ngOnInit(): void {
    }

}
