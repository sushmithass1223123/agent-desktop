import { Component, OnInit, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { FuseConfigService } from '@fuse/services/config.service';

@Component({
    selector: 'tw-sample',
    templateUrl: './tw-sample.component.html',
    styleUrls: ['./tw-sample.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSampleComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

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
