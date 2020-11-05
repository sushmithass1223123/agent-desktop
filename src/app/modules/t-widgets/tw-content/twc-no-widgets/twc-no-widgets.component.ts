import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';

/**
 * No widget component
 */
@Component({
    selector: 'twc-no-widgets',
    templateUrl: './twc-no-widgets.component.html',
    styleUrls: ['./twc-no-widgets.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcNoWidgetsComponent implements OnInit {

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
        this.widgetData = new TwWidgetModel('No Widgets', 'twc-no-widget');
        this.widgetData.Config.Position.X = 3;
        this.widgetData.Config.Position.Y = 6;
    }
}
