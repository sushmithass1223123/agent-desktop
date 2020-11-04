import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DashboardService } from '@services/dashboard.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { takeUntil } from 'rxjs/operators';
import { IAgentData, SDKClient } from 'tmac-sdk';

/**
 * Supervisor content widget
 */
@Component({
    selector: 'twc-supervisor',
    templateUrl: './twc-supervisor.component.html',
    styleUrls: ['./twc-supervisor.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcSupervisorComponent extends TWContentWrapper implements OnInit, OnDestroy {
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

        // get the agent data
        this.agentData = SDKClient.getAgentData();

        // subscribe to dashboard service
        this._dashboardService.subscribe();

        // get the content widgets
        const supervisorWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = supervisorWidgets.Static || [];
        this.dynamicWidgets = supervisorWidgets.Dynamic || [];
        this.aotWidgets = supervisorWidgets.AOT || [];

        // check for the profile
        if (this.agentData.agentProfile === 'S') {
            // subscribe to dashboard service
            this._dashboardService.connectionState
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((state: string) => {
                    // check the state
                    if (state === 'connected') {
                        this.registerToService(true);
                    }
                });
        }

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
            this._dashboardService.triggerActiveAgents(this.agentData.agentId, this.agentData.teamId, true, 100);
        }
        else {
            // check for the profile
            if (this.agentData.agentProfile === 'S') {
                // stop getting data
                this._dashboardService.triggerActiveAgents(this.agentData.agentId, this.agentData.teamId, false, 100);
            }
        }
    }

    /**
     * On page active callback
     */
    onActive = () => {
        if (!this.loaded) {
            // if inited only register, else register in init
            if (this.init && this.agentData.agentProfile === 'S') {
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
