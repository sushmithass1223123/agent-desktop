import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';

@Component({
    selector: 'tw-active-interactions',
    templateUrl: './tw-active-interactions.component.html',
    styleUrls: ['./tw-active-interactions.component.scss']
})
export class TwActiveInteractionsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    constructor() {
        super();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }
}
