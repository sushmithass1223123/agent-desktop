import { AOTWidget, Widget } from '@ad/types';
import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AOTWidgetService } from '@services/aot-widget.service';
import { DashboardService } from '@services/dashboard.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { IAgentData, SDKClient, TUtils } from '@tmac/sdk';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { differenceInHours, startOfDay } from 'date-fns';
import { takeUntil } from 'rxjs/operators';

/**
 * Supervisor content widget
 */
@Component({
    selector: 'twc-supervisor',
    templateUrl: './twc-supervisor.component.html',
    styleUrls: ['./twc-supervisor.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: appAnimations
})
export class TwcSupervisorComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * To hold agent data
     */
    agentData: IAgentData;
    /**
     * To hold static widgets
     */
    staticWidgets: Widget[] = [];
    /**
     * To hold dynamic widgets
     */
    dynamicWidgets: Widget[] = [];
    /**
     * To hold AOT widgets
     */
    aotWidgets: AOTWidget[] = [];
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
     * Min date for dashboard data
     */
    minDate: Date;
    /**
     * Data filter duration
     */
    duration: number;
    /**
     * Widget data
     */
    widgetDataConfig: WidgetData;

    constructor(
        public hostElement: ElementRef,
        public _contentPageService: ContentPageService,
        private _dashboardService: DashboardService,
        private _fuseFacadeService: FuseFacadeService,
        private _aotWidgetService: AOTWidgetService
    ) {
        super('TwcSupervisorComponent', hostElement, _contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.widgetDataConfig = this.data.Data;

        this.duration = this.widgetDataConfig.Duration ?? 100;

        this.maxDate = new Date();
        this.maxDate.setDate(this.maxDate.getDate());

        this.minDate = new Date();
        this.minDate.setDate(this.minDate.getDate() - 90);

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
            } else {
                deltaTime = differenceInHours(new Date(), date);
            }
            this.duration = deltaTime;
            this.registerToService(true);
            this.showDashboardDataSpanOverlay = false;
        });

        // get the agent data
        this.agentData = SDKClient.getAgentData();

        // subscribe to dashboard service
        this._dashboardService.subscribe();

        // get the content widgets
        const supervisorWidgets = this.widgetDataConfig.Widgets;

        this.staticWidgets = supervisorWidgets?.Static?.filter((w: IWidget) => w.Config.Enabled) ?? [];
        this.dynamicWidgets = supervisorWidgets?.Dynamic?.filter((w: IWidget) => w.Config.Enabled) ?? [];
        this.aotWidgets = supervisorWidgets?.AOT?.filter((w: IWidget) => w.Config.Enabled) ?? [];
        this.aotWidgets = this.aotWidgets.map((w) => {
            if (!w.ID) {
                w.ID = TUtils.Generic.uuid();
            }
            return w;
        });

        // process aot widgets
        this._aotWidgetService.processAOTWidgets(this.aotWidgets);

        this._aotWidgetService.newWidget('supervisor').subscribe((x) => {
            this.aotWidgets.push(x.json);
            if (x.json.Config?.AutoOpen) {
                this._aotWidgetService.addWidget(x.json);
            }
        });

        // subscribe to dashboard service
        this._dashboardService.connectionState.pipe(takeUntil(this.unsubscribeAll)).subscribe((state: string) => {
            // check the state
            if (state === 'connected' && this.loaded) {
                this.registerToService(true);
            }
        });

        this._dashboardService.dataReceived.pipe(takeUntil(this.unsubscribeAll)).subscribe((state: string) => {
            // check the state
            if (state === 'supervisor-received') {
                this.dataLoading = false;
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
        // process only for supervisor agent
        if (this.agentData.agentProfile !== 'S') {
            return;
        }

        // get hierarchy
        const hierarchy = this.widgetDataConfig.AgentHierarchy ?? false;

        if (register) {
            this.dataLoading = true;
            // if there is no data, stop data loading
            setTimeout(() => {
                if (this.dataLoading) {
                    this.dataLoading = false;
                }
            }, 10000);

            // start getting data
            this._dashboardService.triggerActiveAgents(this.agentData.agentId, this.agentData.teamId, true, hierarchy, this.duration);
        } else {
            // stop getting data
            this._dashboardService.triggerActiveAgents(this.agentData.agentId, this.agentData.teamId, false, hierarchy, 0);
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
    };

    /**
     * On page inactive callback
     */
    onInactive = (preservePageContent?: boolean | undefined) => {
        if (this.loaded && this.pageActive) {
            if(!preservePageContent) this.loaded = false;
            this.registerToService(false);
        }
    };
}

interface WidgetData {
    /**
     * Widget list
     */
    Widgets: {
        /**
         * Static widget
         */
        Static: IWidget[];
        /**
         * Dynamic widget
         */
        Dynamic: IWidget[];
        /**
         * AOT widgets
         */
        AOT: IWidget[];
        /**
         * Agent widgets
         */
        Agent: IWidget[];
    };
    /**
     * Dashboard data duration
     */
    Duration: number;
    /**
     * Min date for dashboard filter
     */
    DataForDays: number;
    /**
     * Agent hierarchy filter flag
     */
    AgentHierarchy: boolean;
}
