import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DashboardService } from '@services/dashboard.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
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
    /**
     * Loaded flag
     */
    loaded: boolean;
    /**
     * Init flag
     */
    init: boolean;

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

        // get the agent data
        this.agentData = SDKClient.getAgentData();

        // get the home content widgets
        const homeWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = homeWidgets.Static || [];
        this.dynamicWidgets = homeWidgets.Dynamic || [];
        this.aotWidgets = homeWidgets.AOT || [];

        // subscribe to dashboard service
        this._dashboardService.connectionState
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((state: string) => {
                // check the state
                if (state === 'connected') {
                    // register to service
                    this.registerToService(true);
                }
            });

        // set init flag to true
        this.init = true;
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // de-register from service
        this.registerToService(false);

        // unsubscribe to dashboard service
        this._dashboardService.unsubscribe();
    }

    /**
     * To register and de-regsiter from service
     * 
     * @param register 
     */
    registerToService(register: boolean): void {
        if (register) {
            // start getting data
            this._dashboardService.triggerAgentData(this.agentData.agentId, true, 100);
        }
        else {
            // stop getting data
            this._dashboardService.triggerAgentData(this.agentData.agentId, false, 100);
        }
    }

    /**
     * On page active callback
     */
    onActive = () => {
        if (!this.loaded) {
            // if inited only register, else register in init
            if (this.init) {
                // register to service
                this.registerToService(true);
            }
            this.loaded = true;
        }
    }

    /**
     * On page inactive callback
     */
    onInactive = () => {
        if (this.loaded && this.pageActive) {
            this.loaded = false;
            this.registerToService(false);
        }
    }
}
