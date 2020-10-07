import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidget } from '@modules/t-widgets/utils';
import { AOTWidgetService } from '@services/aot-widget.service';
import { IWidget } from 'app/interfaces';
import { AppDataService } from 'app/services/app-data.service';
import { ContentPageService } from 'app/services/content-page.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Content Component
 */
@Component({
    selector: 'content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ContentComponent implements OnInit, OnDestroy {

    // Private
    private _unsubscribeAll: Subject<any>;

    viewMode = '';
    contentWidgets: TWidget[] = [];
    aotWidget: TWidget;
    aotWidgets: IWidget[];

    /**
     * Constructor
     *
     * @param {AppDataService} _appDataService
     * @param {ContentPageService} _contentPageService
     * @param {AOTWidgetService} _aotWidgetService
     */
    constructor(
        private _appDataService: AppDataService,
        private _contentPageService: ContentPageService,
        private _aotWidgetService: AOTWidgetService
    ) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------    

    ngOnInit(): void {
        // Subscribe to config changes
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (config: any) => {
                    // check if the config is not null
                    if (config !== null) {
                        // get the content widgets
                        this.contentWidgets = config.Main.Content.Widgets || [];
                    }
                }
            );

        // subscribe to the AOT widget service
        this._aotWidgetService.subscribe();

        // subscribe to AOT widgets
        this._aotWidgetService.widgets
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (widgets: IWidget[]) => {
                    this.aotWidgets = widgets;
                }
            );
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        // unsubscribe to the AOT widget service
        this._aotWidgetService.unsubscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Methods
    // -----------------------------------------------------------------------------------------------------    

    updateViewMode(mode: string): void {
        this._contentPageService.mode = mode;
    }
}
