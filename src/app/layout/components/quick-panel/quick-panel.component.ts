import { AOTWidget, AppRootConfig } from '@ad/types';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';

/**
 * QuickPanelComponent
 */
@Component({
    selector: 'quick-panel',
    templateUrl: './quick-panel.component.html',
    styleUrls: ['./quick-panel.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: appAnimations
})
export class QuickPanelComponent implements OnInit, OnDestroy {
    /**
     * Subject to unsubscribe
     */
    unsubscribeAll: Subject<any>;
    /**
     * Current date
     */
    date$: Observable<Date>;
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
     * Add widget dialog
     */
    @ViewChild('addWidgetDialog')
    addWidgetDialog: TemplateRef<any>;
    /**
     * Add widget dialog ref
     */
    addWidgetDialogRef: MatDialogRef<any>;
    /**
     * New widget model
     */
    newWidget: {
        /**
         * Page of widget
         */
        page: any;
        /**
         * Widget json
         */
        json: string;
    };

    /**
     * Add widget enabled flag
     */
    addWidgetEnabled: boolean;

    /**
     * Add new widget pages
     */
    addWidgetPages = ['Home', 'Supervisor', 'Voice', 'TextChat', 'Email', 'Generic'];

    /**
     * Constructor
     */
    constructor(
        private _appDataService: AppDataService,
        private _aotWidgetService: AOTWidgetService,
        private _fuseSidebarService: FuseSidebarService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService,
        private _matDialog: MatDialog,
        private translocoService: TranslocoService
    ) {
        // init the subject
        this.unsubscribeAll = new Subject();
        // Set the defaults
        this.date$ = timer(1000, 1000).pipe(map(() => new Date()));
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
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: AppRootConfig) => {
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
                this.addWidgetEnabled = config.AppConfigs.AddAOTWidgetEnabled ?? false;
            }
        });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }

    /**
     * Open AOT widget
     * @param {IWidget} widget
     */
    openAOTWidget(widget: IWidget): void {
        // if widget data is there, then open AOT
        if (widget) {
            this._aotWidgetService.addWidget(widget as AOTWidget);
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
            Main: {
                AOT: {
                    Widgets: [...this.appConfig.Main.AOT.Widgets, widget]
                }
            }
        };
        // hide progress bar
        this._fuseProgressBarService.hide();
        this._appUIService.showSnackbar(this.translocoService.translate('quickPanel.addNewLinkSuccess').replace('#linkName', this.linkName));
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

    /**
     * To add a new widget
     */
    openAddWidget(): void {
        this.newWidget = {
            page: '',
            json: ''
        };
        this.addWidgetDialogRef = this._matDialog.open(this.addWidgetDialog, {
            panelClass: 'shared-dialog',
            maxWidth: '80%',
            width: '500px'
        });

        this.addWidgetDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                const resp = this._aotWidgetService.addNewWidget(this.newWidget.page.toLowerCase(), this.newWidget.json);
                if (resp) {
                    this._fuseSidebarService.getSidebar('quickPanel').close();
                    this._appUIService.showSnackbar(this.translocoService.translate('quickPanel.addWidgetSuccess').replace('#widgetPage', this.newWidget.page));
                } else {
                    this._appUIService.showSnackbar(this.translocoService.translate('quickPanel.addWidgetError'), 'failure');
                }
            }
        });
    }
}
