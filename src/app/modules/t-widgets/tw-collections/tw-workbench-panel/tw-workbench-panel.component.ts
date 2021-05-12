import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
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
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * to store the fuse config for theme
     */
    // fuseConfig: FuseConfig;
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
    channels: {
        /**
         * Channel type
         */
        Type: string;
        /**
         * Channel icon
         */
        Icon: string;
        /**
         * Channel config
         */
        Config: any;
    }[] = [];

    /**
     * active class for the tab
     */
    // tabActiveClass = '';

    /**
     * inactive class for the tab
     */
    // tabInactiveClass = '';

    /**
     * Constructor
     */
    constructor(
        // private _fuseConfigService: FuseConfigService
        private _fuseFacadeService: FuseFacadeService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
        //     this.fuseConfig = config;

        //     // set the active tab class
        //     this.tabActiveClass =
        //         this.fuseConfig.layout.anchorWidget.customBackgroundColor === true && this.data.Config.Anchor
        //             ? this.fuseConfig.layout.anchorWidget.bodyBackground
        //             : this.fuseConfig.layout.widget.customBackgroundColor === true
        //                 ? this.fuseConfig.layout.widget.bodyBackground
        //                 : '';

        //     // set the inactive tab class
        //     this.tabInactiveClass =
        //         this.fuseConfig.layout.anchorWidget.customBackgroundColor === true && this.data.Config.Anchor
        //             ? this.fuseConfig.layout.anchorWidget.contentBackground
        //             : this.fuseConfig.layout.widget.customBackgroundColor === true
        //                 ? this.fuseConfig.layout.widget.contentBackground
        //                 : '';
        // });

        // set the channels
        this.channels = this.data.Data.Channels;
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}

// for more info visit - https://angular.io/api/core
