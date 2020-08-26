import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { TwWidgetModel } from 'app/models';

@Component({
    selector: 'twc-no-interaction',
    templateUrl: './twc-no-interaction.component.html',
    styleUrls: ['./twc-no-interaction.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcNoInteractionComponent implements OnInit {

    @Input() type: string;

    data: any;

    constructor() { }

    ngOnInit(): void {
        // assing the widget model to data
        this.data = new TwWidgetModel('No Interaction', 'tw-no-interaction');
        this.data.Config.Position.X = 3;
        this.data.Config.Position.Y = 6;
    }
}
