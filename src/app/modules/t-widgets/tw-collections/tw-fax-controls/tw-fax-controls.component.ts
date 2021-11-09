import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { IWidget } from 'app/interfaces';
import { TwFaxControls } from '@ad/types';

/**
 * Fax control component
 */
@Component({
    selector: 'tw-fax-controls',
    templateUrl: './tw-fax-controls.component.html',
    styleUrls: ['./tw-fax-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwFaxControlsComponent implements OnInit {
    /**
     * data from widget
     */
    @Input() data: IWidget;

    constructor() {}

    /**
     * On Init
     */
    ngOnInit(): void {}
}
