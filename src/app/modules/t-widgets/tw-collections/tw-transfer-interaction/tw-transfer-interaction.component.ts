import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import * as _ from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-transfer-interaction',
    templateUrl: './tw-transfer-interaction.component.html',
    styleUrls: ['./tw-transfer-interaction.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwTransferInteractionComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    @ViewChild(MatSort, { static: true }) sort: MatSort;

    fuseConfig: FuseConfig;

    mainLabel = 'Agent ID';
    switcherList = [
        {
            key: 'agentList',
            label: 'Agent List',
            textLabel: 'Agent ID'
        },
        // {
        //     key: 'skillList',
        //     label: 'Skill List',
        //     textLabel: 'Skill'
        // }
    ];
    activeSwitcher = 'agentList';
    searchTerm = '';
    agentListTable = {
        source: new MatTableDataSource([]),
        agentList: [],
        loading: true,
        columns: ['FirstName', 'LastName', 'AgentID', 'CurrentAgentStatus']
    };

    skillListTable = {
        source: new MatTableDataSource([]),
        columns: ['Name', 'VDN', 'ID', 'Stf', 'Avl', 'CIQ']
    };
    /**
     * Skill list to filter agent list based on skill
     */
    allSkills: any;
    /**
     * Selected skill for agent list filter
     */
    selectedSkill: any;
    /**
     * Channel to transfer/conference
     */
    channelPrefix: string;
    /**
     * Search form
     */
    advancedSearchForm = new FormGroup({
        email: new FormControl(''),
        queue: new FormControl(''),
        fromDate: new FormControl(''),
        fromTime: new FormControl(''),
        toDate: new FormControl(''),
        toTime: new FormControl(''),
        subject: new FormControl(''),
        content: new FormControl('')
    });
    /**
     * Open search form flag
     */
    openSearch: boolean;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        private _fuseConfigService: FuseConfigService
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

        this.channelPrefix = this.data.Data?.ChannelPrefix || '';

        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.fuseConfig = config;
                }
            );

        // get wallboard skills
        SDKClient.getTmacWallboardSkills()
            .then((dt) => {
                let response: any[] = dt.response;
                if (response.length > 0) {
                    // filter the skill for the channel
                    if (this.channelPrefix) {
                        response = response.filter(r => r.SkillName.startsWith(this.channelPrefix));
                    }
                    // assign all the skills
                    this.allSkills = _.orderBy(response, ['SkillName'], ['asc']);
                }
            });

        // load agent list
        this.loadAgentList(false);
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

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public switchTab(item: { key: string }): void {
        this.activeSwitcher = item.key;
    }

    /**
     * To filter agent list based on selected skill
     * 
     */
    public filterAgentList(): void {
        if (this.agentListTable.agentList.length > 0 && this.selectedSkill) {
            let list = this.agentListTable.agentList;
            list = list.filter((d) => d.AgentVoiceSkillsAsString?.includes(this.selectedSkill));
            this.agentListTable.source.data = list;
        }
    }

    /**
     * To clear skill filter
     */
    public clearAgentListFilter(): void {
        if (this.agentListTable.agentList.length > 0) {
            this.agentListTable.source.data = this.agentListTable.agentList;
            this.selectedSkill = null;
        }
    }

    /**
     * To load agent list
     */
    public loadAgentList(reload: boolean): void {
        this.agentListTable.loading = true;
        // get agent list
        SDKClient.getAgentListStaffed()
            .then((dt) => {
                this.agentListTable.loading = false;
                // check if data found
                if (dt.response.length > 0) {
                    // filter the same agent and bots from the list
                    dt.response = dt.response.filter((r: any) => r.LoginID !== SDKClient.getAgentData().agentId &&
                        r.AgentProfile.AccessRole.toLowerCase() !== 'chatbot');
                    this.agentListTable.source.data = dt.response;
                    this.agentListTable.agentList = dt.response;
                    this.agentListTable.source.sort = this.sort;

                    // if reload the filter after getting the data
                    if (reload) {
                        this.filterAgentList();
                    }
                }
            })
            .catch(() => {
                this.agentListTable.loading = false;
            });
    }
}

// for more info visit - https://angular.io/api/core
