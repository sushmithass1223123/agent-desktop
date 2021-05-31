import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AOTWidgetService } from '@services/aot-widget.service';
import { DashboardService } from '@services/dashboard.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { IAgentData, SDKClient } from '@tmac/sdk';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from 'app/services/content-page.service';
import { differenceInHours, startOfDay } from 'date-fns';
import { takeUntil } from 'rxjs/operators';

/**
 * TwcHomeComponent
 */
@Component({
    selector: 'twc-home',
    templateUrl: './twc-home.component.html',
    styleUrls: ['./twc-home.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: appAnimations
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
     * Data data span drag flag
     */
    dashboardDataSpanOverlayDrag = false;
    /**
     * dashboard data span display flag
     */
    showDashboardDataSpanOverlay = false;
    /**
     * Dashboard data loading flag
     */
    dataLoading: boolean;
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
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$,
        widget$: this._fuseFacadeService.widgetBgClasses$
    };
    /**
     * Max date for dashboard data
     */
    maxDate: Date;
    /**
     * Data filter duration
     */
    duration: number;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _dashboardService: DashboardService,
        private _fuseFacadeService: FuseFacadeService,
        private _aotWidgetService: AOTWidgetService
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.duration = this.data.Data.Duration || 100;

        this.maxDate = new Date();
        this.maxDate.setDate(this.maxDate.getDate());

        // subscribe to dashboard service
        this._dashboardService.subscribe();

        // get the agent data
        this.agentData = SDKClient.getAgentData();

        // get the home content widgets
        const homeWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = homeWidgets.Static || [];
        this.dynamicWidgets = homeWidgets.Dynamic || [];
        this.aotWidgets = homeWidgets.AOT || [];

        // process aot widgets
        this._aotWidgetService.processAOTWidgets(this.aotWidgets);

        // subscribe to dashboard service
        this._dashboardService
            .connectionState
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((state: string) => {
                // check the state
                if (state === 'connected' && this.loaded) {
                    // register to service
                    this.registerToService(true);
                }
            });

        this._dashboardService.
            dataReceived
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((state: string) => {
                // check the state
                if (state === 'agent-received') {
                    this.dataLoading = false;
                }
            });

        const initialDate = new Date();
        initialDate.setDate(initialDate.getDate() - Math.round(this.duration / 24));

        this.dashboardDataFromDate = {
            calculatedSpan: 100,
            formControl: new FormControl(initialDate)
        };

        this.dashboardDataFromDate.formControl.valueChanges.subscribe((date: Date) => {
            let deltaTime: number;
            // check if the date is today, the take from start of the day
            if (date.getDate() === new Date().getDate()) {
                deltaTime = differenceInHours(new Date(), startOfDay(Date.now()));
            }
            else {
                deltaTime = differenceInHours(new Date(), date);
            }
            this.duration = deltaTime;
            this.registerToService(true);
            this.showDashboardDataSpanOverlay = false;
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
            this.dataLoading = true;
            // if there is no data, stop data loading
            setTimeout(() => {
                if (this.dataLoading) {
                    this.dataLoading = false;
                }
            }, 10000);
            // start getting data
            this._dashboardService.triggerAgentData(this.agentData.agentId, true, this.duration);
        } else {
            // stop getting data
            this._dashboardService.triggerAgentData(this.agentData.agentId, false, 0);
        }
    }

    /**
     * On click of date range selection for dashboard
     */
    showDashboardDataOverlay(): void {
        if (this.dashboardDataSpanOverlayDrag) {
            this.dashboardDataSpanOverlayDrag = false;
            return;
        }
        this.showDashboardDataSpanOverlay = !this.showDashboardDataSpanOverlay;
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
