import { Component, OnInit, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { TwUnknown } from '@ad/types';

/**
 * Unknown / Invalid component placeholder
 */
@Component({
    selector: 'tw-unknown',
    templateUrl: './tw-unknown.component.html',
    styleUrls: ['./tw-unknown.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwUnknownComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Data from config
     */
    @Input() data: TwUnknown;

    constructor() {
        super('TwUnknownComponent');
    }

    /**
     * Lifexycle Hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
    }

    /**
     * Lifexycle Hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
