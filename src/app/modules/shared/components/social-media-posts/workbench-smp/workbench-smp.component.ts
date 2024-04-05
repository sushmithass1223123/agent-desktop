import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { IWidget } from 'app/interfaces';
import { TwSmpWorkbenchConfig, TwWorkbenchPanelChannel, TwWorkbenchPanelGeneral } from '@ad/types';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { filter } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { fuseAnimations } from '@fuse/animations';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';

/**
 * Available tabs of the smp workbench
 */
type AvailableTabs = 'inbox' | 'sent' | 'queue' | 'drafts' | 'posts';

/**
 * Global search form controls
 * Global search is the direct search key input present at the top of the posts list
 */
type GlobalSearchFormData = { form: FormControl; data: Partial<Record<AvailableTabs, string>> };

/**
 * Snackbar component
 */
@Component({
    selector: 'workbench-smp',
    templateUrl: './workbench-smp.component.html',
    styleUrls: ['./workbench-smp.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class WorkbenchSmpComponent extends TWidgetWrapper implements OnInit {
    /**
     * holds all the data related to the parent tw workbecnh widget from the config
     */
    @Input() data: IWidget<TwWorkbenchPanelGeneral>;
    /**
     * holds all the data related to this workbench tab
     */
    @Input() channelConf: TwWorkbenchPanelChannel;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(
            filter(() => this.data?.Config?.Anchor)
        ),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };
    /**
     * Flag to hold current tab
     */
    currentTab: string;
    /**
     * List of all available tabs
     */
    availableTabs = [
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.queueLabel'),
            enabled: true,
            icon: 'queue',
            key: 'queue'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.inboxLabel'),
            enabled: true,
            icon: 'inbox',
            key: 'inbox'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.sentLabel'),
            enabled: true,
            icon: 'send',
            key: 'sent'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.draftsLabel'),
            enabled: true,
            icon: 'file_copy',
            key: 'drafts'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.postsLabel'),
            enabled: true,
            icon: 'video_label',
            key: 'posts'
        }
    ];
    /**
     * Flag to hold boolean value of tabs availability
     */
    noTabsAvailable: boolean = false;
    /**
     * Polling Subscription
     */
    polling$: Subscription;
    /**
     * Polling flags
     */
    polling = {
        allowed: false,
        enabled: true,
        failed: false,
        active: false
    };
    /**
     * Global search form control and cached data for each category
     */
    globalSearch: GlobalSearchFormData = {
        form: new FormControl(''),
        data: {}
    };

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService
    ) {
        super('WorkbenchSmpComponent');
    }

    ngOnInit(): void {
        this.validateAvailabletabsFromConfiguration();
    }

    /**
     * Method to validate availbale tabs from the configurations
     */
    validateAvailabletabsFromConfiguration(): void {
        try {
            // Modify enabled flag according to configurations received
            const allowedTabs =
                (this.channelConf.Config as TwSmpWorkbenchConfig)?.Tabs?.map((m: string) =>
                    m.toLowerCase()
                ) ?? [];
            if (allowedTabs.length) {
                this.availableTabs.forEach((f) => {
                    f.enabled = allowedTabs.includes(f.label.toLowerCase());
                    if (f.enabled) {
                        this.noTabsAvailable = false;
                    }
                });
            } else {
                this.noTabsAvailable = false;
            }

            // By default make the first available tab selected
            if (!this.noTabsAvailable)
                this.currentTab =
                    this.availableTabs[this.availableTabs.findIndex((f) => f.enabled)].key;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to handle tab switching from user
     * @param tabName Name of the tab that user tends to switch
     */
    switchTab(tabName: string): void {
        try {
            this.currentTab = tabName;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to handle data refreshing
     */
    doSmpDataRefresh(): void {
        try {
        } catch (error) {
            console.error(error);
        }
    }
}
