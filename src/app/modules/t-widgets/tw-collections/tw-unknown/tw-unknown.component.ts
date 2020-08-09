import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';

@Component({
    selector: 'tw-unknown',
    templateUrl: './tw-unknown.component.html',
    styleUrls: ['./tw-unknown.component.scss']
})
export class TwUnknownComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;
    loaded = false;
    url: any;

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

}
