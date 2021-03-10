import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfig } from '@fuse/types';
import { IWidget } from 'app/interfaces';

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

    /**
     * appConfig
     */
    appConfig: any;

    /**
     * Fuse config
     */
    fuseConfig: FuseConfig;

    constructor() { }

    /**
     * On Init
     */
    ngOnInit(): void {
    }

}
