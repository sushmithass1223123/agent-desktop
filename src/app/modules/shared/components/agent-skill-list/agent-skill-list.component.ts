import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import setStringVars from '@tmac/operators/setStringVars';
import { AgentModel, CommandResultEvent, FavouriteSkill, IResponse, IResponseData, QueueStatusEvent, SDKClient } from '@tmac/sdk';
import { AgentSkillListData, AgentSkillListSourceObject } from 'app/interfaces';
import { formatJsonData } from 'app/utils';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SharedWrapperComponent } from '../shared-wrapper/shared-wrapper.component';

type AgentType = Partial<AgentModel>;
type SkillType = Partial<FavouriteSkill>;
type FreeTextConf = {
    /**
     * ALlowed flag
     */
    allowed: boolean;
    /**
     * Enabled flag
     */
    enabled: boolean;
    /**
     * Value of freetext
     */
    value: string;
};
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
    // fuseConfig: FuseConfig;
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
     * Label for text field
     */
    mainLabel = 'Agent ID/Station';
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
            textLabel: 'Agent ID/Station'
        },
        {
            key: 'skillList',
            label: 'Skill List',
            textLabel: 'Skill/VDN'
        }
    ];
    /**
     * Agent list table ref
     */
    agentListTable: {
        /**
         * Current agent list ref
         */
        agentList: AgentType[];
        /**
         * Mat table data
         */
        tableData: {
            /**
             * Data source
             */
            source: MatTableDataSource<AgentType>;
            /**
             * Table columns
             */
            columns: string[];
            /**
             * Selection model
             */
            selection: SelectionModel<AgentType>;
        };
    };
    /**
     * Skill list table ref
     */
    skillListTable: {
        /**
         * List of all favourite skills
         */
        skillList: SkillType[];
        /**
         *  Mat table data
         */
        tableData: {
            /**
             * Data source
             */
            source: MatTableDataSource<SkillType>;
            /**
             * Table columns
             */
            columns: string[];
            /**
             * Selection model
             */
            selection: SelectionModel<SkillType>;
        };
    };
    /**
     * Dynamic list table ref
     */
    dynamicListTable: {
        /**
         * Flag to check dynamic table is enabled
         */
        enabled: boolean;
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
     * Selected items's display Name
     */
    selectedItemDisplayName = '';
    /**
     * Selected mat table row
     */
    selectedRow: {
        /**
         * Type of table
         */
        type: string;
        /**
         * Selected row
         */
        row: any;
    };
    /**
     * Comments ref
     */
    comments: string;
    /**
     * Skill list to filter agent list based on skill
     */
    allSkills: any[];
    /**
     * Selected skill for agent list filter
     */
    selectedSkill: any;
    /**
     * Open search form flag
     */
    openSearch: boolean;
    /**
     * General loading flag
     */
    loading: boolean;
    /**
     * Comments allowed flag
     */
    commentsAllowed: boolean;
    /**
     * Consult allowed
     */
    consultAllowed: boolean;
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
     * Disable input flag
     */
    disableInput: boolean;
    /**
     * Consult flag
     */
    isConsult: boolean;

    /**
     * Fuse custom background colors
     */
    customFuse$ = this.fuseFacadeService.anchorOrWidgetBgClasses$;

    /**
     * Search Key for agent / skill list
     */
    searchKey = new FormControl('');

    /**
     * Wrapper component Ref
     */
    @ViewChild(SharedWrapperComponent) wrapperComponent: SharedWrapperComponent;

    /**
     * Free text agent Key
     */
    freeTextConf: Record<string, FreeTextConf>;

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AgentSkillListData,
        // private _fuseConfigService: FuseConfigService,
        private fuseFacadeService: FuseFacadeService,
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

        this.dynamicListTable = {
            enabled: false,
            tableData: {
                columns: [],
                selection: null,
                source: null
            }
        };

        this.selectedItem = '';
        this.loading = true;
        this.commentsAllowed = false;
        this.comments = '';

        // check if dynamic list is there, then add it
        if (data?.otherData?.dynamicList) {
            this.switcherList.push(data.otherData.dynamicList);
            this.dynamicListTable = {
                enabled: true,
                tableData: {
                    columns: data.otherData.dynamicList.columns,
                    selection: new SelectionModel<any>(false, []),
                    source: new MatTableDataSource(data.otherData.dynamicList.data)
                }
            };
        }
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
        this.interactionId = this.data?.interactionId ?? 0;

        this.freeTextConf = {
            agentList: { allowed: !!(this.data?.agent.source as AgentSkillListSourceObject)?.FreeTextAllowed, enabled: false, value: '' },
            skillList: { allowed: !!(this.data?.skill.source as AgentSkillListSourceObject)?.FreeTextAllowed, enabled: false, value: '' },
            dynamicList: { allowed: false, enabled: false, value: '' }
        };

        this.setupSearchInputListener();
        const type = this.data?.type || '';

        switch (type) {
            case 'makeCall':
                this.icon = 'add_ic_call';
                this.actionTooltip = 'Call';
                break;
            case 'transferCall':
                this.icon = 'phone_forwarded';
                this.actionTooltip = 'Consult';
                break;
            case 'conferenceCall':
                this.icon = 'group_add';
                this.actionTooltip = 'Consult';
                break;
            case 'transferChat':
                this.disableInput = true;
                this.icon = 'forward';
                this.actionTooltip = 'Consult';
                break;
            case 'pushChat':
                this.disableInput = true;
                this.icon = 'forward';
                this.actionTooltip = 'Push';
                break;
            case 'conferenceChat':
                this.disableInput = true;
                this.icon = 'group_add';
                this.actionTooltip = 'Consult';
                break;
            case 'transferEmail':
                this.disableInput = true;
                this.icon = 'forward_to_inbox';
                this.actionTooltip = 'Transfer';
                break;
            case 'transferFax':
                this.disableInput = true;
                this.icon = 'forward';
                this.actionTooltip = 'Transfer';
                break;
            default:
                this.icon = 'list_alt';
                this.actionTooltip = '';
                break;
        }

        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
        //     this.fuseConfig = config;
        // });

        // get wallboard skills
        SDKClient.getTmacWallboardSkills().then((dt) => {
            if (dt.response.length > 0) {
                // assign all the skills
                this.allSkills = orderBy(dt.response, ['SkillName'], ['asc']);
            }
        });

        // check if agent allowed then load agent list
        if (this.data?.agent.allowed) {
            this.loadAgentList(false);
        }

        if (this.data?.skill.allowed) {
            this.loadSkillList();
        }

        // check for actions
        this.checkForActions();

        this.setNewColumns();
    }

    /**
     * Sets new columns for the table based on configs
     */
    setNewColumns(): void {
        if (this.data.agent.columns && this.data.agent.columns.length) {
            this.agentListTable.tableData.columns = this.data.agent.columns;
        }
        if (this.data.skill.columns && this.data.skill.columns.length) {
            this.skillListTable.tableData.columns = this.data.skill.columns;
        }
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sets up listening to Search input
     */
    private setupSearchInputListener(): void {
        // detect changes in search key
        this.searchKey.valueChanges
            .pipe(
                // Debounce time for input value for optimised search
                debounceTime(500)
            )
            .subscribe((key: string) => {
                // make everything lowercase to avoid case sensitivity
                key = key.toLowerCase();
                // check which filter should be applied based on this.activeSwitcher
                if (this.activeSwitcher === 'agentList') {
                    // filter agent list
                    this.filterAgentList(key);
                } else if (this.activeSwitcher === 'skillList') {
                    // check if key not empty to apply the filter
                    if (key) {
                        // for skill only apply searchkey filter
                        this.skillListTable.tableData.source.data = this.skillListTable.skillList.filter((x) =>
                            // stringify and lowercase for .includes string search
                            JSON.stringify(x).toLowerCase().includes(key.toLowerCase())
                        );
                    } else {
                        this.skillListTable.tableData.source.data = this.skillListTable.skillList;
                    }
                } else if (this.activeSwitcher === 'dynamicList') {
                    // check if key not empty to apply the filter
                    if (key) {
                        // for skill only apply searchkey filter
                        this.dynamicListTable.tableData.source.data = this.data.otherData.dynamicList.data.filter((x: any) =>
                            // stringify and lowercase for .includes string search
                            JSON.stringify(x).toLowerCase().includes(key.toLowerCase())
                        );
                    } else {
                        this.dynamicListTable.tableData.source.data = this.data.otherData.dynamicList.data;
                    }
                }
            });
    }

    /**
     * To check action button is allowed
     */
    private checkForActions(): void {
        if (this.activeSwitcher === 'dynamicList') {
            this.consultAllowed = this.data?.otherData?.dynamicList?.consultAllowed ?? true;
            this.blindAllowed = this.data?.otherData?.dynamicList?.blindAllowed;
            this.commentsAllowed = this.data?.otherData?.dynamicList?.commentsAllowed ?? false;
        } else if (this.activeSwitcher === 'agentList') {
            this.consultAllowed = this.data?.agent?.consult ?? true;
            this.blindAllowed = this.data?.agent.blind;
            this.commentsAllowed = this.data?.agent?.comments ?? false;
        } else {
            this.consultAllowed = this.data?.skill?.consult ?? true;
            this.blindAllowed = this.data?.skill.blind;
            this.commentsAllowed = this.data?.skill?.comments ?? false;
        }
    }

    /**
     * To make call to a number
     */
    private makeCall(): void {
        this.loading = true;
        const freeTextConf = this.freeTextConf[this.activeSwitcher];
        const dialTo = freeTextConf.enabled ? freeTextConf.value : this.selectedItem;
        SDKClient.makeCall({
            interactionId: this.interactionId.toString(),
            number: dialTo,
            source: '',
            sourceId: ''
        })
            .then((dt) => {
                this.loading = false;
                // check the response
                if (dt.response.ResultCode === 0) {
                    // make call success
                    this._appUIService.showSnackbar(`Make call initiated to ${dialTo} successfully`);
                    this.close(true);
                } else {
                    // make call failed
                    this._appUIService.showSnackbar(`Make call initiated failed, ${dt.response.ResultMessage}`, 'failure');
                }
            })
            .catch(() => {
                this.loading = false;
                // make call error
                this._appUIService.showSnackbar('Make call initiated error, please try again', 'failure');
            });
    }

    /**
     * To transfer a call
     */
    private async transferCall(): Promise<void> {
        this.loading = true;
        try {
            // init response
            let result: IResponseData<CommandResultEvent>;
            const freeTextConf = this.freeTextConf[this.activeSwitcher];
            const transferTo = freeTextConf.enabled ? freeTextConf.value : this.selectedItem;

            // [MS: Jun 24, '21] commenting to call transferBlind instead of transferCall for PBX calls
            // for MS call blind transfer use method 'transferBlind'
            // if (!this.isConsult) {
            // if (!this.isConsult && this.data.otherData.isMSCall) {
            if (!this.isConsult) {
                result = await SDKClient.transferBlind({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: transferTo
                });
            } else {
                // for consult call and PBX blind use the same method
                result = await SDKClient.transferCall({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: transferTo
                });
            }

            // check the response
            if (result.response?.ResultCode === 0) {
                // transfer call success
                this._appUIService.showSnackbar(
                    `${this.isConsult ? 'Consult transfer' : 'Blind transfer'} call initiated to ${transferTo} successfully`
                );
                this.close(true);
            } else {
                // transfer call failed
                this._appUIService.showSnackbar(
                    `${this.isConsult ? 'Consult transfer' : 'Blind transfer'} call initiation failed, please try again!`,
                    'failure'
                );
            }
        } catch (error) {
            //     // transfer call error
            this._appUIService.showSnackbar(
                `${this.isConsult ? 'Consult transfer' : 'Blind transfer'} call initiation error, please try again!`,
                'failure'
            );
        }

        // set loading to false
        this.loading = false;
    }

    /**
     * To transfer a call
     */
    private async conferenceCall(): Promise<void> {
        this.loading = true;

        try {
            const freeTextConf = this.freeTextConf[this.activeSwitcher];
            const conferenceTo = freeTextConf.enabled ? freeTextConf.value : this.selectedItem;

            // init response
            let result: IResponseData<CommandResultEvent>;

            // check if consult
            if (this.isConsult) {
                result = await SDKClient.conferenceCall({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: conferenceTo
                });
            }
            // for blind
            else {
                result = await SDKClient.conferenceBlind({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: conferenceTo
                });
            }

            // check the response
            if (result.response?.ResultCode === 0) {
                // transfer call success
                this._appUIService.showSnackbar(
                    `${this.isConsult ? 'Consult conference' : 'Blind conference'} call initiated to ${conferenceTo} successfully`
                );
                this.close(true);
            } else {
                // transfer call failed
                this._appUIService.showSnackbar(
                    `${this.isConsult ? 'Consult conference' : 'Blind conference'} call initiation failed, please try again!`,
                    'failure'
                );
            }
        } catch (error) {
            //     // transfer call error
            this._appUIService.showSnackbar(
                `${this.isConsult ? 'Consult conference' : 'Blind conference'} call initiation error, please try again!`,
                'failure'
            );
        }

        // set loading to false
        this.loading = false;
    }

    /**
     * To transfer/conference a chat to agent/skill
     */
    private transferConferenceChat(): void {
        this.loading = true;
        const type = this.data.otherData.type === 'conf' ? 'conference' : this.data.otherData.type;
        const freeTextConf = this.freeTextConf[this.activeSwitcher];
        // agent transfer/conf
        if (this.selectedRow?.type === 'agent') {
            // if consault transfer/conf
            if (this.isConsult) {
                SDKClient.sendTextChatTransferNotification({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    otherData: JSON.stringify({
                        type: this.data.otherData.type,
                        mode: this.data.otherData.mode
                    }),
                    // uncomment this when freetext available for agent
                    // toAgentId: freeTextConf.enabled ? freeTextConf.value : this.selectedItem,
                    toAgentId: this.selectedItem,
                    toTmacServer: this.selectedRow.row.TmacServer
                })
                    .then((dt) => {
                        this.loading = false;
                        if (dt.response.ResultCode >= 0) {
                            this._appUIService.showSnackbar(`Chat ${type} notification sent to remote agent, Please wait for response.`);
                        } else {
                            this._appUIService.showSnackbar(dt.response.ResultMessage, 'failure');
                        }
                    })
                    .catch(() => {
                        this.loading = false;
                        this._appUIService.showSnackbar(`Chat ${type} notification failed, please try again`, 'failure');
                    });
            }
            // blind transfer/confks
            else {
                SDKClient.transferTextChat({
                    chatMode: this.data.otherData.mode,
                    comment: this.comments,
                    conferenceType: this.data.otherData.type,
                    interactionId: this.interactionId.toString(),
                    lineId: this.data.otherData.lineId,
                    sessionId: this.data.otherData.sessionId,
                    toAgentId: freeTextConf.enabled ? freeTextConf.value : this.selectedItem,
                    toTmacServer: this.selectedRow.row.TmacServer
                })
                    .then((dt) => {
                        this.loading = false;
                        // transfer success
                        if (dt.response.ResultCode >= 0) {
                            this.close(true);
                        }
                        // transfer error
                        else {
                            this._appUIService.showSnackbar(`Chat ${type} failed, ${dt.response.ResultMessage}`, 'failure');
                        }
                    })
                    .catch(() => {
                        this.loading = false;
                        this._appUIService.showSnackbar(`Chat ${type} error, please try again`, 'failure');
                    });
            }
        }
        // skill transfer/conf
        else if (this.selectedRow?.type === 'skill' || freeTextConf.enabled) {
            this.loading = false;
            SDKClient.transferTextChatToQueue({
                chatMode: this.data.otherData.mode,
                interactionId: this.interactionId.toString(),
                isBlind: true,
                skillId: freeTextConf.enabled ? freeTextConf.value : this.selectedItem
            })
                .then((dt) => {
                    this.loading = false;
                    if (dt.response.ResultCode >= 0) {
                        this.close(true);
                    } else {
                        this._appUIService.showSnackbar(`Chat ${type} to queue failed, ${dt.response.ResultMessage}`, 'failure');
                    }
                })
                .catch(() => {
                    this.loading = false;
                    this._appUIService.showSnackbar(`Chat ${type} to queue error, please try again`, 'failure');
                });
        } else {
            // no row selected
            this._appUIService.showSnackbar('Error: No row selected to transfer chat', 'failure');
            this.close(false);
        }
    }

    /**
     * Transfers email
     */
    private transferEmail(): void {
        this.loading = true;
        const emails: any[] = this.data.otherData.emails;
        const freeTextConf = this.freeTextConf[this.activeSwitcher];
        const transferTo = freeTextConf.enabled ? freeTextConf.value : this.selectedItem;

        // agent transfer/conf
        if (this.selectedRow?.type === 'agent') {
            emails.forEach((email) => {
                const { RouteId, SessionId } = email;
                SDKClient.transferEmailToAgent({
                    routeId: RouteId,
                    sessionId: SessionId,
                    toAgentId: transferTo
                })
                    .then((res) => {
                        this.loading = false;
                        if (res.response > 0) {
                            this._appUIService.showSnackbar(`Email transferred to ${transferTo} successfully`, 'success');
                            this.close(true);
                        } else {
                            console.error(res);
                            this._appUIService.showSnackbar('Email transfer failed', 'failure');
                        }
                    })
                    .catch((err) => {
                        this.loading = false;
                        console.error(err);
                        this._appUIService.showSnackbar('Error in email transfer', 'failure');
                    });
            });
        } else {
            emails.forEach((email) => {
                const { RouteId, SessionId } = email;
                SDKClient.transferEmailToSkill({
                    routeId: RouteId,
                    sessionId: SessionId,
                    skillId: transferTo
                })
                    .then((res) => {
                        this.loading = false;
                        if (res.response > 0) {
                            this._appUIService.showSnackbar(`Email transferred to ${transferTo} successfully`, 'success');
                            this.close(true);
                        } else {
                            console.error(res);
                            this._appUIService.showSnackbar('Email transfer failed', 'failure');
                        }
                    })
                    .catch((err) => {
                        this.loading = false;
                        console.error(err);
                        this._appUIService.showSnackbar('Error in email transfer', 'failure');
                    });
            });
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
    switchTab(item: {
        /**
         * Key
         */
        key: string;
    }): void {
        this.searchKey.setValue('');
        // assign active switcher
        this.activeSwitcher = item.key;

        // get the main label dynamically
        this.mainLabel = this.switcherList.filter((f) => f.key === item.key)?.[0].textLabel || '';

        // check for actions
        this.checkForActions();

        // clear the selection
        this.selectedItem = '';

        // clear all filter
        this.clearAllFilter();

        // check for comments, if dynamicList
        if (this.activeSwitcher === 'dynamicList') {
            this.commentsAllowed = this.data.otherData.dynamicList.commentsAllowed;
        }
    }

    /**
     * Filters agent list based on selected skill and optional search key
     * @param {String} searchKey
     */
    filterAgentList(searchKey?: string): void {
        if (this.agentListTable.agentList.length > 0) {
            // check if skill is selscted to apply the selected skill filter
            if (this.selectedSkill) {
                let list = this.agentListTable.agentList;
                // apply both skill and search key filter
                list = list.filter((d) => {
                    // stringify to check if the searchkey string exists
                    const stringified = JSON.stringify(d).toLowerCase();
                    // check and return the condition for selected skill filetr  with search key
                    return d.AgentVoiceSkillsAsString?.includes(this.selectedSkill) && stringified.includes(searchKey || '');
                });
                this.agentListTable.tableData.source.data = list;
            } else {
                let list = this.agentListTable.agentList;
                if (searchKey) {
                    // since no skill selected , just apply the search key filter
                    list = list.filter((d) => {
                        // stringify to check if the searchkey string exists
                        const stringified = JSON.stringify(d).toLowerCase();
                        // check and return the condition for selected skill filetr  with search key
                        return stringified.includes(searchKey);
                    });
                }
                this.agentListTable.tableData.source.data = list;
            }
        }
    }

    /**
     * To clear all filter
     */
    clearAllFilter(): void {
        // clear skill filter
        this.clearSkillFilter();
        this.clearSelected();
        // assign the selected row
        this.selectedRow = null;
        this.searchKey.setValue('');
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
     * Clears displayed value for skill / agent
     */
    clearDisplayValues(): void {
        const freeTextConf = this.freeTextConf[this.activeSwitcher];
        this.selectedItemDisplayName = '';
        freeTextConf.value = '';
    }

    /**
     * To clear selected item
     */
    clearSelected(): void {
        this.selectedItem = '';
        this.clearDisplayValues();
        // clear grid selection if any
        if (this.activeSwitcher === 'dynamicList') {
            this.dynamicListTable.tableData.selection.clear();
        } else if (this.activeSwitcher === 'agentList') {
            this.agentListTable.tableData.selection.clear();
        } else {
            this.skillListTable.tableData.selection.clear();
        }
    }

    /**
     * To load agent list
     * @param {boolean} reload
     */
    loadAgentList(reload: boolean): void {
        this.loading = true;
        // get agent list
        SDKClient.getAgentListStaffed({
            agentId: true,
            byTeam: this.data.agent.teamFilter ?? false,
            type: ''
        })
            .then((dt) => {
                this.loading = false;
                // check if data found
                if (dt.response.length > 0) {
                    // filter the same agent and bots from the list
                    const list = dt.response
                        .filter((r: AgentModel) => r.LoginID !== SDKClient.getAgentData().agentId && r.AccessRole?.toLowerCase() !== 'chatbot')
                        .map((row) =>
                            formatJsonData<Partial<AgentModel | any>>(
                                { row },
                                {
                                    FirstName: 'row.FirstName',
                                    LastName: 'row.LastName',
                                    LoginID: 'row.LoginID',
                                    CurrentAgentStatus: 'row.CurrentAgentStatus',
                                    InteractionCounts: 'row.InteractionCounts',
                                    AgentVoiceSkillsAsString: 'row.AgentVoiceSkillsAsString',
                                    StationID: 'row.StationID',
                                    TmacServer: 'row.TmacServer'
                                }
                            )
                        );
                    this.agentListTable.tableData.source.data = list;
                    this.agentListTable.agentList = list;
                    this.agentListTable.tableData.source.sort = this.sort;

                    // if reload the filter after getting the data
                    if (reload) {
                        this.filterAgentList();
                    }
                }
            })
            .catch((e) => {
                this.loading = false;
                console.error(e);
                this._appUIService.showSnackbar('Error in loading agent list', 'failure');
            });
    }

    /**
     * To load skill list
     */
    loadSkillList(): void {
        this.loading = true;
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const getOpHours = (opHours: any, key: string) => {
            const time = new Date();
            time.setHours(opHours[key].Hours);
            time.setMinutes(opHours[key].Minutes);
            time.setSeconds(opHours[key].Seconds);
            return time;
        };

        // Getting favourite skills from api
        SDKClient.getFavouriteSkills()
            .then((dt: IResponse) => {
                this.loading = false;
                // check if data found
                if (dt.response.length > 0) {
                    // check the prefix list
                    const channelPrefix = this.data?.skill.channelPrfix || [];

                    // Filtering skills based on
                    // 1. The prefix passed in Config
                    // 2. Operating hours
                    this.skillListTable.skillList = (dt.response as SkillType[]).reduce((acc, skill) => {
                        const valid = { prefix: false, opHours: false };
                        // Filter 1 : The prefix passed in Config
                        if (channelPrefix.length > 0) {
                            valid.prefix = channelPrefix.some((prefix) => skill.Name.toLowerCase().startsWith(prefix.toLowerCase()));
                        } else {
                            valid.prefix = true;
                        }

                        // Filter 2 : Operating hours
                        //  But before checking , Checking if the prefix condition is satisfied
                        if (valid.prefix) {
                            if (!skill.OperatingHours || !skill.OperatingHours.length) {
                                valid.opHours = true;
                            } else {
                                const today = new Date();
                                skill.OperatingHours.forEach((opHours) => {
                                    if (weekdays.indexOf(opHours.Day) === today.getDay()) {
                                        const startTime = getOpHours(opHours, 'StartTime');
                                        const endTime = getOpHours(opHours, 'EndTime');
                                        if (startTime.getTime() <= today.getTime()) {
                                            if (endTime.getTime() >= today.getTime()) {
                                                valid.opHours = true;
                                            }
                                        }
                                    }
                                });
                            }
                        }

                        // Push to the Acc array if both the conditions are satisfied
                        if (valid.prefix && valid.opHours) {
                            acc.push(
                                formatJsonData<Partial<FavouriteSkill | any>>(
                                    { row: skill },
                                    {
                                        CIQ: 'row.CIQ',
                                        Avail: 'row.Avail',
                                        Staff: 'row.Staff',
                                        ID: 'row.ID',
                                        VDN: 'row.VDN',
                                        Name: 'row.Name',
                                        OperatingHours: 'row.OperatingHours'
                                    }
                                )
                            );
                        }
                        return acc;
                    }, []);

                    this.skillListTable.tableData.source.data = this.skillListTable.skillList;
                    this.skillListTable.tableData.source.sort = this.sort;
                }
            })
            .catch((e) => {
                this.loading = false;
                console.error(e);
                this._appUIService.showSnackbar('Error in loading skill list', 'failure');
            });
    }

    /**
     * To process agent selected from list
     */
    selectAgent(row: AgentModel): void {
        const freeTextConf = this.freeTextConf[this.activeSwitcher];
        // if already loading then return
        if (this.loading) {
            return;
        }
        // clear the selection
        this.clearSelected();
        freeTextConf.enabled = false;
        // this.selectedItem = '';
        // this.agentListTable.tableData.selection.clear();
        // this.clearDisplayValues();
        this.loading = true;
        const currentStatus = row.CurrentAgentStatus;
        row.CurrentAgentStatus = 'loading';
        row.AgentName = row.FirstName + ' ' + row.LastName;
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
                // source to select
                const source = this.data?.agent.source || 'agentId';
                // change the status
                row.CurrentAgentStatus = dt.response.ResultMessage;
                // get the new state
                const state = dt.response.ResultMessage;
                if (allowedStates.length === 0 || (allowedStates.length > 0 && allowedStates.includes(state))) {
                    // select the row in grid
                    this.agentListTable.tableData.selection.select(row);
                    if (typeof source === 'object') {
                        // assign the selected item
                        this.selectedItem = source.Use === 'agentId' ? row.LoginID : row.StationID;
                        const nameAliasMap = {
                            agentName: '${FirstName} ${LastName}',
                            station: '${StationID}',
                            agentId: '${LoginID}'
                        };
                        const nameToBeDisplayed = nameAliasMap[source.Display || 'agentName'] || source.Display;
                        this.selectedItemDisplayName = setStringVars(nameToBeDisplayed, row);
                    } else {
                        // assign the selected item
                        this.selectedItem = source === 'agentId' ? row.LoginID : row.StationID;
                        this.selectedItemDisplayName = this.selectedItem;
                    }
                    // assign the selected row
                    this.selectedRow = { type: 'agent', row };
                } else {
                    this._appUIService.showSnackbar(`Agent ${row.AgentName} is not in valid state`, 'failure');
                }
            })
            .catch((e) => {
                console.error(e);
                this._appUIService.showSnackbar(`Error in getting agent ${row.AgentName}'s current state`, 'failure');
                row.CurrentAgentStatus = currentStatus;
                this.loading = false;
            });
    }

    /**
     * To process skill selected from list
     */
    selectSkill(row: FavouriteSkill): void {
        // if already loading then return
        if (this.loading) {
            return;
        }
        const freeTextConf = this.freeTextConf[this.activeSwitcher];
        // clear the selection
        this.clearSelected();
        freeTextConf.enabled = false;
        // this.selectedItem = '';
        // this.skillListTable.tableData.selection.clear();
        // this.clearDisplayValues();
        this.loading = true;
        row.Staff = 'loading';
        row.Avail = 'loading';
        row.CIQ = 'loading';
        // get queue status from server
        SDKClient.getQueueStatus(row.ID)
            .then((dt) => {
                this.loading = false;
                // source to select
                const source = this.data?.skill.source || 'skill';
                // check the response is proper
                if (dt.response.EventName === 'QueueStatusEvent') {
                    // cast the response
                    dt.response = dt.response as QueueStatusEvent;
                    // assign the values
                    row.Staff = dt.response.Skill.AgentsStaffed.toString();
                    row.Avail = dt.response.Skill.AgentAvailable.toString();
                    row.CIQ = dt.response.Skill.CallsInQueue.toString();
                    // select the row in grid
                    this.skillListTable.tableData.selection.select(row);
                    if (typeof source === 'object') {
                        // assign the selected item
                        this.selectedItem = source.Use === 'skill' ? row.ID : row.VDN;
                        const nameAliasMap = {
                            skill: '${ID}',
                            vdn: '${VDN}'
                        };
                        const nameToBeDisplayed: string = nameAliasMap[source.Display || 'skill'] || source.Display.replaceAll('${', '${row.');
                        this.selectedItemDisplayName = setStringVars(nameToBeDisplayed, row);
                    } else {
                        // assign the selected item
                        this.selectedItem = source === 'skill' ? row.ID : row.VDN;
                    }
                    // assign the selected row
                    this.selectedRow = { type: 'skill', row };
                } else {
                    this._appUIService.showSnackbar(`Failed to get skill ${row.ID} status`, 'failure');
                    row.Staff = 'NA';
                    row.Avail = 'NA';
                    row.CIQ = 'NA';
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar(`Error in getting skill ${row.ID} status`, 'failure');
                row.Staff = 'NA';
                row.Avail = 'NA';
                row.CIQ = 'NA';
                this.loading = false;
            });
    }

    /**
     * To process dynamic selected from list
     */
    selectDynamic(row: any): void {
        // select the row in grid
        this.dynamicListTable.tableData.selection.select(row);
        // assign the selected item
        this.selectedItemDisplayName = this.selectedItem = row[this.data.otherData.dynamicList.selection];
        // assign the selected row
        this.selectedRow = {
            type: this.data.otherData.dynamicList.type || 'dynamic',
            row: row
        };
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
     * @param consult
     */
    executeAction(consult: boolean): void {
        this.isConsult = consult;
        const freeTextConf = this.freeTextConf[this.activeSwitcher];
        // check if the selected tab is dynamic, then close the dynamicList widget should handle the action
        if (!freeTextConf.enabled && this.selectedRow.type.includes('dynamic')) {
            this.close(true);
            return;
        }

        // check the type if not dynamic list selection
        const type = this.data?.type || '';
        switch (type) {
            case 'makeCall':
                this.makeCall();
                break;
            case 'transferCall':
                this.transferCall();
                break;
            case 'conferenceCall':
                this.conferenceCall();
                break;
            case 'transferChat':
            case 'conferenceChat':
                this.transferConferenceChat();
                break;
            case 'transferEmail':
                this.transferEmail();
                break;
            case 'pushChat':
                this.close(true);
                break;
            default:
                this._appUIService.showSnackbar('Error: NotImplementedException', 'failure');
                this.close(false);
                break;
        }
    }

    /**
     * To close the parent wrapper component
     *
     * @param {any} data
     */
    close(success: boolean): void {
        // call the callback
        if (typeof this.data.callback === 'function') {
            this.data.callback({
                source: this.selectedRow?.type,
                selectedRow: this.selectedRow?.row,
                isConsult: this.isConsult,
                success
            });
        }
        this.wrapperComponent.close();
    }
}
