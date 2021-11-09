import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
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
import { AgentSkillListData, AgentSkillListSourceObject } from 'app/interfaces';
import { formatJsonData } from 'app/utils';
import { orderBy } from 'lodash';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
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
};
type ITab = 'Agent List' | 'Skill List' | 'Speed Dial';
type ISkillType = Partial<FavouriteSkill>;
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
     * Mat table sort
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    /**
     * Grid list switcher
     */
    switcherList: Record<ITab | string, ISwitch> = {};
    /**
     * Active switcher
     */
    activeSwitcher: ITab | string;
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
        type: ITab | string;
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
        this.title = this._dialogData?.title || 'Agent Skill List';
        this.interactionId = this._dialogData?.interactionId ?? 0;

        const setActiveSwitcher = (tab: ITab) => {
            if (!this.activeSwitcher) {
                this.activeSwitcher = tab;
            }
        };

        if (this._dialogData?.agent && this._dialogData?.agent.allowed) {
            const table = {
                config: {
                    FirstName: { searchable: true, title: 'First Name' },
                    LastName: { searchable: true, title: 'Last Name' },
                    AgentID: { searchable: true, title: 'ID' },
                    CurrentAgentStatus: { searchable: true, title: 'Status' }
                }
            };
            const columns =
                this._dialogData.agent.columns && this._dialogData.agent.columns.length ? this._dialogData.agent.columns : Object.keys(table.config);
            const conf: ISwitch = {
                placeholder: 'Agent',
                freeText: { allowed: !!(this._dialogData?.agent.source as AgentSkillListSourceObject)?.FreeTextAllowed, active: false, value: '' },
                table: Object.assign(table, { columns }),
                data: [],
                onSelect: this.selectAgent
            };
            this.switcherList['Agent List'] = Object.assign(conf, this._dialogData?.agent);
            setActiveSwitcher('Agent List');
        }

        if (this._dialogData?.skill && this._dialogData?.skill.allowed) {
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
                this._dialogData.skill.columns && this._dialogData.skill.columns.length ? this._dialogData.skill.columns : Object.keys(table.config);
            const conf: ISwitch = {
                placeholder: 'Skill/VDN',
                freeText: { allowed: !!(this._dialogData?.skill.source as AgentSkillListSourceObject)?.FreeTextAllowed, active: false, value: '' },
                table: Object.assign(table, { columns }),
                data: [],
                onSelect: this.selectSkill
            };
            this.switcherList['Skill List'] = Object.assign(conf, this._dialogData?.skill);
            setActiveSwitcher('Skill List');
        }

        if (this._dialogData?.speedDial && this._dialogData?.speedDial.allowed) {
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
                this._dialogData.speedDial.columns && this._dialogData.speedDial.columns.length
                    ? this._dialogData.speedDial.columns
                    : Object.keys(table.config);
            const conf: ISwitch = {
                placeholder: 'Number',
                freeText: {
                    allowed: !!(this._dialogData?.speedDial.source as AgentSkillListSourceObject)?.FreeTextAllowed,
                    active: false,
                    value: ''
                },
                table: Object.assign(table, { columns }),
                data: [],
                onSelect: this.selectSpeedDialContact
            };
            this.switcherList['Speed Dial'] = Object.assign(conf, this._dialogData?.speedDial);
            setActiveSwitcher('Speed Dial');
        }

        if (this._dialogData?.dynamicLists && this._dialogData.dynamicLists.length) {
            this._dialogData?.dynamicLists.forEach((l) => {
                const table: Partial<TableComponent> = {
                    config: l.columns.reduce((acc, curr) => {
                        acc[curr] = { searchable: true };
                        return acc;
                    }, {}),
                    columns: l.columns
                };
                this.switcherList[l.label] = {
                    data: l.data,
                    freeText: {
                        allowed: false,
                        active: false,
                        value: ''
                    },
                    allowed: true,
                    consult: l.consult,
                    blind: l.blind,
                    comments: l.comments,
                    onSelect: (row) => {
                        this.selectDynamic(row, l.selection);
                    },
                    placeholder: l.placeholder,
                    table
                };
            });
        }

        this.setupSearchInputListener();
        const type = this._dialogData?.type || '';

        switch (type) {
            case 'makeCall':
                this.icon = 'add_ic_call';
                this.actionTooltip = 'Call';
                if (this.switcherList['Agent List']) {
                    this.switcherList['Agent List'].placeholder = 'Agent/Station/Number';
                }
                break;
            case 'transferCall':
                this.icon = 'phone_forwarded';
                this.actionTooltip = 'Consult';
                if (this.switcherList['Agent List']) {
                    this.switcherList['Agent List'].placeholder = 'Agent/Station/Number';
                }
                break;
            case 'conferenceCall':
                this.icon = 'group_add';
                this.actionTooltip = 'Consult';
                if (this.switcherList['Agent List']) {
                    this.switcherList['Agent List'].placeholder = 'Agent/Station/Number';
                }
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
    }

    /**
     * After view init lifecycle hook
     */
    async ngAfterViewInit(): Promise<void> {
        // this.switchTab(this.activeSwitcher);
        await this.presetData();
        this.switchTab(this.activeSwitcher);
        this.table.filterPredicate = this.filterPredicate;
    }

    /**
     * Initializes tables
     */
    private async presetData(): Promise<void> {
        const err = (e: Error, msg: string) => {
            this._appUIService.showSnackbar(msg, 'failure');
            console.error(e);
            this.loading -= 1;
        };
        // check if agent allowed then load agent list
        if (this._dialogData?.agent.allowed) {
            this.loading += 1;
            await Promise.all([
                SDKClient.getAgentListStaffed({
                    agentId: true,
                    byTeam: this._dialogData.agent.teamFilter ?? false,
                    type: ''
                }),
                SDKClient.getTmacWallboardSkills()
            ])
                .then((res) => {
                    this.mapAgents(res[0]);
                    this.mapSkills(res[1]);
                    this.initTables().agent();
                })
                .catch((e) => err(e, 'Error loading Agents'))
                .finally(() => (this.loading -= 1));
        }
        if (this._dialogData?.skill.allowed) {
            this.loading += 1;
            await SDKClient.getFavouriteSkills()
                .then((res) => {
                    this.mapFavSkills(res);
                    this.initTables().skill();
                })
                .catch((e) => err(e, 'Error loading Skills'))
                .finally(() => (this.loading -= 1));
        }
        if (this._dialogData?.speedDial?.allowed) {
            this.loading += 1;
            await SDKClient.getSpeedDialNumbers(this._dialogData.speedDial.teamFilter)
                .then((res) => {
                    this.mapSpeedDial(res);
                    this.initTables().speedDial();
                })
                .catch((e) => err(e, 'Error loading Speed Dials'))
                .finally(() => (this.loading -= 1));
        }
    }

    private initTables = () => ({
        agent: () => {
            if (this._dialogData.agent.columns && this._dialogData.agent.columns.length) {
                this.table.columns = this._dialogData.agent.columns;
            }
        },
        skill: () => {
            if (this._dialogData.skill.columns && this._dialogData.skill.columns.length) {
                this.table.columns = this._dialogData.skill.columns;
            }
        },
        speedDial: () => {
            if (this._dialogData.speedDial.columns && this._dialogData.speedDial.columns.length) {
                this.table.columns = this._dialogData.speedDial.columns;
            }
        }
    });

    /**
     * Maps Agent list response
     * @param {IResponseData<AgentModel[]>} res
     */
    private mapAgents = (res: IResponseData<AgentModel[]>): void => {
        if (res.response.length > 0) {
            const currentAgentID = SDKClient.getAgentData().agentId;
            // filter the same agent and bots from the list
            const list = res.response
                .filter((r: AgentModel) => r.LoginID !== currentAgentID && r.AccessRole?.toLowerCase() !== 'chatbot')
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
            this.switcherList['Agent List'].data = list;
        }
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
        if (res.response.length > 0) {
            // check the prefix list
            const channelPrefix = this._dialogData?.skill.channelPrfix || [];

            // Filtering skills based on
            // 1. The prefix passed in Config
            // 2. Operating hours
            this.switcherList['Skill List'].data = (res.response as ISkillType[]).reduce((acc, skill) => {
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
                        valid.opHours = this.isValidOperationHours(skill.OperatingHours);
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
        }
    };

    /**
     * Maps Skill list response
     * @param {IResponseData<SpeedDialModel[]>} res
     */
    private mapSpeedDial = (res: IResponseData<SpeedDialModel[]>): void => {
        // Filtering skills based on Operation hours
        this.switcherList['Speed Dial'].data = (res.response as ISkillType[]).reduce((acc, sDial) => {
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

    /**
     * Reloads Agent list
     */
    reloadAgentList(): void {
        this.loading += 1;
        SDKClient.getAgentListStaffed({
            agentId: true,
            byTeam: this._dialogData.agent.teamFilter ?? false,
            type: ''
        })
            .then((res) => this.mapAgents(res))
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
                // check which filter should be applied based on this.activeSwitcher
                this.table.source.filter = JSON.stringify({ searchKey: key, skill: this.selectedSkill });
                this.table.doAdvancedSearch();
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
        const type = this._dialogData.otherData.type === 'conf' ? 'conference' : this._dialogData.otherData.type;
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        // agent transfer/conf
        if (this.selectedRow?.type === 'Agent List') {
            // if consault transfer/conf
            if (this.isConsult) {
                SDKClient.sendTextChatTransferNotification({
                    comment: this.comments,
                    interactionId: this.interactionId.toString(),
                    otherData: JSON.stringify({
                        type: this._dialogData.otherData.type,
                        mode: this._dialogData.otherData.mode
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
                    chatMode: this._dialogData.otherData.mode,
                    comment: this.comments,
                    conferenceType: this._dialogData.otherData.type,
                    interactionId: this.interactionId.toString(),
                    lineId: this._dialogData.otherData.lineId,
                    sessionId: this._dialogData.otherData.sessionId,
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
                chatMode: this._dialogData.otherData.mode,
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
        const emails: any[] = this._dialogData.otherData.emails;
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        const transferTo = freeTextConf.active ? freeTextConf.value : this.selectedItem;

        // agent transfer/conf
        if (this.selectedRow?.type === 'Speed Dial') {
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

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------\

    /**
     * Switch tab
     * @param item
     */
    switchTab(tab: string): void {
        // this.table.source.data = [];
        this.activeSwitcher = tab;
        this.table.source.data = this.switcherList[this.activeSwitcher].data;
        this.table.config = this.switcherList[this.activeSwitcher].table.config;
        this.table.columns = this.switcherList[this.activeSwitcher].table.columns;

        this.searchKey.setValue('');
        // assign active switcher
        // clear the selection
        this.selectedItem = '';

        this.clearSelected();
        // clear all filter
        this.clearAllFilter();
    }

    /**
     * Filter predicate for rows
     * @param {any} row
     * @param {string} filterStr
     * @returns {boolean}
     */
    filterPredicate = (row: AgentModel, filterStr: string): boolean => {
        console.log(row, filterStr);
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
                    return JSON.stringify(row).toLowerCase().includes(filters.searchKey.toLowerCase());
                }
            }
        }
    };

    /**
     * Filters agent list based on selected skill and optional search key
     * @param {String} searchKey
     */
    filterAgentList = (row: AgentModel, filters: any): boolean => {
        if (filters.searchKey && !filters.skill) {
            return JSON.stringify(row).toLowerCase().includes(filters.searchKey.toLowerCase());
        } else if (!filters.searchKey && filters.skill) {
            return row.AgentVoiceSkillsAsString.toLowerCase().includes(filters.skill.toLowerCase());
        } else {
            return (
                JSON.stringify(row).toLowerCase().includes(filters.searchKey.toLowerCase()) &&
                row.AgentVoiceSkillsAsString.toLowerCase().includes(filters.skill.toLowerCase())
            );
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
        SDKClient.getSpeedDialNumbers(this._dialogData?.speedDial?.teamFilter)
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
        const allowedStates = this._dialogData?.agent.allowedStates || [];
        // source to select
        const source = this._dialogData?.agent.source || 'agentId';
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
    selectSpeedDialContact = (row: SpeedDialModel): void => {
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        this.clearSelected();
        freeTextConf.active = false;
        const source = this._dialogData?.speedDial.source || 'Name';
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
    selectSkill = (row: FavouriteSkill): void => {
        // if already loading then return
        if (this.loading) {
            return;
        }
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        // clear the selection
        this.clearSelected();
        freeTextConf.active = false;
        // this.selectedItem = '';
        // this.skillListTable.tableData.selection.clear();
        // this.clearDisplayValues();
        this.loading += 1;
        row.Staff = 'loading';
        row.Avail = 'loading';
        row.CIQ = 'loading';
        // get queue status from server
        SDKClient.getQueueStatus(row.ID)
            .then((dt) => {
                this.loading -= 1;
                // source to select
                const source = this._dialogData?.skill.source || 'skill';
                // check the response is proper
                if (dt.response.EventName === 'QueueStatusEvent') {
                    // cast the response
                    dt.response = dt.response as QueueStatusEvent;
                    // assign the values
                    row.Staff = dt.response.Skill.AgentsStaffed.toString();
                    row.Avail = dt.response.Skill.AgentAvailable.toString();
                    row.CIQ = dt.response.Skill.CallsInQueue.toString();
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
                    }
                    // assign the selected row
                    this.selectedRow = { type: 'Skill List', row };
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
                this.loading -= 1;
            });
    };
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
        const freeTextConf = this.switcherList[this.activeSwitcher].freeText;
        // check if the selected tab is dynamic, then close the dynamicList widget should handle the action
        if (!freeTextConf.active && !PRESET_TABLES.includes(this.selectedRow.type as ITab)) {
            this.close(true);
            return;
        }

        // check the type if not dynamic list selection
        const type = this._dialogData?.type || '';
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
        if (typeof this._dialogData.callback === 'function') {
            this._dialogData.callback({
                source: this.selectedRow?.type,
                selectedRow: this.selectedRow?.row,
                isConsult: this.isConsult,
                success
            });
        }
        this.wrapperComponent.close();
    }
}
