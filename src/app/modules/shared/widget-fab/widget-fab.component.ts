import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { widgetFabAnimations } from './widget-fab.animation';
@Component({
    selector: 'widget-fab',
    templateUrl: './widget-fab.component.html',
    styleUrls: ['./widget-fab.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: widgetFabAnimations
})
export class WidgetFabComponent implements OnInit {


    fabButtons = [
        {
            icon: 'timeline'
        },
        {
            icon: 'view_headline'
        },
        {
            icon: 'room'
        },
        {
            icon: 'lightbulb_outline'
        },
        {
            icon: 'lock'
        }
    ];
    buttons = [];
    fabTogglerState = 'inactive';

    constructor() { }

    ngOnInit(): void {
    }

    showItems(): void {
        this.fabTogglerState = 'active';
        this.buttons = this.fabButtons;
    }

    hideItems(): void {
        this.fabTogglerState = 'inactive';
        this.buttons = [];
    }

    onToggleFab(): void {
        this.buttons.length ? this.hideItems() : this.showItems();
    }

}
