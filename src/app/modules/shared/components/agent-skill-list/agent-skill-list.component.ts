import { AgentSkillListData, AgentSkillListSource } from '@ad/types';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { getStringVars } from '@tmac/operators';
import setStringVars from '@tmac/operators/setStringVars';
import {
    AgentModel,
    CommandResultEvent,
    FavouriteSkill,
    IResponseData,
    QueueStatusEvent,
    SDKClient,
    SpeedDialModel,
    WallboardSkillModel
} from '@tmac/sdk';
import { formatJsonData, InlineWorker } from 'app/utils';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SharedWrapperComponent } from '../shared-wrapper/shared-wrapper.component';
import { TableComponent } from '../table/table.component';

type ISwitch = {
    placeholder: string;
    freeText: IFreeTextConf;
    table: Partial<TableComponent>;
    data: any[];
    onSelect: (row: any) => void | Promise<void>;
    allowed?: boolean;
    consult?: boolean;
    blind?: boolean;
    comments?: boolean;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
};
type ITab = 'Agent List' | 'Skill List' | 'Speed Dial';
type ISkillType = Omit<FavouriteSkill, 'Staff' | 'Avail'> & { Stf: string; Avl: string };
type IFreeTextConf = {
    /**
     * ALlowed flag
     */
    allowed: boolean;
    /**
     * Enabled flag
     */
    active: boolean;
    /**
     * Value of freetext
     */
    value: string;
};

const PRESET_TABLES: ITab[] = ['Agent List', 'Skill List', 'Speed Dial'];

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
export class AgentSkillListComponent implements OnInit, AfterViewInit, OnDestroy {
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
     * Grid list switcher
     */
    switcherList: Record<ITab | string, ISwitch> = {};
    /**
     * Active switcher
     */
    activeSwitcher: ITab;
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
        type: ITab;
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
    selectedSkill: any = '';
    /**
     * Open search form flag
     */
    openSearch: boolean;
    /**
     * General loading flag
     */
    loading = 0;
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
     * AD table's ref
     */
    @ViewChild(TableComponent) table: TableComponent;

    /**
     * Operating hours filter
     */
    operationHoursCtrl = new FormControl('operating');

    /**
     * Inline worker
     */
    worker: InlineWorker;

