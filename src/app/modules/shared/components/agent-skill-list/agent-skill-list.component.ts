import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppUiService } from '@services/app-ui.service';
import { AgentSkillListData } from 'app/interfaces';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentModel, CommandResultEvent, IResponse, SDKClient } from 'tmac-sdk';

/**
 * Agent Skill List Component
 */
@Component({
    selector: 'agent-skill-list',
    templateUrl: './agent-skill-list.component.html',
    styleUrls: ['./agent-skill-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class AgentSkillListComponent implements OnInit, OnDestroy {
    /**
     * Fuse theme config
     */
    fuseConfig: FuseConfig;
    /**
     * To unsubscribe from subscription subject
     */
    unsubscribeAll = new Subject();
    /**
     * Widget title
     */
    title: string;
    /**
     * Widget icon
     */
    icon: string;
    /**
     * Mat table sort
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    /**
     * Close button ref
     */
    @ViewChild('closeBtn')
    private _closeBtn: MatButton;
    /**
     * Label for text field
     */
    mainLabel = 'Agent ID';
    /**
     * Active switcher
     */
    activeSwitcher = '';
    /**
     * Show switcher flag
     */
    showSwitcher: boolean;
    /**
     * Grid list switcher
     */
    switcherList = [
        {
            key: 'agentList',
            label: 'Agent List',
            textLabel: 'Agent ID'
        },
        {
            key: 'skillList',
            label: 'Skill List',
            textLabel: 'Skill'
        }
    ];
    /**
     * Agent list table ref
     */
    agentListTable: {
        /**
         * Current agent list ref
         */
        agentList: any[],
        /**
         * Mat table data 
         */
        tableData: {
            /**
             * Data source 
             */
            source: MatTableDataSource<AgentModel>;
            /**
             * Table columns
             */
            columns: string[];
            /**
             * Selection model
             */
            selection: SelectionModel<AgentModel>;
        };
    };
    /**
     * Skill list table ref
     */
    skillListTable: {
        /**
         * Current skill list ref
         */
        skillList: any[],
        /**
         *  Mat table data 
         */
        tableData: {
            /**
             * Data source 
             */
            source: MatTableDataSource<any>;
            /**
             * Table columns
             */
            columns: string[];
            /**
             * Selection model
             */
            selection: SelectionModel<any>;
        };
    };
    /**
     * Selected item
     */
    selectedItem: string;
    /**
     * Comments ref
     */
    comments: string;
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
     * Open search form flag
     */
    openSearch: boolean;
    /**
     * General loading flag
     */
    loading: boolean;
    /**
     * Show comments flag
     */
    showComments: boolean;
    /**
     * Blind allowed
     */
    blindAllowed: boolean;
    /**
     * Interaction ID
     */
    interactionId: number;
    /**
     * Main action tooltip
     */
    actionTooltip: string;

    /**
     * Constructor 
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AgentSkillListData,
        private _fuseConfigService: FuseConfigService,
        private _appUIService: AppUiService

    ) {
        this.agentListTable = {
            agentList: [],
            tableData: {
                columns: ['FirstName', 'LastName', 'AgentID', 'CurrentAgentStatus'],
                selection: new SelectionModel<any>(false, []),
                source: new MatTableDataSource([])
            }
        };


        this.skillListTable = {
            skillList: [],
            tableData: {
                columns: ['Name', 'VDN', 'ID', 'Stf', 'Avl', 'CIQ'],
                selection: new SelectionModel<any>(false, []),
                source: new MatTableDataSource([])
            }
        };
        this.selectedItem = '';
        this.loading = true;
        this.showComments = false;
        this.comments = '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * OnInit
     */
    ngOnInit(): void {
        this.title = this.data?.title || 'Agent Skill List';
        this.activeSwitcher = this.data?.agent.allowed ? 'agentList' : this.data?.skill.allowed ? 'skillList' : '';
        this.showSwitcher = this.data?.agent.allowed && this.data?.skill.allowed;
        this.interactionId = this.data?.interactionId || 0;

        const type = this.data?.type || '';
        switch (type) {
            case 'makeCall':
                this.icon = 'add_ic_call';
                this.showSwitcher = false;
                this.actionTooltip = 'Call';
                break;
            case 'transferCall':
                this.icon = 'phone_forwarded';
                this.showComments = true;
                this.actionTooltip = 'Consult';
                break;
            case 'conferenceCall':
                this.icon = 'group_add';
                this.actionTooltip = 'Consult';
                break;
            case 'transferChat':
                this.icon = '';
                this.showComments = true;
                this.actionTooltip = 'Consult';
                break;
            case 'conferenceChat':
                this.icon = 'group_add';
                this.showComments = true;
                this.actionTooltip = 'Consult';
                break;
            case 'transferEmail':
                this.icon = 'forward_to_inbox';
                this.actionTooltip = 'Transfer';
                break;
            case 'transferFax':
                this.icon = 'forward';
                this.actionTooltip = 'Transfer';
                break;
            default:
                this.icon = 'list_alt';
                this.actionTooltip = '';
                break;
        }

        // this.channelPrefix = this.data?.Data?.ChannelPrefix || '';
        this.channelPrefix = '';

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
                    this.allSkills = orderBy(response, ['SkillName'], ['asc']);
                }
            });

        // load agent list
        this.loadAgentList(false);
        // check for blind 
        this.checkForBlind();
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * To check blind button is allowed
     */
    checkForBlind(): void {
        if (this.activeSwitcher === 'agentList') {
            this.blindAllowed = this.data?.agent.blind;
        }
        else {
            this.blindAllowed = this.data?.skill.blind;
        }
    }

    /**
     * To make call to a number
     */
    private makeCall(): void {
        this.loading = true;

        SDKClient.makeCall({
            interactionId: this.interactionId.toString(),
            number: this.selectedItem,
            source: '',
            sourceId: ''
        })
            .then((dt: IResponse) => {
                this.loading = false;
                // get the response
                const result: CommandResultEvent = dt.response;
                // check the response
                if (result.ResultCode === 0) {
                    // make call success
                    this._appUIService.showSnackbar(`Make call to ${this.selectedItem} successful`);
                    this.close();
                } else {
                    // make call failed
                    this._appUIService.showSnackbar('Make call failed, please try again', 'failure');
                }
            })
            .catch(() => {
                this.loading = false;
                // make call error
                this._appUIService.showSnackbar('Make call error, please try again', 'failure');
            });
    }

    /**
     * To transfer a call
     * 
     * @param consult
     */
    private transferCall(consult: boolean): void {
        this.loading = true;
        // if consault transfer
        if (consult) {
            SDKClient.transferCall({
                comment: this.comments,
                interactionId: this.interactionId.toString(),
                number: this.selectedItem
            })
                .then((dt: IResponse) => {
                    this.loading = false;
                    // get the response
                    const result: CommandResultEvent = dt.response;
                    // check the response
                    if (result.ResultCode === 0) {
                        // make call success
                        this._appUIService.showSnackbar(`Transfer call to ${this.selectedItem} successful`);
                        this.close();
                    } else {
                        // make call failed
                        this._appUIService.showSnackbar('Transfer call failed, please try again', 'failure');
                    }
                })
                .catch(() => {
                    this.loading = false;
                    // transfer call error
                    this._appUIService.showSnackbar('Transfer call error, please try again', 'failure');
                });
        }
        // if blind transfer
        else {

        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------\

    /**
     * Switch tab
     * 
     * @param item
     * 
     */
    switchTab(item:
        {
            /**
             * Key
             */
            key: string
        }): void {
        // assign active switcher
        this.activeSwitcher = item.key;

        // check the key
        if (item.key === 'agentList') {
            this.mainLabel = 'Agent ID';
        }
        else {
            this.mainLabel = 'Skill/VDN';
        }

        // check for blind 
        this.checkForBlind();
    }

    /**
     * To filter agent list based on selected skill
     * 
     */
    filterAgentList(): void {
        if (this.agentListTable.agentList.length > 0 && this.selectedSkill) {
            let list = this.agentListTable.agentList;
            list = list.filter((d) => d.AgentVoiceSkillsAsString?.includes(this.selectedSkill));
            this.agentListTable.tableData.source.data = list;
        }
    }

    /**
     * To clear all filter
     */
    clearAllFilter(): void {
        // clear skill filter
        this.clearSkillFilter();
        // set the selected item to null
        this.selectedItem = '';
        // select the row in grid
        this.agentListTable.tableData.selection.clear();
    }

    /**
     * To clear skill filter
     */
    clearSkillFilter(): void {
        if (this.agentListTable.agentList.length > 0) {
            this.agentListTable.tableData.source.data = this.agentListTable.agentList;
            this.selectedSkill = null;
        }
    }

    /**
     * To load agent list
     */
    loadAgentList(reload: boolean): void {
        this.loading = true;
        // get agent list
        SDKClient.getAgentListStaffed()
            .then((dt) => {
                this.loading = false;
                // check if data found
                if (dt.response.length > 0) {
                    // filter the same agent and bots from the list
                    dt.response = dt.response.filter((r: AgentModel) => r.LoginID !== SDKClient.getAgentData().agentId &&
                        r.AgentProfile.AccessRole.toLowerCase() !== 'chatbot');
                    this.agentListTable.tableData.source.data = dt.response;
                    this.agentListTable.agentList = dt.response;
                    this.agentListTable.tableData.source.sort = this.sort;

                    // if reload the filter after getting the data
                    if (reload) {
                        this.filterAgentList();
                    }
                }
            })
            .catch(() => {
                this.loading = false;
            });
    }

    /**
     * To process agent selected from list
     */
    selectAgent(row: AgentModel): void {
        // if already loading then return
        if (this.loading) {
            return;
        }
        // clear the selection
        this.selectedItem = '';
        this.agentListTable.tableData.selection.clear();
        this.loading = true;
        const currentStatus = row.CurrentAgentStatus;
        row.CurrentAgentStatus = 'loading';
        // get agent's current status
        SDKClient.getAgentStatus({
            agentId: row.LoginID,
            deviceId: row.StationID,
            tmacServer: row.TmacServer
        })
            .then((dt: IResponse) => {
                this.loading = false;
                // get the allowed state list
                const allowedStates = this.data?.agent.allowedStates || [];
                // change the status
                row.CurrentAgentStatus = dt.response.ResultMessage;
                // get the new state
                const state = dt.response.ResultMessage;
                if (allowedStates.length === 0 || (allowedStates.length > 0 && allowedStates.includes(state))) {
                    // select the row in grid
                    this.agentListTable.tableData.selection.select(row);
                    // assign the selected item
                    this.selectedItem = row.LoginID;
                }
                else {
                    this._appUIService.showSnackbar(`Agent ${row.AgentName} is not in valid state`, 'failure');
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar(`Error in getting agent ${row.AgentName} current state`, 'failure');
                row.CurrentAgentStatus = currentStatus;
                this.loading = false;
            });
    }

    /**
     * To check for number only
     * @param event Input event
     */
    public numberOnly(event: any): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    /**
     * To do action based on type
     * 
     * @param consult
     */
    executeAction(consult: boolean): void {
        const type = this.data?.type || '';
        switch (type) {
            case 'makeCall':
                this.makeCall();
                break;
            case 'transferCall':
                this.transferCall(consult);
                break;
            default:
                this._appUIService.showSnackbar('Error: No action selected to execute', 'failure');
                this.close();
                break;
        }
    }

    /**
     * To close the dialog
     */
    close(): void {
        this._closeBtn._elementRef.nativeElement.click();
    }
}
