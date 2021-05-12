import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AOTWidgetService } from '@services/aot-widget.service';
import { IWidget } from 'app/interfaces';

/**
 * Widget Fab menu
 */
@Component({
    selector: 'widget-fab',
    templateUrl: './widget-fab.component.html',
    styleUrls: ['./widget-fab.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: appAnimations
})
export class WidgetFabComponent implements OnInit, OnChanges {
    /**
     * Input data form app config
     */
    @Input() fabWidgets: IWidget[];
    /**
     * FAB button drag start flag
     */
    @Input() aotFABDrag: boolean;
    /**
     * Widget buttons
     */
    buttons: IWidget[] = [];
    /**
     * To open widget list flag
     */
    openWidgetList: boolean;
    /**
     * FAB drag ref
     */
    private _fabDragRef: boolean;

    constructor(private _aotWidgetService: AOTWidgetService) { }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        this.buttons = this.fabWidgets || [];
    }

    /**
     * On Change
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.aotFABDrag?.currentValue === true) {
            this._fabDragRef = true;
        }
    }

    /**
     * To toggle widget list
     */
    toggleWidgetList(): void {
        if (this._fabDragRef) {
            this._fabDragRef = false;
            return;
        }
        this.openWidgetList = !this.openWidgetList;
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
    }
}
