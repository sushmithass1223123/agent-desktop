import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { widgetFabAnimations } from './widget-fab.animation';
import { IWidget } from 'app/interfaces';
import { AOTWidgetService } from '@services/aot-widget.service';
@Component({
    selector: 'widget-fab',
    templateUrl: './widget-fab.component.html',
    styleUrls: ['./widget-fab.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: widgetFabAnimations
})
export class WidgetFabComponent implements OnInit {


    @Input() fabWidgets: IWidget[];

    buttons: IWidget[] = [];
    fabTogglerState = 'inactive';

    constructor(
        private _aotWidgetService: AOTWidgetService
    ) { }

    ngOnInit(): void {
    }

    showItems(): void {
        this.fabTogglerState = 'active';
        this.buttons = this.fabWidgets;
    }

    hideItems(): void {
        this.fabTogglerState = 'inactive';
        this.buttons = [];
    }

    onToggleFab(): void {
        this.buttons.length ? this.hideItems() : this.showItems();
    }

    openAOTWidget(widget: IWidget): void {
        // if widget data is there, then open AOT
        if (widget) {
            this._aotWidgetService.addWidget(widget);
        }
        // toggle FAB
        this.onToggleFab();
    }

}
