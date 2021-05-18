import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';

/**
 * Twc not found component
 */
@Component({
    selector: 'twc-not-found',
    templateUrl: './twc-not-found.component.html',
    styleUrls: ['./twc-not-found.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcNotFoundComponent implements OnInit {
    /**
     * Type of content page
     */
    @Input() title: string;

    /**
     * Type of content page
     */
    @Input() type: string;

    /**
     * Type of content page
     */
    @Input() message: string;

    /**
     * Holds all the data related to this widget from the config
     */
    widgetData: IWidget;

    constructor() {}

    /**
     * OnInit
     */
    ngOnInit(): void {
        // assing the widget model to data
        this.widgetData = new TwWidgetModel(this.title, 'twc-no-' + this.type);
        this.widgetData.Config.Position.X = 3;
        this.widgetData.Config.Position.Y = 6;
    }
}
