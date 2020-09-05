import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

@Component({
    selector: 'tw-instant-messaging',
    templateUrl: './tw-instant-messaging.component.html',
    styleUrls: ['./tw-instant-messaging.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwInstantMessagingComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    opened = false;

    constructor(
        private _fuseSidebarService: FuseSidebarService
    ) {
        super();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key: string): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
