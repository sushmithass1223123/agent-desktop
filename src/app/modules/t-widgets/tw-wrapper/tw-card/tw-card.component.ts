import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

/**
 * Simple Projection component used to wrap widgets
 */
@Component({
    selector: 'tw-card',
    templateUrl: './tw-card.component.html',
    styleUrls: ['./tw-card.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardComponent implements OnInit {

    /**
     * Data from App json
     */
    @Input() data: any;

    /**
     * Fuse Config data
     */
    @Input() fuseConfig: any;

    constructor() { }

    /**
     * Lifecycle hook on mount of component
     */
    ngOnInit(): void {
    }

}
