import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'twc-no-widgets',
    templateUrl: './twc-no-widgets.component.html',
    styleUrls: ['./twc-no-widgets.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcNoWidgetsComponent implements OnInit {

    @Input() type: string;

    constructor() { }

    ngOnInit(): void {
    }

}
