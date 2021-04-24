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
import { AgentSkillListData, AgentSkillListSourceObject } from 'app/interfaces';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AgentModel, CommandResultEvent, FavouriteSkill, IResponse, IResponseData, QueueStatusEvent, SDKClient } from '@tmac/sdk';
import { SharedWrapperComponent } from '../shared-wrapper/shared-wrapper.component';

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
        agentList: AgentModel[];
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
    allSkills: any;
    /**
     * List of all favourite skills
     */
    allFavouriteSkills: FavouriteSkill[];
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
    freeTextAgentKey = { allowed: false, enabled: false, value: '' };

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
        this.showComments = false;
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
        this.interactionId = this.data?.interactionId || 0;

        this.setupSearchInputListener();
        const type = this.data?.type || '';
        switch (type) {
            case 'makeCall':
                this.icon = 'add_ic_call';
                this.actionTooltip = 'Call';
                /**
                 * Config to allow free text
                 */
                this.freeTextAgentKey.allowed = (this.data?.agent.source as AgentSkillListSourceObject).FreeTextAllowed;
                break;
            case 'transferCall':
                this.icon = 'phone_forwarded';
                this.showComments = true;
                this.actionTooltip = 'Consult';
                /**
                 * Config to allow free text
                 */
                this.freeTextAgentKey.allowed = (this.data?.agent.source as AgentSkillListSourceObject).FreeTextAllowed;
                break;
            case 'conferenceCall':
                this.icon = 'group_add';
                this.actionTooltip = 'Consult';
                /**
                 * Config to allow free text
                 */
                this.freeTextAgentKey.allowed = (this.data?.agent.source as AgentSkillListSourceObject).FreeTextAllowed;
                break;
            case 'transferChat':
                this.disableInput = true;
                this.icon = 'forward';
                this.showComments = true;
                this.actionTooltip = 'Consult';
                break;
            case 'pushChat':
                this.disableInput = true;
                this.icon = 'forward';
                this.showComments = false;
                this.actionTooltip = 'Push';
                break;
            case 'conferenceChat':
                this.disableInput = true;
                this.icon = 'group_add';
                this.showComments = true;
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

        // check for blind
        this.checkForBlind();

        this.setNewColumns();
    }

    /**
     * Sets new columns for the table based on configs 
     */
    setNewColumns(): void {
        if (this.data.agent.columns) {
            this.agentListTable.tableData.columns = this.data.agent.columns;
        }
        if (this.data.skill.columns) {
            this.skillListTable.tableData.columns = this.data.skill.columns;
        }
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
                        this.skillListTable.tableData.source.data = this.allFavouriteSkills.filter((x) =>
                            // stringify and lowercase for .includes string search
                            JSON.stringify(x).toLowerCase().includes(key.toLowerCase())
                        );
                    } else {
                        this.skillListTable.tableData.source.data = this.allFavouriteSkills;
                    }
                }
            });
    }

    /**
     * To check blind button is allowed
     */
    private checkForBlind(): void {
        if (this.activeSwitcher === 'dynamicList') {
            this.blindAllowed = this.data?.otherData.dynamicList.blindAllowed;
        } else if (this.activeSwitcher === 'agentList') {
            this.blindAllowed = this.data?.agent.blind;
        } else {
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
            number: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem,
            source: '',
            sourceId: ''
        })
            .then((dt) => {
                this.loading = false;
                // check the response
                if (dt.response.ResultCode === 0) {
                    // make call success
                    this._appUIService.showSnackbar(`Make call to ${this.selectedItem} successful`);
                    this.close();
                } else {
                    // make call failed
                    this._appUIService.showSnackbar(`Make call failed, ${dt.response.ResultMessage}`, 'failure');
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
     */
    private async transferCall(): Promise<void> {
        this.loading = true;
        try {
            // init response
            let result: IResponseData<CommandResultEvent>;

            // for MS call blind transfer use method 'transferBlind'
            // if (!this.isConsult) {
            if (!this.isConsult && this.data.otherData.isMSCall) {
                result = await SDKClient.transferBlind({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem
                });
            } else {
                // for consult call and PBX blind use the same method
                result = await SDKClient.transferCall({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem
                });
            }

            // check the response
            if (result.response?.ResultCode === 0) {
                // transfer call success
                this._appUIService.showSnackbar(
                    `${this.isConsult ? 'Consult transfer' : 'Blind transfer'} call initiated to ${this.selectedItem} successfully`
                );
                this.close();
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
            // init response
            let result: IResponseData<CommandResultEvent>;

            // check if consult
            if (this.isConsult) {
                result = await SDKClient.conferenceCall({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem
                });
            }
            // for blind
            else {
                result = await SDKClient.conferenceBlind({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    number: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem
                });
            }

            // check the response
            if (result.response?.ResultCode === 0) {
                // transfer call success
                this._appUIService.showSnackbar(
                    `${this.isConsult ? 'Consult conference' : 'Blind conference'} call initiated to ${this.selectedItem} successfully`
                );
                this.close();
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
                    toAgentId: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem,
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
                    toAgentId: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem,
                    toTmacServer: this.selectedRow.row.TmacServer
                })
                    .then((dt) => {
                        this.loading = false;
                        // transfer success
                        if (dt.response.ResultCode >= 0) {
                            this.close();
                        }
                        // transfer error
                        else {
                            this._appUIService.showSnackbar(`Chat ${type} failed, please try again`, 'failure');
                        }
                    })
                    .catch(() => {
                        this.loading = false;
                        this._appUIService.showSnackbar(`Chat ${type} error, please try again`, 'failure');
                    });
            }
        }
        // skill transfer/conf
        else if (this.selectedRow?.type === 'skill') {
            this.loading = false;
            SDKClient.transferTextChatToQueue({
                chatMode: this.data.otherData.mode,
                interactionId: this.interactionId.toString(),
                isBlind: true,
                skillId: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem
            })
                .then((dt) => {
                    this.loading = false;
                    if (dt.response.ResultCode >= 0) {
                        this.close();
                    } else {
                        this._appUIService.showSnackbar(`Chat ${type} to queue failed, please try again`, 'failure');
                    }
                })
                .catch(() => {
                    this.loading = false;
                    this._appUIService.showSnackbar(`Chat ${type} to queue error, please try again`, 'failure');
                });
        } else {
            // no row selected
            this._appUIService.showSnackbar('Error: No row selected to transfer chat', 'failure');
            this.close();
        }
    }

    /**
     * Transfers email
     */
    private transferEmail(): void {
        this.loading = true;
        const emails: any[] = this.data.otherData.emails;
        // agent transfer/conf
        if (this.selectedRow?.type === 'agent') {
            emails.forEach((email) => {
                const { RouteId, SessionId } = email;
                SDKClient.transferEmailToAgent({
                    routeId: RouteId,
                    sessionId: SessionId,
                    toAgentId: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem
                })
                    .then((res) => {
                        this.loading = false;
                        if (res.response >= -1) {
                            this._appUIService.showSnackbar('Email transferred successfully', 'success');
                            this.close();
                        } else {
                            console.error(res);
                            this._appUIService.showSnackbar('Email transfer failed', 'failure');
                        }
                    })
                    .catch((err) => {
                        this.loading = false;
                        console.error(err);
                        this._appUIService.showSnackbar('Email transfer failed', 'failure');
                    });
            });
        } else {
            emails.forEach((email) => {
                const { RouteId, SessionId } = email;
                SDKClient.transferEmailToSkill({
                    routeId: RouteId,
                    sessionId: SessionId,
                    skillId: this.freeTextAgentKey.enabled ? this.freeTextAgentKey.value : this.selectedItem
                })
                    .then((res) => {
                        this.loading = false;
                        if (res.response >= -1) {
                            this._appUIService.showSnackbar('Email transferred successfully', 'success');
                            this.close();
                        } else {
                            console.error(res);
                            this._appUIService.showSnackbar('Email transfer failed', 'failure');
                        }
                    })
                    .catch((err) => {
                        this.loading = false;
                        console.error(err);
                        this._appUIService.showSnackbar('Email transfer failed', 'failure');
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

        // enable free text if skill tab is selected
        this.freeTextAgentKey.enabled = true;

        // get the main label dynamically
        this.mainLabel = this.switcherList.filter((f) => f.key === item.key)?.[0].textLabel || '';

        // check for blind
        this.checkForBlind();

        // clear the selection
        this.selectedItem = '';

        // clear all filter
        this.clearAllFilter();

        // check for comments, if dynamicList
        if (this.activeSwitcher === 'dynamicList') {
            this.showComments = this.data.otherData.dynamicList.showComments;
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
     * To clear selected item
     */
    clearSelected(): void {
        this.selectedItem = '';
        this.selectedItemDisplayName = '';
        this.freeTextAgentKey.value = '';
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
            byTeam: true,
            type: ''
        })
            .then((dt) => {
                this.loading = false;
                // check if data found
                if (dt.response.length > 0) {
                    // filter the same agent and bots from the list
                    dt.response = dt.response.filter(
                        (r: AgentModel) => r.LoginID !== SDKClient.getAgentData().agentId && r.AgentProfile.AccessRole.toLowerCase() !== 'chatbot'
                    );
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
                this._appUIService.showSnackbar('Error in loading agent list', 'failure');
            });
    }

    /**
     * To load skill list
     */
    loadSkillList(): void {
        this.loading = true;
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const res = [{ "__type": "DataModel.FavouriteSkill", "ID": "49033", "Name": "CH_DiceChatSkill2", "OperatingHours": [], "VDN": "49033" }, { "__type": "DataModel.FavouriteSkill", "ID": "49037", "Name": "CH_DiceChatSkill3", "OperatingHours": [], "VDN": "49037" }, { "__type": "DataModel.FavouriteSkill", "ID": "49044", "Name": "EM_DiceEmailSkill1", "OperatingHours": [], "VDN": "49044" }, { "__type": "DataModel.FavouriteSkill", "ID": "49020", "Name": "VO_DiceNewPromo", "OperatingHours": [], "VDN": "49020" }, { "__type": "DataModel.FavouriteSkill", "ID": "49032", "Name": "VO_DiceSkill1", "OperatingHours": [{ "Day": "Fri", "EndTime": { "Ticks": 863400000000, "Days": 0, "Hours": 13, "Milliseconds": 0, "Minutes": 35, "Seconds": 30, "TotalDays": 0.99930555555555556, "TotalHours": 23.983333333333331, "TotalMilliseconds": 86340000, "TotalMinutes": 1439, "TotalSeconds": 86340 }, "StartTime": { "Ticks": 0, "Days": 0, "Hours": 0, "Milliseconds": 0, "Minutes": 0, "Seconds": 0, "TotalDays": 0, "TotalHours": 0, "TotalMilliseconds": 0, "TotalMinutes": 0, "TotalSeconds": 0 } }], "VDN": "49032" }]
        // get agent list
        SDKClient.getFavouriteSkills()
            // mock promise
            // new Promise((resolve) => resolve({ response: res }))
            .then((dt: IResponse) => {
                this.loading = false;
                // check if data found
                if (dt.response.length > 0) {
                    // check the prefix list
                    const channelPrefix = this.data?.skill.channelPrfix || [];
                    let list: FavouriteSkill[] = [];
                    if (channelPrefix.length > 0) {
                        channelPrefix.forEach((prefix) => {
                            const filtered = dt.response.filter((item) => {
                                if (item.Name.toLowerCase().startsWith(prefix.toLowerCase())) {
                                    return item;
                                }
                            });
                            list = [...list, ...filtered];
                        });
                    } else {
                        list = dt.response;
                    }
                    const today = new Date();
                    this.allFavouriteSkills = list.filter(skill => {
                        let available = false;
                        skill.OperatingHours.forEach((opHours) => {
                            if (weekdays.indexOf(opHours.Day) === today.getDay()) {
                                const startTime = new Date();
                                startTime.setHours(opHours.StartTime.Hours)
                                startTime.setMinutes(opHours.StartTime.Minutes)
                                startTime.setSeconds(opHours.StartTime.Seconds)
                                const endTime = new Date();
                                endTime.setHours(opHours.EndTime.Hours)
                                endTime.setMinutes(opHours.EndTime.Minutes)
                                endTime.setSeconds(opHours.EndTime.Seconds)
                                if (startTime.getTime() <= today.getTime()) {
                                    if (endTime.getTime() >= today.getTime()) {
                                        available = true;
                                        return
                                    }
                                }
                            }
                        });
                        return available || !skill.OperatingHours.length
                    });
                    this.skillListTable.tableData.source.data = list;
                    this.skillListTable.tableData.source.sort = this.sort;
                }
            })
            .catch(() => {
                this.loading = false;
                this._appUIService.showSnackbar('Error in loading skill list', 'failure');
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
                this._appUIService.showSnackbar(`Error in getting agent ${row.AgentName} current state`, 'failure');
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
        // clear the selection
        this.selectedItem = '';
        this.skillListTable.tableData.selection.clear();
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
        this.selectedItem = row[this.data.otherData.dynamicList.selection];
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
        // check if the selected tab is dynamic, then close the dynamicList widget should handle the action
        if (!this.freeTextAgentKey.enabled && this.selectedRow.type.includes('dynamic')) {
            this.close();
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
                this.close();
                break;
            default:
                this._appUIService.showSnackbar('Error: NotImplementedException', 'failure');
                this.close();
                break;
        }
    }

    /**
     * To close the parent wrapper component
     *
     * @param {any} data
     */
    close(): void {
        // call the callback
        if (typeof this.data.callback === 'function') {
            this.data.callback({
                source: this.selectedRow?.type,
                selectedRow: this.selectedRow?.row,
                isConsult: this.isConsult
            });
        }
        this.wrapperComponent.close();
    }
}
