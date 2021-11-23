import { Component, OnInit, ViewEncapsulation } from '@angular/core';

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
    constructor() {}

    /**
     * Lifecycle hook on mount of component
     */
    ngOnInit(): void {}
}
