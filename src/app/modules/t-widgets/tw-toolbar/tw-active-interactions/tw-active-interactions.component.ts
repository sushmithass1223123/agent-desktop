import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { InteractionRef } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'tw-active-interactions',
    templateUrl: './tw-active-interactions.component.html',
    styleUrls: ['./tw-active-interactions.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwActiveInteractionsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    interactionList: InteractionRef[] = [];
    currentViewMode: string;

    constructor(
        private _interactionManagerService: InteractionManagerService,
        private _contentPageService: ContentPageService
    ) {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to interactions subject
        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                setTimeout(() => {
                    this.interactionList = interactions.filter(i => i.status === 'connected');
                }, 500);
            });

        // subscribe to content page subject
        this._contentPageService.mode
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((mode: string) => {
                this.currentViewMode = mode;
            });
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    openInteraction(item: InteractionRef): void {
        // if the item is already active ignore
        if (!item.isActive && item.path === this.currentViewMode) {
            // set interaction active
            this._interactionManagerService.updateInteraction(item.interactionId, {
                'isActive': true
            });
            // set the content page active
            this._contentPageService.mode = item.path;
        }
    }
}
