import { Component, HostBinding, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { AppUiService } from '@services/app-ui.service';

/**
 * Simple Projection component used to wrap widgets
 */
@Component({
    selector: 'tw-card',
    templateUrl: './tw-card.component.html',
    styleUrls: ['./tw-card.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardComponent implements OnInit {
    /**
     * Host class for style z-index
     */
    @HostBinding('style.z-index')
    /**
     * index to drag
     */
    zIndex: number;
    constructor(private _appUiService: AppUiService) {}

    /**
     * Lifecycle hook on mount of component
     */
    ngOnInit(): void {}

    @HostListener('click', ['$event'])
    onDragStart(event: MouseEvent): void {
        this.bringToFront();
    }

    private bringToFront(): void {
        this.zIndex = this._appUiService.findMaxZIndexElement() + 1;
    }
}
