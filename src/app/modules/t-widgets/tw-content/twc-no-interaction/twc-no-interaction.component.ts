import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';

/**
 * No interaction component
 */
@Component({
    selector: 'twc-no-interaction',
    templateUrl: './twc-no-interaction.component.html',
    styleUrls: ['./twc-no-interaction.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcNoInteractionComponent implements OnInit {

    /**
     * Type of content page
     */
    @Input() type: string;

    /**
     * Holds all the data related to this widget from the config
     */
    widgetData: IWidget;

    constructor() { }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // assing the widget model to data
        this.widgetData = new TwWidgetModel('No Interaction', 'twc-no-interaction');
        this.widgetData.Config.Position.X = 3;
        this.widgetData.Config.Position.Y = 6;
    }
}
