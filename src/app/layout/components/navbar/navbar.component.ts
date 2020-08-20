import { Component, ViewEncapsulation, OnInit, OnDestroy, Input, ViewChildren, QueryList } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AppDataService } from 'app/services/app-data.service';
import { ContentPageService } from 'app/services/content-page.service';
import { IWidget } from 'app/interfaces/';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { MatListOption } from '@angular/material/list';

@Component({
    selector: 'navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit, OnDestroy {
    @Input()
    layout = 'vertical';

    @ViewChildren('sidebarListOption') sidebarListOptions: QueryList<MatListOption>;

    fuseConfig: any;

    topWidgets: any[];
    bottomWidgets: any[];
    selected: any;
    brandLogo = null;
    customerLogo = null;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService 
     * @param {AppDataService} _appDataService 
     * @param {ContentPageService} _contentPageService 
     * @param {FuseSidebarService} _fuseSidebarService 
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _appDataService: AppDataService,
        private _contentPageService: ContentPageService,
        private _fuseSidebarService: FuseSidebarService
    ) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        // Subscribe to the config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((fuseConfig: any) => {
                this.fuseConfig = fuseConfig;
            });

        // Subscribe to config changes
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (config: any) => {
                    // check if the config is not null
                    if (config !== null) {
                        // get the sidebar widgets
                        const sidebarWidgets = config.Main.Sidebar.Widgets || {};
                        // assign the brand logo
                        this.brandLogo = config.AppConfigs.Logos.Default || null;
                        // assign the customer logo
                        this.customerLogo = config.AppConfigs.Logos.Customer || null;
                        // get the top widgets
                        this.topWidgets = sidebarWidgets.Top || [];
                        // get the bottom widgets
                        this.bottomWidgets = sidebarWidgets.Bottom || [];

                        // set a flag to check if selected
                        let selected = false;

                        // check if any item is set to active
                        this.topWidgets.forEach((item: IWidget) => {
                            if (item.Data.Active === true) {
                                this.selectTab(item);
                                selected = true;
                                return;
                            }
                        });

                        // if top is not selected, check for bottom items
                        if (!selected) {
                            this.bottomWidgets.forEach((item: IWidget) => {
                                if (item.Data.Active === true) {
                                    this.selectTab(item);
                                    return;
                                }
                            });
                        }
                    }
                }
            );

        this._contentPageService.mode
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((viewMode: string) => {
                this.sidebarListOptions?.forEach((option: MatListOption) => {
                    if (option.value === viewMode && !option.selected) {
                        option.selected = true;
                    }
                });
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    selectTab(item: any): void {
        this._contentPageService.mode = item.Data.Path;
    }

    toggleSidebarOpen(key: string): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
