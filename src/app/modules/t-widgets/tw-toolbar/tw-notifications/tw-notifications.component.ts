import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';

@Component({
    selector: 'tw-notifications',
    templateUrl: './tw-notifications.component.html',
    styleUrls: ['./tw-notifications.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwNotificationsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    opened = false;

    constructor() {
        super();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    menuOpened(opened: boolean): void {
        this.opened = opened;
    }
}
