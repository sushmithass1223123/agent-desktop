import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { TwWidgetModel } from 'app/models';

@Component({
    selector: 'twc-no-widgets',
    templateUrl: './twc-no-widgets.component.html',
    styleUrls: ['./twc-no-widgets.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcNoWidgetsComponent implements OnInit {

    @Input() type: string;

    data: any;

    constructor() { }

    ngOnInit(): void {
        // assing the widget model to data
        this.data = new TwWidgetModel('No Widgets', 'twc-no-widget');
        this.data.Config.Position.X = 3;
        this.data.Config.Position.Y = 6;
    }
}
