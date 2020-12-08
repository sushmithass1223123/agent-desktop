import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { DashboardService } from '@services/dashboard.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from 'app/services/content-page.service';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
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

    /**
     * dashboard data span display flag
     */
    showDashboardDataSpanOverlay = false;

    /**
     * dashboard data from date
     */
    dashboardDataFromDate: {
        /**
         * Form control for date
         */
        formControl: FormControl;
        /**
         * Dashboard data duration span
         */
        calculatedSpan: number;
    };

    /**
     * fuse background
     */
    fuseBg: Observable<{
        /**
         * fuse background for content
         */
        content: string;
        /**
         * fuse background for body
         */
        body: string;
    }>;

    maxDate: Date;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _dashboardService: DashboardService,
        private fuseConfService: FuseConfigService
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.maxDate = new Date();
        this.maxDate.setDate(this.maxDate.getDate() - 1);

        this.fuseBg = this.fuseConfService.config.pipe(
            takeUntil(this.unsubscribeAll),
            filter((config: FuseConfig) => config.layout.anchorWidget.customBackgroundColor),
            map((config: FuseConfig) => ({ content: config.layout.widget.contentBackground, body: config.layout.widget.bodyBackground }))
        );

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
        this._dashboardService.connectionState.pipe(takeUntil(this.unsubscribeAll)).subscribe((state: string) => {
            // check the state
            if (state === 'connected') {
                // register to service
                this.registerToService(true);
            }
        });

        // set init flag to true
        this.init = true;

        const initialDate = new Date();
        initialDate.setDate(initialDate.getDate() - 100);

        this.dashboardDataFromDate = {
            calculatedSpan: 100,
            formControl: new FormControl(initialDate)
        };

        this.dashboardDataFromDate.formControl.valueChanges.subscribe((date: Date) => {
            // this.registerToService(false);
            const deltaTime = Math.ceil((Date.now() - date.getTime()) / (1000 * 60 * 60));
            this.registerToService(true, deltaTime);
            this.showDashboardDataSpanOverlay = false;
        });
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
    registerToService(register: boolean, duration = 100): void {
        if (register) {
            // start getting data
            this._dashboardService.triggerAgentData(this.agentData.agentId, true, duration);
        } else {
            // stop getting data
            this._dashboardService.triggerAgentData(this.agentData.agentId, false, duration);
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
    };

    /**
     * On page inactive callback
     */
    onInactive = () => {
        if (this.loaded && this.pageActive) {
            this.loaded = false;
            this.registerToService(false);
        }
    };
}
