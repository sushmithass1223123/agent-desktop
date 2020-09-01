import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { SDKClient, IAgentData } from 'tmac-sdk';

@Component({
    selector: 'tw-su-active-agents',
    templateUrl: './tw-su-active-agents.component.html',
    styleUrls: ['./tw-su-active-agents.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwSuActiveAgentsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;
    @Output() selectActiveAgent = new EventEmitter();

    fuseConfig: any;
    appConfig: any;

    user: IAgentData;
    agentList: any[];
    filteredAgents: any[];
    searchTerm: string;
    selectedAgent: any = null;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(private _fuseConfigService: FuseConfigService, private _appDataService: AppDataService) {
        super();

        this.agentList = [];
        this.filteredAgents = [];
        this.user = SDKClient.getAgentData();
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

        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        this.filteredAgents = [];
        this.getAgentList();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private async getAgentList(): Promise<void> {
        // get all the session list
        const result = await SDKClient.getAgentSessionsList(
            {
                agentId: '',
                interactionId: '',
                supervisorId: '',
                teamId: '',
                tmacServer: ''
            },
            null
        );

        if (!this.filteredAgents.length) {
            // filter for excpet me
            this.agentList = this.filteredAgents = result.response.filter((a: any) => a.AgentLoginID !== this.user.agentId);
        }
        // check any search term is there, then filter
        if (this.searchTerm) {
            this.filterAgents();
        }
        // pull after 5s
        setTimeout(() => {
            this.getAgentList();
        }, 5000);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public filterAgents(): void {
        const searchTerm = this.searchTerm.toLowerCase();
        // Search
        if (searchTerm === '') {
            this.filteredAgents = this.agentList;
        } else {
            this.filteredAgents = this.agentList.filter((agentItem) => {
                return agentItem.AgentName.toLowerCase().includes(searchTerm);
            });
        }
    }

    public selectAgent(agent: any): void {
        if (this.selectedAgent?.AgentLoginID === agent.AgentLoginID) {
            this.selectedAgent = null;
        } else {
            this.selectedAgent = agent;
        }
        this.selectActiveAgent.emit(this.selectedAgent);
    }
}

// for more info visit - https://angular.io/api/core
