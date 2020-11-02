import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DashboardService } from '@services/dashboard.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { takeUntil } from 'rxjs/operators';
import { IAgentData, SDKClient } from 'tmac-sdk';

/**
 * TwcHomeComponent
 */
@Component({
    selector: 'twc-home',
    templateUrl: './twc-home.component.html',
    styleUrls: ['./twc-home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcHomeComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * To hold agent data
     */
    agentData: IAgentData;
    /**
     * To hold static widgets
     */
    staticWidgets = [];
    /**
     * To hold dynamic widgets
     */
    dynamicWidgets = [];
    /**
     * To hold AOT widgets
     */
    aotWidgets = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _dashboardService: DashboardService
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to dashboard service
        this._dashboardService.subscribe();

        // get the home content widgets
        const homeWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = homeWidgets.Static || [];
        this.dynamicWidgets = homeWidgets.Dynamic || [];
        this.aotWidgets = homeWidgets.AOT || [];

        // get the agent data
        this.agentData = SDKClient.getAgentData();

        // subscribe to dashboard service
        this._dashboardService.connectionState
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((state: string) => {
                // check the state
                if (state === 'connected') {
                    // start getting data
                    this._dashboardService.triggerAgentData(this.agentData.agentId, true, 100);
                }
            });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // stop getting data
        this._dashboardService.triggerAgentData(this.agentData.agentId, false, 100);

        // unsubscribe to dashboard service
        this._dashboardService.unsubscribe();
    }
}
