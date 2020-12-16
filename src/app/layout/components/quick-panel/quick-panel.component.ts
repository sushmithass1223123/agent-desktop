import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { widgetFabAnimations } from '@modules/shared/animations/widget-fab.animation';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * QuickPanelComponent
 */
@Component({
    selector: 'quick-panel',
    templateUrl: './quick-panel.component.html',
    styleUrls: ['./quick-panel.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: widgetFabAnimations
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
     * App config ref
     */
    appConfig: any;
    /**
     * To open/close add new link panel
     */
    openAddLink: boolean;
    /**
     * New link name
     */
    linkName: string;
    /**
     * New link to add
     */
    newLink: string;

    /**
     * Constructor
     */
    constructor(
        private _appDataService: AppDataService,
        private _aotWidgetService: AOTWidgetService,
        private _fuseSidebarService: FuseSidebarService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService
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
                    // get app config
                    this.appConfig = config;
                    // get pinned AOTs
                    this.pinnedAOTs = config.Main.AOT.Widgets?.filter((w: IWidget) => w.Config.Pinned === true);
                    // set notification settings
                    this.settings = {
                        desktopAlert: config.AppConfigs.Notifications.DesktopAlerts,
                        sounds: config.AppConfigs.Notifications.Sounds
                    };
                    this._appUIService.setNotificationSettings(this.settings);
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

    /**
     * To add new link
     */
    addNewLink(): void {
        // show progress bar
        this._fuseProgressBarService.show();

        // create a widget
        const widget = new TwWidgetModel(this.linkName, 'tw-custom', 'link');
        widget.Config.Pinned = true;
        widget.Config.AOT = true;
        widget.Data.AutoOpen = false;
        widget.Data.OpenInNew = true;
        widget.Data.Url = this.newLink;

        // add to the config
        this._appDataService.config = {
            ...this.appConfig,
            'Main': {
                'AOT': {
                    'Widgets': [
                        ...this.appConfig.Main.AOT.Widgets,
                        widget
                    ]
                }
            }
        };
        // hide progress bar
        this._fuseProgressBarService.hide();
        this._appUIService.showSnackbar(`New link '${this.linkName}' added successfully`);
        this.linkName = '';
        this.newLink = '';
        this.openAddLink = false;
    }

    /**
     * To update settting
     * 
     * @param {String} type 
     * @param {Boolean} checked 
     */
    updateSettings(type: string, checked: boolean): void {
        // set notification settings
        this.settings[type] = checked;
        this._appUIService.setNotificationSettings(this.settings);
    }
}
