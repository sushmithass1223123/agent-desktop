import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { IWidget } from 'app/interfaces';
import { AppDataService } from 'app/services/app-data.service';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

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
    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * Content widget list
     */
    contentWidgets: IWidget[];
    /**
     * AOT widget list
     */
    aotWidgets: IWidget[];

    /**
     * Constructor
     *
     * @param {AppDataService} _appDataService
     * @param {AOTWidgetService} _aotWidgetService
     */
    constructor(private _appDataService: AppDataService, private _aotWidgetService: AOTWidgetService) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.contentWidgets = [];
        this.aotWidgets = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On Init
     */
    ngOnInit(): void {
        // Subscribe to config changes
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            // check if the config is not null
            if (config !== null) {
                // get the content widgets
                this.contentWidgets = config.Main.Content.Widgets || [];
            }
        });

        // subscribe to the AOT widget service
        this._aotWidgetService.subscribe();

        // subscribe to AOT widgets
        this._aotWidgetService.widgets
            .pipe(
                takeUntil(this._unsubscribeAll),
                map((widgets) => widgets.filter((widget) => !widget.Config.LocalAOT)),
                filter((widgets) => widgets.length > 0)
            )
            .subscribe((widgets) => {
                this.aotWidgets = widgets;
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // unsubscribe to the AOT widget service
        this._aotWidgetService.unsubscribe();
    }
}
