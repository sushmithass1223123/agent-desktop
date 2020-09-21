import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DashboardService } from '@services/dashboard.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { takeUntil } from 'rxjs/operators';
import { IAgentData, SDKClient } from 'tmac-sdk';

@Component({
    selector: 'twc-supervisor',
    templateUrl: './twc-supervisor.component.html',
    styleUrls: ['./twc-supervisor.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcSupervisorComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    agentData: IAgentData;

    staticWidgets = [];
    dynamicWidgets = [];
    aotWidgets = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _dashboardService: DashboardService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to dashboard service
        this._dashboardService.subscribe();

        // get the content widgets
        const supervisorWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = supervisorWidgets.Static || [];
        this.dynamicWidgets = supervisorWidgets.Dynamic || [];
        this.aotWidgets = supervisorWidgets.AOT || [];

        // get the agent data
        this.agentData = SDKClient.getAgentData();

        // check for the profile
        if (this.agentData.agentProfile === 'S') {
            // subscribe to dashboard service
            this._dashboardService.connectionState
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((state: string) => {
                    // check the state
                    if (state === 'connected') {
                        // start getting data
                        this._dashboardService.triggerActiveAgents(this.agentData.agentId, this.agentData.teamId, true, 100);
                    }
                });
        }
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // check for the profile
        if (this.agentData.agentProfile === 'S') {
            // stop getting data
            this._dashboardService.triggerActiveAgents(this.agentData.agentId, this.agentData.teamId, false, 100);
        }

        // unsubscribe to dashboard service
        this._dashboardService.unsubscribe();
    }
}
