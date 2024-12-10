import { TwWorkbenchPanel } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatLegacyTabGroup as MatTabGroup } from '@angular/material/legacy-tabs';
import { SocialMediaPostsService } from '@modules/shared/components/social-media-posts/social-media-posts.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Workbench Panel Component
 */
@Component({
    selector: 'tw-workbench-panel', // make sure you set the selector starts with tw-<widget-name>
    templateUrl: './tw-workbench-panel.component.html',
    styleUrls: ['./tw-workbench-panel.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWorkbenchPanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: TwWorkbenchPanel;
    /**
     * Element ref for workbench tab group
     */
    @ViewChild('workbenchTabGroup') workbenchTabGroup!: MatTabGroup;

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * Channel tabs
     */
    channels: IChannel[] = [];

    /**
     * Constructor
     */
    constructor(private _fuseFacadeService: FuseFacadeService, private _smpService: SocialMediaPostsService) {
        super('TwWorkbenchPanelComponent');
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the channels
        this.channels = this.data.Data.Channels.filter((c) => (typeof c.Enabled === 'boolean' ? c.Enabled : true));

        // subscribe to notification tab switch
        this._smpService.getSwitchTabFromNotification.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
            if(data) this.selectTabByLabel(data);
        })
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Method to select a tab using tab label
     * @param label Group label
     */
    selectTabByLabel(label: string): void {
        const tabs = this.workbenchTabGroup._allTabs.toArray();
        const index = tabs.findIndex((tab) => tab.textLabel === label);
        if (index !== -1) {
            this.workbenchTabGroup.selectedIndex = index;
        } else {
            console.warn(`Tab with label "${label}" not found.`);
        }
    }
}

interface WidgetData {
    /**
     * General section
     */
    General: {
        /**
         * Workbench API url
         */
        WorkbenchUrl: string;
    };
    /**
     * Channels to show
     */
    Channels: IChannel[];
}

interface IChannel {
    /**
     * Channel type
     */
    Type: string;
    /**
     * Enabled flag
     */
    Enabled: boolean;
    /**
     * Channel icon
     */
    Icon: string;
    /**
     * Channel config
     */
    Config: any;
}

// for more info visit - https://angular.io/api/core
