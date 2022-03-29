import { TwWorkbenchPanel } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { filter } from 'rxjs/operators';

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
    constructor(private _fuseFacadeService: FuseFacadeService) {
        super();
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the channels
        this.channels = this.data.Data.Channels.filter((c) => (typeof c.Enabled === 'boolean' ? c.Enabled : true));
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
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
