import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { TWContentLibrary } from '@modules/t-widgets/utils';
import { IWidget } from 'app/interfaces';
import { AppDataService } from 'app/services/app-data.service';
import { ContentPageService } from 'app/services/content-page.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
    contentWidgets = [];

    /**
     * Constructor
     *
     * @param {AppDataService} _appDataService
     * @param {ContentPageService} _contentPageService
     */
    constructor(
        private _appDataService: AppDataService,
        private _contentPageService: ContentPageService
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
                        const widgets = config.Main.Content.Widgets || [];
                        // loop and get the widgets
                        widgets.forEach((widget: IWidget) => {
                            // get the widget component by type 
                            const component = TWContentLibrary.getWidget(widget.Type, widget);
                            // check if the component is proper
                            if (component) {
                                // append the widget component to the list
                                this.contentWidgets.push(component);
                            }
                        });
                    }
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Methods
    // -----------------------------------------------------------------------------------------------------    

    updateViewMode(mode: string): void {
        this._contentPageService.mode = mode;
    }
}
