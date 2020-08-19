import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

@Component({
    selector: 'tw-interaction-selector',
    templateUrl: './tw-interaction-selector.component.html',
    styleUrls: ['./tw-interaction-selector.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwInteractionSelectorComponent implements OnInit {

    @Input() users: any;

    constructor() { }

    ngOnInit(): void {
    }

}
