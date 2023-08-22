import { Component, Input, OnDestroy, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatListOption } from '@angular/material/list';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { SDKClient } from '@tmac/sdk';
import { InteractionRef, IWidget } from 'app/interfaces/';
import { AppDataService } from 'app/services/app-data.service';
import { ContentPageService } from 'app/services/content-page.service';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AOTWidgetService } from '@services/aot-widget.service';

/**
 * Navbar component
 */
@Component({
    selector: 'navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit, OnDestroy {
    /**
     * App config data
     */
    @Input()
    /**
     * Layout orientation
     */
    layout = 'vertical';

    /**
     * Sidebar list options ref
     */
    @ViewChildren('sidebarListOption') sidebarListOptions: QueryList<MatListOption>;

    /**
     * Fuse custom config
     */
    customFuse$ = this._fuseFacadeService.getConfig({ layoutNavbar: 'layout.navbar' }).pipe(
        map((conf: any) => {
            if (!conf.layoutNavbar.customBackgroundColor) {
                return { background: '' };
            }
            return { background: conf.layoutNavbar.background };
        })
    );

    /**
     * Widgets on top section of widgets
     */
    topWidgets: any[];
    /**
     * Widgets on bottom section of widgets
     */
    bottomWidgets: any[];
    /**
     * Selected Widget
     */
    selected: any;
    /**
     * Brand / tetherfi Logo
     */
    brandLogo = null;
    /**
     * Customer logo
     */
    customerLogo = null;
    /**
     * Opened widget IDs 
     */
    widgetIDs: any[];

    /**
     * Unsubscribe All subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     * @param {FuseFacadeService} _fuseFacadeService
     * @param {AppDataService} _appDataService
     * @param {ContentPageService} _contentPageService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {InteractionManagerService} _interactionManagerService
     */
    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private _appDataService: AppDataService,
        private _contentPageService: ContentPageService,
        private _fuseSidebarService: FuseSidebarService,
        private _interactionManagerService: InteractionManagerService,
        private _aotWidgetService: AOTWidgetService,
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
        // Subscribe to config changes
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            // check if the config is not null
            if (config !== null) {
                // get the sidebar widgets
                const sidebarWidgets = config.Main.Navbar.Widgets || {};
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
                    item.Data.Count = 0;
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
        });

        this._contentPageService.mode.pipe(takeUntil(this._unsubscribeAll)).subscribe((viewMode: string) => {
            this.sidebarListOptions?.forEach((option: MatListOption) => {
                if (option.value === viewMode && !option.selected) {
                    option.selected = true;
                }
            });
        });

        this._interactionManagerService.interactions.pipe(takeUntil(this._unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            this.topWidgets.forEach((item) => {
                // set the count to 0
                item.Data.Count = 0;
                if (interactions.length > 0) {
                    // match the path and add the count
                    const interaction = interactions.filter((i: InteractionRef) => i.path === item.Data.Path);
                    if (interaction.length > 0) {
                        item.Data.Count = interaction.length;
                    }
                }
            });
        });

        // Subscribe to get the IDs of opened widgets 
        this._aotWidgetService.widgets.subscribe((widgets) => {
            this.widgetIDs = widgets.map((widget) => widget.ID);
            console.log("Opened widget IDs:", this.widgetIDs)
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Select Tab
     * @method selectTab
     * @param {any} item
     */
    selectTab(item: any): void {
        //Destroy supervisor interaction details widget when switching between the tabs.
        if (item.Name.toLowerCase() != 'supervisor') {
            this.destroySupervisorInteractionWidget();
        }
        this._contentPageService.mode = item.Data.Path;
    }

    /**
     * Toggle Sidebar Open
     * @method toggleSidebarOpen
     * @param {string} key
     */
    toggleSidebarOpen(key: string): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }

    /**
     * To destroy the supervisor interaction details widget
     */
    destroySupervisorInteractionWidget() {
        const supervisorInteractionWidgetID = this.widgetIDs?.find((widgetID) => widgetID.includes('tw-su-agent-interactions'));
        if(supervisorInteractionWidgetID){
            this._aotWidgetService.destroyWidget(supervisorInteractionWidgetID);
        }
    }

    // /**
    //  * To filter widgets based on the accessibility
    //  */
    // getNavWidgets(widgets) {
    //     let filteredWidgets = widgets;
    //     try {
    //         // check if supervisor access available
    //         if (widgets) {
    //             const sIndex = widgets.findIndex((w) => w.Type === 'twn-supervisor');

    //             if (sIndex > -1 && SDKClient.getAgentData().agentProfile.toLowerCase() !== 's') {
    //                 filteredWidgets.splice(sIndex, 1);
    //             }
    //         }
    //     } catch (e) {
    //         console.log('Error occured on filtering navbar widgets', e);
    //     }
    //     return filteredWidgets;
    // }
}
