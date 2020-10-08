import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { IWidget } from 'app/interfaces';

/**
 * Toolbar menu
 */
@Component({
    selector: 'tw-toolbar-menu',
    templateUrl: './tw-toolbar-menu.component.html',
    styleUrls: ['./tw-toolbar-menu.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwToolbarMenuComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: IWidget;

    /**
     * Toolbar menu widget
     */
    toolbarMenuWidget: IWidget[] = [];

    constructor() {
        super();
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.initWrapper(this.data);

        // get the toolbar menu widgets
        this.toolbarMenuWidget = this.data.Data.Widgets || [];
    }

    /**
     * Lifecyclle hook
     */
    ngOnDestroy(): void {
        this.destroyWrapper();
    }
}
