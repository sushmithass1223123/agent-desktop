import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { IWidget } from 'app/interfaces';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * QuickPanelComponent
 */
@Component({
    selector: 'quick-panel',
    templateUrl: './quick-panel.component.html',
    styleUrls: ['./quick-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class QuickPanelComponent implements OnInit, OnDestroy {
    /**
     * Subject to unsubscribe
     */
    unsubscribeAll: Subject<any>;
    /**
     * Current date
     */
    date: Date;
    /**
     * Event list
     */
    events: any[];
    /**
     * Notes list
     */
    notes: any[];
    /**
     * Settings
     */
    settings: any;
    /**
     * Pinned AOT list
     */
    pinnedAOTs: IWidget[];

    /**
     * Constructor
     */
    constructor(
        private _appDataService: AppDataService,
        private _aotWidgetService: AOTWidgetService,
        private _fuseSidebarService: FuseSidebarService
    ) {
        // init the subject
        this.unsubscribeAll = new Subject();
        // Set the defaults
        this.date = new Date();
        this.settings = {
            notify: true,
            cloud: false,
            retro: true
        };
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        this._appDataService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((config: any) => {
                if (config) {
                    this.pinnedAOTs = config.Main.AOT.Widgets?.filter((w: IWidget) => w.Config.Pinned === true);
                }
            });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    /**
     * Open AOT widget
     * @param {IWidget} widget 
     */
    openAOTWidget(widget: IWidget): void {
        // if widget data is there, then open AOT
        if (widget) {
            this._aotWidgetService.addWidget(widget);
            this._fuseSidebarService.getSidebar('quickPanel').close();
        }
    }
}
