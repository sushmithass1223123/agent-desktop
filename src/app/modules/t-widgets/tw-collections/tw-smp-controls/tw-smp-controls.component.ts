import { TwSmpControls } from '@ad/types';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { filter } from 'rxjs/operators';

declare var document: any;

interface SocialMediaPostIncomingEvent {}

@Component({
    selector: 'tw-smp-controls',
    templateUrl: './tw-smp-controls.component.html',
    styleUrls: ['./tw-smp-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSmpControlsComponent extends TWidgetWrapper {
    /**
     * To hold all the data related to this widget from the config
     */
    @Input() data: TwSmpControls<SocialMediaPostIncomingEvent>;
    /**
     * To emit maximize event on widget maximize
     */
    @Output() maximizeEvent = new EventEmitter();
    /**
     * To emit float event on widget maximize
     */
    @Output() floatEvent = new EventEmitter();
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(
            filter(() => this.data?.Config?.Anchor)
        ),
        widget$: this._fuseFacadeService.widgetBgClasses$,
        config$: this._fuseFacadeService.getConfig({ colorTheme: 'colorTheme' })
    };
    /**
     * Flag to show popup UI
     */
    popupInteraction: boolean = false;

    isMaximizedMode: boolean = false;

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService
    ) {
        super('TwSmpControlsComponent');
    }

    toggleInteractionPopup(): void {
        try {
            document.querySelector('.navbar-fuse-sidebar').style.zIndex = this.popupInteraction
                ? 1000
                : 8;
            this.popupInteraction = !this.popupInteraction;
        } catch (error) {
            console.error(error);
        }
    }

    onMaximized(isMax: boolean): void {
        this.isMaximizedMode = isMax;
        this.maximizeEvent.emit(isMax);
    }

    onFloated(isFloat: boolean): void {
        this.isMaximizedMode = isFloat;
        this.floatEvent.emit(isFloat)
    }
}