    /**
     * Blind action label
     */
    blindLabel: string;

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public _dialogData: AgentSkillListData,
        // private _fuseConfigService: FuseConfigService,
        private fuseFacadeService: FuseFacadeService,
        private _appUIService: AppUiService
    ) {
        this.selectedItem = '';
        this.comments = '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * OnInit
     */
    ngOnInit(): void {
        this.title = this._dialogData?.Title || 'Agent Skill List';
        this.interactionId = this._dialogData?.InteractionId ?? 0;

        const setActiveSwitcher = (tab: ITab) => {
            if (!this.activeSwitcher) {
                this.activeSwitcher = tab;
            }
        };

        if (this._dialogData?.Agent && this._dialogData?.Agent.Allowed) {
            const table = {
                config: {
                    FirstName: { searchable: true, title: 'First Name' },
                    LastName: { searchable: true, title: 'Last Name' },
                    AgentID: { searchable: true, title: 'ID' },
                    CurrentAgentStatus: { searchable: true, title: 'Status' }
                }
            };
            const columns =
                this._dialogData.Agent.Columns && this._dialogData.Agent.Columns.length ? this._dialogData.Agent.Columns : Object.keys(table.config);
            const conf: ISwitch = {
                placeholder: 'Agent',
                freeText: { allowed: !!(this._dialogData?.Agent.Source as AgentSkillListSource)?.FreeTextAllowed, active: false, value: '' },
                table: Object.assign(table, { columns }),
                data: [],
                onSelect: this.selectAgent,
                sortBy: 'FirstName',
                sortDir: 'asc',
                allowed: this._dialogData.Agent.Allowed,
                blind: this._dialogData.Agent.Blind,
                comments: this._dialogData.Agent.Comments,
                consult: this._dialogData.Agent.Consult
            };
            // this.switcherList['Agent List'] = Object.assign(conf, this._dialogData?.Agent);

            this.switcherList['Agent List'] = conf;
            setActiveSwitcher('Agent List');
        }

        if (this._dialogData?.Skill && this._dialogData?.Skill.Allowed) {
            const table: Partial<TableComponent> = {
                config: {
                    Name: { searchable: true, width: '33%' },
                    VDN: { searchable: true },
                    ID: { searchable: true },
                    Stf: { searchable: true },
                    Avl: { searchable: true },
                    CIQ: { searchable: true }
                }
            };
            const columns =
                this._dialogData.Skill.Columns && this._dialogData.Skill.Columns.length ? this._dialogData.Skill.Columns : Object.keys(table.config);
            const conf: ISwitch = {
                placeholder: 'Skill/VDN',
                freeText: { allowed: !!(this._dialogData?.Skill.Source as AgentSkillListSource)?.FreeTextAllowed, active: false, value: '' },
                table: Object.assign(table, { columns }),
                data: [],
                onSelect: this.selectSkill,
                sortBy: 'Name',
                sortDir: 'asc',
                allowed: this._dialogData.Skill.Allowed,
                blind: this._dialogData.Skill.Blind,
                comments: this._dialogData.Skill.Comments,
                consult: this._dialogData.Skill.Consult
            };
            // this.switcherList['Skill List'] = Object.assign(conf, this._dialogData?.Skill);

            this.switcherList['Skill List'] = conf;
            setActiveSwitcher('Skill List');
        }

        if (this._dialogData?.SpeedDial && this._dialogData?.SpeedDial.Allowed) {
            const table: Partial<TableComponent> = {
                config: {
                    Name: { searchable: true },
                    Number: { searchable: true }
                    // TeamID: { searchable: true , title : 'Team ID' },
                    // TeamName: { searchable: true , title : 'Team Name' },
                    // Type: { searchable: true }
                }
            };
            const columns =
                this._dialogData.SpeedDial.Columns && this._dialogData.SpeedDial.Columns.length
                    ? this._dialogData.SpeedDial.Columns
                    : Object.keys(table.config);
            const conf: ISwitch = {
                placeholder: 'Number',
                freeText: {
                    allowed: !!(this._dialogData?.SpeedDial.Source as AgentSkillListSource)?.FreeTextAllowed,
                    active: false,
                    value: ''
                },
                table: Object.assign(table, { columns }),
                data: [],
                onSelect: this.selectSpeedDial,
                sortBy: 'Name',
                sortDir: 'asc',
                allowed: this._dialogData.SpeedDial.Allowed,
                blind: this._dialogData.SpeedDial.Blind,
                comments: this._dialogData.SpeedDial.Comments,
                consult: this._dialogData.SpeedDial.Consult
            };
            // this.switcherList['Speed Dial'] = Object.assign(conf, this._dialogData?.SpeedDial);

            this.switcherList['Speed Dial'] = conf;
            setActiveSwitcher('Speed Dial');
        }

        if (this._dialogData?.DynamicLists && this._dialogData.DynamicLists.length) {
            this._dialogData?.DynamicLists.forEach((l) => {
                const table: Partial<TableComponent> = {
                    config: l.Columns.reduce((acc, curr) => {
                        acc[curr] = { searchable: true };
                        return acc;
                    }, {}),
                    columns: l.Columns
                };
                this.switcherList[l.Label] = {
                    data: l.Data,
                    freeText: {
                        allowed: false,
                        active: false,
                        value: ''
                    },
                    allowed: true,
                    consult: l.Consult,
                    blind: l.Blind,
                    comments: l.Comments,
                    onSelect: (row) => {
                        this.selectDynamic(row, l.Selection);
                    },
                    placeholder: l.Placeholder,
                    table
                };
            });
        }

        this.setupSearchInputListener();

        const type = this._dialogData?.Type || '';

        switch (type) {
            case 'makeCall':
                this.icon = 'add_ic_call';
                this.actionTooltip = 'Call';
                if (this.switcherList['Agent List']) {
                    this.switcherList['Agent List'].placeholder = 'Agent/Station/Number';
                }
                this.blindLabel = 'B';
                break;
            case 'transferCall':
                this.icon = 'phone_forwarded';
                this.actionTooltip = 'Consult';
                if (this.switcherList['Agent List']) {
                    this.switcherList['Agent List'].placeholder = 'Agent/Station/Number';
                }
                this.blindLabel = 'BT';
                break;
            case 'conferenceCall':
                this.icon = 'group_add';
                this.actionTooltip = 'Consult';
                if (this.switcherList['Agent List']) {
                    this.switcherList['Agent List'].placeholder = 'Agent/Station/Number';
                }
                this.blindLabel = 'BC';
                break;
            case 'transferChat':
                this.disableInput = true;
                this.icon = 'forward';
                this.actionTooltip = 'Consult';
                this.blindLabel = 'BT';
                break;
            case 'pushChat':
                this.disableInput = true;
                this.icon = 'forward';
                this.actionTooltip = 'Push';
                this.blindLabel = 'BT';
                break;
            case 'conferenceChat':
                this.disableInput = true;
                this.icon = 'group_add';
                this.actionTooltip = 'Consult';
                this.blindLabel = 'BC';
                break;
            case 'transferEmail':
                this.disableInput = true;
                this.icon = 'forward_to_inbox';
                this.actionTooltip = 'Transfer';
                this.blindLabel = 'BT';
                break;
            case 'transferFax':
                this.disableInput = true;
                this.icon = 'forward';
                this.actionTooltip = 'Transfer';
                this.blindLabel = 'BT';
                break;
            default:
                this.icon = 'list_alt';
                this.actionTooltip = '';
                break;
        }
    }

    /**
     * After view init lifecycle hook
     */
    async ngAfterViewInit(): Promise<void> {
        // await this.presetData();
        this.switchTab(this.activeSwitcher);
        if (this.table) {
            this.table.source.filterPredicate = this.filterPredicate;
        }
    }

    // /**
    //  * Initializes tables
    //  */
    // private async presetData(): Promise<void> {
    //     const err = (e: Error, msg: string) => {
    //         this._appUIService.showSnackbar(msg, 'failure');
    //         console.error(e);
    //         this.loading -= 1;
    //     };

    //     if (this._dialogData?.Agent.Allowed) {
    //         this.loading += 1;
    //         await Promise.all([
    //             SDKClient.getAgentListStaffed({
    //                 agentId: true,
    //                 byTeam: this._dialogData.Agent.teamFilter ?? false,
    //                 type: ''
    //             }),
    //             SDKClient.getTmacWallboardSkills()
    //         ])
    //             .then((res) => {
    //                 this.mapAgents(res[0]);
    //                 this.mapSkills(res[1]);
    //                 this.initTables().agent();
    //             })
    //             .catch((e) => err(e, 'Error loading Agent list'))
    //             .finally(() => (this.loading -= 1));
    //     }

    //     if (this._dialogData?.Skill.Allowed) {
    //         this.loading += 1;
    //         await SDKClient.getFavouriteSkills()
    //             .then((res) => {
    //                 this.mapFavSkills(res);
    //                 this.initTables().skill();
    //             })
    //             .catch((e) => err(e, 'Error loading Skill list'))
    //             .finally(() => (this.loading -= 1));
    //     }

    //     if (this._dialogData?.SpeedDial?.Allowed) {
    //         this.loading += 1;
    //         await SDKClient.getSpeedDialNumbers(this._dialogData.SpeedDial.teamFilter)
    //             .then((res) => {
    //                 this.mapSpeedDial(res);
    //                 this.initTables().speedDial();
    //             })
    //             .catch((e) => err(e, 'Error loading Speed Dial list'))
    //             .finally(() => (this.loading -= 1));
    //     }
    // }

    /**
     * Initializes tables
     * @param {ITab} tab
     */
    private async presetData(tab: ITab): Promise<void> {
        const err = (e: Error, msg: string) => {
            this._appUIService.showSnackbar(msg, 'failure');
            console.error(e);
            this.loading -= 1;
        };

        if (tab === 'Agent List' && !this.switcherList['Agent List']?.data?.length) {
            this.loading += 1;
            await Promise.all([
                SDKClient.getAgentListStaffed({
                    agentId: true,
                    byTeam: this._dialogData.Agent.TeamFilter ?? false,
                    type: ''
                }),
                SDKClient.getTmacWallboardSkills()
            ])
                .then((res) => {
                    this.mapAgents(res[0]);
                    this.mapSkills(res[1]);
                    this.initTables().agent();
                })
                .catch((e) => err(e, 'Error in loading Agent list'))
                .finally(() => (this.loading -= 1));
        } else if (tab === 'Skill List' && !this.switcherList['Skill List']?.data?.length) {
            this.loading += 1;
            await SDKClient.getFavouriteSkills()
                .then((res) => {
                    this.mapFavSkills(res);
                    this.initTables().skill();
                })
                .catch((e) => err(e, 'Error in loading Skill list'))
                .finally(() => (this.loading -= 1));
        } else if (tab === 'Speed Dial' && !this.switcherList['Speed Dial']?.data?.length) {
            this.loading += 1;
            await SDKClient.getSpeedDialNumbers(this._dialogData.SpeedDial.TeamFilter)
                .then((res) => {
                    this.mapSpeedDial(res);
                    this.initTables().speedDial();
                })
                .catch((e) => err(e, 'Error in loading Speed Dial list'))
                .finally(() => (this.loading -= 1));
        }
    }

    private initTables = () => ({
        agent: () => {
            if (this._dialogData.Agent.Columns && this._dialogData.Agent.Columns.length) {
                this.table.columns = this._dialogData.Agent.Columns;
            }
        },
        skill: () => {
            if (this._dialogData.Skill.Columns && this._dialogData.Skill.Columns.length) {
                this.table.columns = this._dialogData.Skill.Columns;
            }
        },
        speedDial: () => {
            if (this._dialogData.SpeedDial.Columns && this._dialogData.SpeedDial.Columns.length) {
                this.table.columns = this._dialogData.SpeedDial.Columns;
            }
        }
    });

    /**
     * Maps Agent list response
     * @param {IResponseData<AgentModel[]>} res
     */
    private mapAgents = (res: IResponseData<AgentModel[]>): void => {
        if (res.response?.length === 0) {
            this.switcherList['Agent List'].data = [];
            return;
        }
        const currentAgentID = SDKClient.getAgentData().agentId;
        // filter the same agent and bots from the list
        const list = res.response
            .filter((r: AgentModel) => r.LoginID !== currentAgentID && r.AccessRole?.toLowerCase() !== 'chatbot')
            .map((row) =>
                formatJsonData<Partial<AgentModel | any>>(
                    { row },
                    {
                        AgentID: 'row.LoginID',
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
        this.switcherList['Agent List'].data = list;
    };

    /**
     * Maps Skill list response
     * @param  {IResponseData<WallboardSkillModel[]>} res
     */
    private mapSkills = (res: IResponseData<WallboardSkillModel[]>): void => {
        this.allSkills = orderBy(res.response, ['SkillName'], ['asc']);
    };

    /**
     * Maps Skill list response
     * @param {IResponseData<FavouriteSkill[]>} res
     */
    private mapFavSkills = (res: IResponseData<FavouriteSkill[]>): void => {
        // check if data found
        if (res.response?.length === 0) {
            this.switcherList['Skill List'].data = [];
            return;
        }

        // check the prefix list
        const channelPrefix = this._dialogData?.Skill.ChannelPrefix || [];

        // Filtering skills based on
        // 1. The prefix passed in Config
        // 2. Operating hours
        this.switcherList['Skill List'].data = res.response.reduce((acc, skill) => {
            const valid = { prefix: false, opHours: false, isWorkingDay: false };
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
                    valid.opHours = this.isValidOperationHours(skill.OperatingHours);
                }
            }

            // Filter 3 : check for holiday
            if (valid.opHours) {
                // [Chirag: Aug 1, '22] check if current time is a holiday for this skill
                valid.isWorkingDay = this.isWorkingDay(skill.Holidays)
            }

            // Push to the Acc array if all three conditions are satisfied
            if (valid.prefix && valid.opHours && valid.isWorkingDay) {
                acc.push(
                    formatJsonData<ISkillType>(
                        { row: skill },
                        {
                            CIQ: 'row.CIQ',
                            Avl: 'row.Avail',
                            Stf: 'row.Staff',
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
    };

    /**
     * Maps Skill list response
     * @param {IResponseData<SpeedDialModel[]>} res
     */
    private mapSpeedDial = (res: IResponseData<SpeedDialModel[]>): void => {
        // Filtering skills based on Operation hours
        this.switcherList['Speed Dial'].data = res.response.reduce((acc, sDial) => {
            let validOpHours = false;
            if (!sDial.OperatingHours || !sDial.OperatingHours.length) {
                validOpHours = true;
            } else {
                validOpHours = this.isValidOperationHours(sDial.OperatingHours);
            }
            // Push to the Acc array if both the conditions are satisfied
            if (validOpHours) {
                acc.push(sDial);
            }
            return acc;
        }, []);
    };

    isValidOperationHours = (operatingHours: any[]): boolean => {
        let validOpHours = false;
        const today = new Date();
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const getOpHours = (opHours: any, key: string) => {
            const time = new Date();
            time.setHours(opHours[key].Hours);
            time.setMinutes(opHours[key].Minutes);
            time.setSeconds(opHours[key].Seconds);
            return time;
        };
        operatingHours.forEach((opHours) => {
            if (weekdays.indexOf(opHours.Day) === today.getDay()) {
                const startTime = getOpHours(opHours, 'StartTime');
                const endTime = getOpHours(opHours, 'EndTime');
                if (startTime.getTime() <= today.getTime()) {
                    if (endTime.getTime() >= today.getTime()) {
                        validOpHours = true;
                    }
                }
            }
        });
        return validOpHours;
    };

    // [Chirag Aug 1, 22'] - Check if current time is a holiday
    isWorkingDay = (holidays: any[]): boolean => {

        // get current date and time
        const today = new Date();
        const getOpHours = (opHours: any, key: string) => {
            const time = new Date();
            time.setHours(opHours[key].Hours);
            time.setMinutes(opHours[key].Minutes);
            time.setSeconds(opHours[key].Seconds);
            return time;
        };

        // check if current time is holiday
        for (let i in holidays) {
            const startTime = getOpHours(holidays[i], 'StartTime');
            const endTime = getOpHours(holidays[i], 'EndTime');
            if (startTime.getTime() <= today.getTime()) {
                if (endTime.getTime() >= today.getTime()) {
                    return false;
                }
            }
        }
        return true;
    };

    /**
     * Reloads Agent list
     */
    reloadAgentList(): void {
        this.loading += 1;
        SDKClient.getAgentListStaffed({
            agentId: true,
            byTeam: this._dialogData.Agent.TeamFilter ?? false,
            type: ''
        })
            .then((res) => {
                this.mapAgents(res);
                this.table.source.data = this.switcherList['Agent List'].data;
            })
            .catch((e) => {
                console.error(e);
                this.loading -= 1;
                console.error(e);
                this._appUIService.showSnackbar('Error in loading agent list', 'failure');
            })
            .finally(() => {
                this.loading -= 1;
            });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }

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
                // check which filter should be applied based on this.activeSwitcher
                this.table.source.filter = JSON.stringify({ searchKey: key, skill: this.selectedSkill });
            });
    }

    /**
     * To make call to a number
     */
    private makeCall(): void {
        this.loading += 1;
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        const dialTo = freeTextConf.active ? freeTextConf.value : this.selectedItem;
        SDKClient.makeCall({
            interactionId: this.interactionId.toString(),
            number: dialTo,
            source: '',
            sourceId: ''
        })
            .then((dt) => {
                this.loading -= 1;
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
                this.loading -= 1;
                // make call error
                this._appUIService.showSnackbar('Make call initiated error, please try again', 'failure');
            });
    }

    /**
     * To transfer a call
     */
    private async transferCall(): Promise<void> {
        this.loading += 1;
        try {
            // init response
            let result: IResponseData<CommandResultEvent>;
            const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
            const transferTo = freeTextConf.active ? freeTextConf.value : this.selectedItem;

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
        this.loading -= 1;
    }

    /**
     * To transfer a call
     */
    private async conferenceCall(): Promise<void> {
        this.loading += 1;

        try {
            const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
            const conferenceTo = freeTextConf.active ? freeTextConf.value : this.selectedItem;

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
        this.loading -= 1;
    }

    /**
     * To transfer/conference a chat to agent/skill
     */
    private transferConferenceChat(): void {
        this.loading += 1;
        const type = this._dialogData.OtherData.type === 'conf' ? 'conference' : this._dialogData.OtherData.type;
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        // agent transfer/conf
        if (this.selectedRow?.type === 'Agent List') {
            // if consault transfer/conf
            if (this.isConsult) {
                SDKClient.sendTextChatTransferNotification({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    otherData: JSON.stringify({
                        type: this._dialogData.OtherData.type,
                        mode: this._dialogData.OtherData.mode
                    }),
                    // uncomment this when freetext available for agent
                    // toAgentId: freeTextConf.active ? freeTextConf.value : this.selectedItem,
                    toAgentId: this.selectedItem,
                    toTmacServer: this.selectedRow.row.TmacServer
                })
                    .then((dt) => {
                        this.loading -= 1;
                        if (dt.response.ResultCode >= 0) {
                            this._appUIService.showSnackbar(`Chat ${type} notification sent to remote agent, Please wait for response.`);
                        } else {
                            this._appUIService.showSnackbar(dt.response.ResultMessage, 'failure');
                        }
                    })
                    .catch(() => {
                        this.loading -= 1;
                        this._appUIService.showSnackbar(`Chat ${type} notification failed, please try again`, 'failure');
                    });
            }
            // blind transfer/confks
            else {
                SDKClient.transferTextChat({
                    chatMode: this._dialogData.OtherData.mode,
                    comment: this.comments,
                    conferenceType: this._dialogData.OtherData.type,
                    interactionId: this.interactionId.toString(),
                    lineId: this._dialogData.OtherData.lineId,
                    sessionId: this._dialogData.OtherData.sessionId,
                    toAgentId: freeTextConf.active ? freeTextConf.value : this.selectedItem,
                    toTmacServer: this.selectedRow.row.TmacServer
                })
                    .then((dt) => {
                        this.loading -= 1;
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
                        this.loading -= 1;
                        this._appUIService.showSnackbar(`Chat ${type} error, please try again`, 'failure');
                    });
            }
        }
        // skill transfer/conf
        else if (this.selectedRow?.type === 'Skill List' || freeTextConf.active) {
            this.loading -= 1;
            SDKClient.transferTextChatToQueue({
                chatMode: this._dialogData.OtherData.mode,
                interactionId: this.interactionId.toString(),
                isBlind: true,
                skillId: freeTextConf.active ? freeTextConf.value : this.selectedItem
            })
                .then((dt) => {
                    this.loading -= 1;
                    if (dt.response.ResultCode >= 0) {
                        this.close(true);
                    } else {
                        this._appUIService.showSnackbar(`Chat ${type} to queue failed, ${dt.response.ResultMessage}`, 'failure');
                    }
                })
                .catch(() => {
                    this.loading -= 1;
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
        this.loading += 1;
        const emails: any[] = this._dialogData.OtherData.emails;
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        const transferTo = freeTextConf.active ? freeTextConf.value : this.selectedItem;

        // SDKClient.transferEmailToAgent used when transfer is either from Agent List or Speed Dial
        if (this.selectedRow?.type !== 'Skill List') {
            emails.forEach((email) => {
                const { RouteId, SessionId } = email;
                SDKClient.transferEmailToAgent({
                    routeId: RouteId,
                    sessionId: SessionId,
                    toAgentId: transferTo
                })
                    .then((res) => {
                        this.loading -= 1;
                        if (res.response > 0) {
                            this._appUIService.showSnackbar(`Email transferred to ${transferTo} successfully`, 'success');
                            this.close(true);
                        } else if ([-2, -3].includes(res.response)) {
                            console.error(res);
                            this._appUIService.showSnackbar(`Agent ${this.selectedRow.row.AgentName} is not in valid state`, 'failure');
                        } else {
                            console.error(res);
                            this._appUIService.showSnackbar(`Email transfer failed`, 'failure');
                        }
                    })
                    .catch((err) => {
                        this.loading -= 1;
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
                        this.loading -= 1;
                        if (res.response > 0) {
                            this._appUIService.showSnackbar(`Email transferred to ${transferTo} successfully`, 'success');
                            this.close(true);
                        } else {
                            console.error(res);
                            this._appUIService.showSnackbar('Email transfer failed', 'failure');
                        }
                    })
                    .catch((err) => {
                        this.loading -= 1;
                        console.error(err);
                        this._appUIService.showSnackbar('Error in email transfer', 'failure');
                    });
            });
        }
    }

    /**
     * Switch tab
     * @param {ITab} tab
     */
    async switchTab(tab: ITab): Promise<void> {
        this.table.clearSelected();
        this.clearSelected();

        // terminate if any work going on
        this.worker?.terminate();
        // set the switcher and get data
        this.activeSwitcher = tab;
        await this.presetData(tab);
        // get the switcher
        const switcher = this.switcherList[this.activeSwitcher];

        // no data found
        if (!switcher?.data) {
            return;
        }

        // get the current tab data
        let data = [...switcher.data];
        // initial data load limit
        const initLimit = 15;
        // check if we need to append data lazyly
        const lazyLoad = data.length > initLimit;
        // if lazy then load only initLimit data else load all
        this.table.source.data = lazyLoad ? data.splice(0, initLimit) : data;

        if (lazyLoad) {
            // create a web worker to get load to table data asynchronously
            this.worker = new InlineWorker(() => {
                // @ts-ignore as this is from DedicatedWorkerGlobalScope (because of that we have postMessage and onmessage methods)
                this.onmessage = (evt: MessageEvent) => {
                    // @ts-ignore
                    this.postMessage(evt.data);
                };
            });

            // on message from web worker
            this.worker.onmessage().subscribe((evt: MessageEvent) => {
                // destructure the event data
                const { data, dataSet, limit } = evt.data;
                // get the current data
                const curr = this.table.source.data;
                // append the current and received data to table data source
                this.table.source.data = [...curr, ...data];
                // check if the limit reached
                if (!dataSet || !dataSet.length) {
                    // terminate worker
                    this.worker.terminate();
                } else {
                    // repeat the same process until the limit
                    this.handleDataInWebWorker(dataSet, limit);
                }
            });

            // handle worker error
            this.worker.onerror().subscribe((error: ErrorEvent) => {
                console.error(error);
            });

            // send post message to web worker with the data and load table data source asynchronously
            this.handleDataInWebWorker(data, initLimit);
        }

        this.table.hidePageSize = true;
        this.table.sortBy = switcher.sortBy;
        this.table.sortDirection = switcher.sortDir;
        this.table.config = switcher.table.config;
        this.table.columns = switcher.table.columns;

        this.searchKey.setValue('');

        // clear all filter
        this.clearAllFilter();
    }

    /**
     * Handle table data
     * @param {any} dataSet
     * @param {Number} limit
     */
    private handleDataInWebWorker(dataSet: any, limit: number) {
        // send post message to web worker with the data and load table data source asynchronously
        this.worker.postMessage({ data: dataSet.splice(0, limit), dataSet, limit });
    }

    /**
     * Filter predicate for rows
     * @param {AgentModel} row
     * @param {String} filterStr
     */
    filterPredicate = (row: AgentModel, filterStr: string): boolean => {
        if (this.table.source.data.length > 0) {
            if (filterStr === '{}') {
                return true;
            }
            const filters = JSON.parse(filterStr);
            switch (this.activeSwitcher) {
                case 'Agent List': {
                    return this.filterAgentList(row, filters);
                }
                default: {
                    const re = new RegExp(filters.searchKey, 'i');
                    return !!JSON.stringify(row).match(re);
                }
            }
        }
    };

    /**
     * Filters agent list based on selected skill and optional search key
     * @param {AgentModel} row
     * @param {any} filters
     * @returns
     */
    filterAgentList = (row: AgentModel, filters: any): boolean => {
        if (filters.searchKey && !filters.Skill) {
            const searchRe = new RegExp(filters.searchKey, 'i');
            return !!JSON.stringify(row).match(searchRe);
        } else if (!filters.searchKey && filters.Skill) {
            const skillRe = new RegExp(filters.Skill, 'i');
            return !!row.AgentVoiceSkillsAsString.match(skillRe);
        } else {
            const searchRe = new RegExp(filters.searchKey, 'i');
            const skillRe = new RegExp(filters.Skill, 'i');
            return !!(JSON.stringify(row).match(searchRe) && row.AgentVoiceSkillsAsString.match(skillRe));
        }
    };

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
        this.selectedSkill = '';
    }

    /**
     * Clears displayed value for skill / agent
     */
    clearDisplayValues(): void {
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        this.selectedItemDisplayName = '';
        freeTextConf.value = '';
    }

    /**
     * To clear selected item
     */
    clearSelected(): void {
        this.selectedItem = '';
        this.clearDisplayValues();
    }

    /**
     * Load speed dial table
     */
    loadSpeedDial(): void {
        SDKClient.getSpeedDialNumbers(this._dialogData?.SpeedDial?.TeamFilter)
            .then((res) => {
                this.switcherList[this.activeSwitcher].data = res.response;
            })
            .catch((e) => {
                console.error(e);
                this._appUIService.showSnackbar('Error in loading speed dial', 'failure');
            });
    }

    /**
     * To process agent selected from list
     */
    selectAgent = async (row: AgentModel): Promise<void> => {
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        if (this.loading) {
            return;
        }
        this.clearSelected();
        freeTextConf.active = false;
        this.loading += 1;
        const currentStatus = row.CurrentAgentStatus;
        row.CurrentAgentStatus = 'loading';
        row.AgentName = row.FirstName + ' ' + row.LastName;
        // get agent's current status
        const dt = await SDKClient.getAgentStatus({
            agentId: row.LoginID,
            deviceId: row.StationID,
            tmacServer: row.TmacServer
        })
            .catch((e) => {
                console.error(e);
                this._appUIService.showSnackbar(`Error in getting agent ${row.AgentName}'s current state`, 'failure');
            })
            .finally(() => {
                this.loading -= 1;
                row.CurrentAgentStatus = currentStatus;
            });
        if (!dt || !dt.response) {
            this._appUIService.showSnackbar(`Agent '${row.AgentName}' has logged out`, 'failure');
            return;
        }
        // get the allowed state list
        const allowedStates = this._dialogData?.Agent.AllowedStates || [];
        // source to select
        const source = this._dialogData?.Agent.Source || 'agentId';
        // change the status
        row.CurrentAgentStatus = dt.response.ResultMessage;
        // get the new state
        const state = dt.response.ResultMessage;
        if (allowedStates.length === 0 || (allowedStates.length > 0 && allowedStates.includes(state))) {
            // select the row in grid
            if (typeof source === 'object') {
                // assign the selected item
                this.selectedItem = source.Use === 'agentId' ? row.LoginID : row.StationID;
                const nameAliasMap = {
                    agentName: '${FirstName} ${LastName}',
                    station: '${StationID}',
                    agentId: '${LoginID}'
                };
                const nameToBeDisplayed = nameAliasMap[source.Display || 'agentName'] || source.Display;
                this.selectedItemDisplayName = setStringVars(nameToBeDisplayed, row) || (row as any).AgentID;
            } else {
                // assign the selected item
                this.selectedItem = source === 'agentId' ? row.LoginID : row.StationID;
                this.selectedItemDisplayName = this.selectedItem;
            }
            // assign the selected row
            this.selectedRow = { type: 'Agent List', row };
        } else {
            this._appUIService.showSnackbar(`Agent ${row.AgentName} is not in valid state`, 'failure');
        }
    };

    /**
     * Selects speed dial contact
     * @param {SpeedDialModel} row
     */
    selectSpeedDial = (row: SpeedDialModel): void => {
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        this.clearSelected();
        freeTextConf.active = false;
        const source = this._dialogData?.SpeedDial.Source || 'Name';
        if (typeof source === 'object') {
            // assign the selected item
            this.selectedItem = source.Use === 'Number' ? row.Number : row.Name;
            if (getStringVars(source.Display)) {
                this.selectedItemDisplayName = setStringVars(source.Display, row);
            } else {
                this.selectedItemDisplayName = row[source.Display];
            }
        } else {
            // assign the selected item
            this.selectedItem = source === 'Name' ? row.Name : row.Number;
            this.selectedItemDisplayName = this.selectedItem;
        }
        // assign the selected row
        this.selectedRow = { type: 'Speed Dial', row };
    };

    /**
     * To process skill selected from list
     */
    selectSkill = (row: ISkillType): void => {
        // if already loading then return
        if (this.loading) {
            return;
        }
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        // clear the selection
        this.clearSelected();
        freeTextConf.active = false;
        // this.selectedItem = '';
        // this.SkillListTable.tableData.selection.clear();
        // this.clearDisplayValues();
        this.loading += 1;
        row.Stf = 'loading';
        row.Avl = 'loading';
        row.CIQ = 'loading';
        // get queue status from server
        SDKClient.getQueueStatus(row.ID)
            .then((dt) => {
                this.loading -= 1;
                // source to select
                const source = this._dialogData.Skill.Source || 'skill';
                // check the response is proper
                if (dt.response.EventName === 'QueueStatusEvent') {
                    // cast the response
                    dt.response = dt.response as QueueStatusEvent;
                    const { AgentsStaffed: STF, AgentAvailable: AVL, CallsInQueue: CIQ } = dt.response.Skill;
                    // assign the values
                    row.Stf = STF.toString();
                    row.Avl = AVL.toString();
                    row.CIQ = CIQ.toString();

                    const rules = this._dialogData.Skill.Rules;

                    // check if rules check is enabled
                    if (rules.Enabled) {
                        if (rules.STF.Enabled) {
                            if (rules.STF.Min > -1 && !(STF >= rules.STF.Min)) {
                                return this.skillSelecteFailed(`Unabled to select the skill, Minimum Staffed Agents should be ${rules.STF.Min}`);
                            }

                            if (rules.STF.Max > -1 && !(STF <= rules.STF.Max)) {
                                return this.skillSelecteFailed(`Unabled to select the skill, Maximum Staffed Agents should be ${rules.STF.Max}`);
                            }
                        }

                        if (rules.AVL.Enabled) {
                            if (rules.AVL.Min > -1 && !(AVL >= rules.AVL.Min)) {
                                return this.skillSelecteFailed(`Unabled to select the skill, Minimum Available Agents should be ${rules.AVL.Min}`);
                            }

                            if (rules.AVL.Max > -1 && !(AVL <= rules.AVL.Max)) {
                                return this.skillSelecteFailed(`Unabled to select the skill, Maximum Available Agents should be ${rules.AVL.Max}`);
                            }
                        }

                        if (rules.CIQ.Enabled) {
                            if (rules.CIQ.Min > -1 && !(CIQ >= rules.CIQ.Min)) {
                                return this.skillSelecteFailed(`Unabled to select the skill, Minimum Calls In Queue should be ${rules.CIQ.Min}`);
                            }

                            if (rules.CIQ.Max > -1 && !(CIQ <= rules.CIQ.Max)) {
                                return this.skillSelecteFailed(`Unabled to select the skill, Maximum Calls In Queue should be ${rules.CIQ.Max}`);
                            }
                        }
                    }

                    // select the row in grid
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
                        this.selectedItemDisplayName = this.selectedItem;
                    }
                    // assign the selected row
                    this.selectedRow = { type: 'Skill List', row };
                } else {
                    this._appUIService.showSnackbar(`Failed to get skill ${row.ID} status`, 'failure');
                    row.Stf = 'NA';
                    row.Avl = 'NA';
                    row.CIQ = 'NA';
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar(`Error in getting skill ${row.ID} status`, 'failure');
                row.Stf = 'NA';
                row.Avl = 'NA';
                row.CIQ = 'NA';
                this.loading -= 1;
            });
    };

    skillSelecteFailed(message: string) {
        this._appUIService.showSnackbar(message, 'failure');
        this.clearSelected();
        this.table.clearSelected();
    }

    /**
     * To process dynamic selected from list
     */
    selectDynamic(row: any, selectionKey: string): void {
        // assign the selected item
        this.selectedItemDisplayName = this.selectedItem = row[selectionKey];
        // assign the selected row
        this.selectedRow = {
            type: this.activeSwitcher,
            row: row
        };
    }

    /**
     * To check for number only
     * @param event Input event
     */
    numberOnly(event: any): boolean {
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
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        // check if the selected tab is dynamic, then close the dynamicList widget should handle the action
        if (!freeTextConf.active && !PRESET_TABLES.includes(this.selectedRow.type as ITab)) {
            this.close(true);
            return;
        }

        // check the type if not dynamic list selection
        const type = this._dialogData?.Type || '';
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
     * Searches agents based on skill
     */
    searchAgentsOnSkill(): void {
        // check which filter should be applied based on this.activeSwitcher
        this.table.source.filter = JSON.stringify({ skill: this.selectedSkill });
        // this.table.doAdvancedSearch();
    }

    /**
     * To close the parent wrapper component
     *
     * @param {any} data
     */
    close(success: boolean): void {
        // call the callback
        if (typeof this._dialogData.Callback === 'function') {
            this._dialogData.Callback({
                source: this.selectedRow?.type,
                selectedRow: this.selectedRow?.row,
                isConsult: this.isConsult,
                success
            });
        }
        this.wrapperComponent.close();
    }
}
