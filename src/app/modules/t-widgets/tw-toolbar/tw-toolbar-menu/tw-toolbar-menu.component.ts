import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-toolbar-menu',
    templateUrl: './tw-toolbar-menu.component.html',
    styleUrls: ['./tw-toolbar-menu.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwToolbarMenuComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    toolbarMenuWidget: IWidget[] = [];

    constructor() {
        super();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);

        // get the toolbar menu widgets
        this.toolbarMenuWidget = this.data.Data.Widgets || [];
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }
}
