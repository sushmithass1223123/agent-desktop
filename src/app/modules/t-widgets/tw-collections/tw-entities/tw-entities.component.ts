import { Component, Input, OnInit } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';

/**
 * Tw Entities component
 */
@Component({
    selector: 'tw-entities',
    templateUrl: './tw-entities.component.html',
    styleUrls: ['./tw-entities.component.scss']
})
export class TwEntitiesComponent extends TWidgetWrapper implements OnInit {
    /**
     * App config data
     */
    @Input() data: any;

    /**
     * Current interaction data
     */
    interactionId: number;

    constructor() {
        super();
    }

    /**
     * Life cycle hook
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        // get the entities
        console.log('#####################', this.data);
    }
}
