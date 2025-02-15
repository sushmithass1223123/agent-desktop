import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
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
export class TwToolbarMenuComponent implements OnInit {
    /**
     * App config json data
     */
    @Input() data: IWidget;

    /**
     * Toolbar menu widget
     */
    toolbarMenuWidget: IWidget[] = [];

    constructor() {
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        // get the toolbar menu widgets
        this.toolbarMenuWidget = this.data.Data.Widgets || [];
    }
}
