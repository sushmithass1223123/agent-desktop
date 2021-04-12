import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { widgetFabAnimations } from '@modules/shared/animations/widget-fab.animation';
import { IWidget } from 'app/interfaces';
import { AOTWidgetService } from '@services/aot-widget.service';
import { merge } from 'lodash';
import { TwWidgetModel } from 'app/models';

/**
 * Widget Fab menu
 */
@Component({
    selector: 'widget-fab',
    templateUrl: './widget-fab.component.html',
    styleUrls: ['./widget-fab.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: widgetFabAnimations
})
export class WidgetFabComponent implements OnInit {
    /**
     * Input data form app config
     */
    @Input() fabWidgets: IWidget[];

    /**
     * Widget buttons
     */
    buttons: IWidget[] = [];
    /**
     * Toggler state
     */
    fabTogglerState = 'inactive';

    constructor(private _aotWidgetService: AOTWidgetService) { }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void { }

    /**
     * on toggle , show items
     * @method
     */
    showItems(): void {
        this.fabTogglerState = 'active';
        this.buttons = this.fabWidgets;
    }

    /**
     * hide items
     * @method
     */
    hideItems(): void {
        this.fabTogglerState = 'inactive';
        this.buttons = [];
    }

    /**
     * On toggle fab
     * @method
     */
    onToggleFab(): void {
        this.buttons.length ? this.hideItems() : this.showItems();
    }

    /**
     * Open AOT widget
     * @param {IWidget} widget 
     */
    openAOTWidget(widget: IWidget): void {
        // if widget data is there, then open AOT
        if (widget) {
            this._aotWidgetService.addWidget(widget);
        }
        // toggle FAB
        this.onToggleFab();
    }
}
