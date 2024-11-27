import { AgentSkillListData } from '@ad/types';
import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { AgentSkillListComponent } from '@modules/shared/components';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { IAgentData, SDKClient } from '@tmac/sdk';
import { IWidget } from 'app/interfaces';
import { AgentSkillListDataModel } from 'app/models';
import { formatJsonData } from 'app/utils';
import { groupBy, sortBy } from 'lodash';
import moment from 'moment';
import { Subscription, timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
type ApiCalls = 'search' | 'pull' | 'push';
type CallStates = 'loading' | 'error' | 'initial' | 'completed';

/**
 * Workbench Chat
 */
@Component({
    selector: 'workbench-chat',
    templateUrl: './workbench-chat.component.html',
    styleUrls: ['./workbench-chat.component.scss']
})
export class WorkbenchChatComponent extends TWidgetWrapper implements OnInit, AfterViewInit, OnDestroy {
    /**
     * holds all the data related to the parent tw workbecnh widget from the config
     */
    @Input() data: IWidgetWb;

    /**
     * holds all the data related to this workbench tab
     */
    @Input() channelConf: any;

    /**
     * Fetched Queued Chats observable
     */
    queuedChats: any[];

    /**
     * Advanced search visibility
     */
    showAdvancedSearchForm = false;

    /**
     * Current user data
     */
    user: IAgentData;

    /**
     * Polling Subscription
     */
    polling$: Subscription;

    /**
     * Tree Controls
     */
    treeControl = new NestedTreeControl<any>((node) => node.children);

    /**
     * Tree Data source
     */
    dataSource = new MatTreeNestedDataSource<any>();

    /**
     * Advanced Search form control
     */
    advancedSearchForm: FormGroup;

    /**
     * To store the fuse config for theme
     */
    // fuseConfig: FuseConfig;

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * Api Call states
     */
    callStates: Record<ApiCalls, CallStates> = {
        pull: 'initial',
        push: 'initial',
        search: 'loading'
    };

    /**
     * Global search form control
     */
    globalSearchControl = new FormControl('');

    /**
     * Selected skill's unique key
     */
    selectedSkill = '';

    /**
     * Chats cards ref
     */
    @ViewChild('chatsRef')
    chatsRef: ElementRef<HTMLDivElement>;

    /**
     * Chat workbech main ref
     */
    @ViewChild('chatWorkBench')
    chatWorkBench: ElementRef<HTMLDivElement>;

    constructor(
        private http: HttpClient,
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private _appUiService: AppUiService,
        private _matDialog: MatDialog,
        private translocoService: TranslocoService
    ) {
        super('WorkbenchChatComponent');
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        this.advancedSearchForm = new FormGroup({
            skills: new FormControl(''),
            agent: new FormControl(''),
            fromDate: new FormControl(yesterday),
            fromTime: new FormControl(`00:00`),
            toDate: new FormControl(today),
            toTime: new FormControl(`${'23'}:${'59'}`)
        });
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
        //     this.fuseConfig = config;
        // });

        this.user = SDKClient.getAgentData();
    }

    /**
     * After View Init
     */
    ngAfterViewInit(): void {
        // create an intersection observer to start/stop polling when page is active/inactive
        const observer = new IntersectionObserver((entries) => {
            entries.map((entry) => {
                if (entry.isIntersecting) {
                    this.startPolling();
                } else {
                    this.stopPolling();
                }
            });
        });
        // observe the element
        observer.observe(this.chatWorkBench.nativeElement);
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        this.polling$?.unsubscribe();
    }

    /**
     * To start polling
     */
    private startPolling(): void {
        this.polling$ = timer(0, this.channelConf.Config.SearchPollingInterval || 5000).subscribe(() => {
            this.doAdvancedSearch();
        });
    }

    /**
     * To stop polling
     */
    private stopPolling(): void {
        this.polling$?.unsubscribe();
    }

    /**
     * Does Advance search and Gets Queued Chats
     */
    doAdvancedSearch(searchParams?: any): void {
        try {
            const searchFields = searchParams || this.advancedSearchForm.value;
            const { agentId } = this.user;

            let startDate: any = '';
            let endDate: any = '';

            if (searchFields.fromDate) {
                startDate = new Date(searchFields.fromDate);
                startDate.setHours(searchFields.fromTime?.split(':')[0] || '00');
                startDate.setMinutes(searchFields.fromTime?.split(':')[1] || '00');
                startDate.setSeconds(0);
                startDate = moment(startDate).format('YYYYMMDDHHmmss');
            }

            if (searchFields.toDate) {
                endDate = new Date(searchFields.toDate);
                endDate.setHours(searchFields.toTime?.split(':')[0] || '00');
                endDate.setMinutes(searchFields.toTime?.split(':')[1] || '00');
                endDate.setSeconds(0);
                endDate = moment(endDate).format('YYYYMMDDHHmmss');
            }

            this.callStates.search = 'loading';

            this.http
                .post<any[]>(this.data.Data.WorkbenchUrl + '/chat/queue/search', {
                    skills: searchFields.skills ? [searchFields.skills] : [],
                    agent: '',
                    startDate,
                    endDate
                })
                .subscribe((res: any) => {
                    if (!res || res.status !== 'SUCCESS') {
                        this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.advanceSearchFailed'), 'failure');
                        return;
                    }
                    this.queuedChats = res.result;
                    // if (res.result.length === 0) {
                    //     this.queuedChats = Array(10).fill(temp);
                    // }
                    this.queuedChats = this.queuedChats.map((x, i) => ({
                        ...formatJsonData(
                            { ...x, data: JSON.parse(x.data) },
                            {
                                name: ['data', 'pName'],
                                intent: ['data', 'pIntent'],
                                customerName: ['data', 'customerName'],
                                channel: 'channel',
                                skillId: 'skillId',
                                itemID: 'itemID',
                                addedTime: 'addedTime',
                                'display.Skill': 'skillId',
                                'display.Created By': ['data', 'customerName'],
                                'display.Sub-Channel': 'subChannel',
                                'display.Name': ['data', 'customerName'],
                                'display.Mobile No': ['data', 'mobile'],
                                'display.Session ID': ['data', 'sessionID'],
                                'display.Agent Id': '',
                                'display.User Id': '',
                                'display.Gender': '',
                                'display.Nationality': '',
                                'display.Language': ''
                            }
                        ),
                        uiKey: `ui_${i}`
                    }));
                    const nodesByChannel = groupBy(this.queuedChats, 'channel');
                    this.dataSource.data = Object.keys(nodesByChannel).map((name) => {
                        const nodesBySkillId = groupBy(nodesByChannel[name], 'skillId');
                        return {
                            name,
                            children: nodesByChannel[name].map((x) => {
                                const grandChildren = sortBy(nodesBySkillId[x.skillId], 'addedTime');
                                return {
                                    ...x,
                                    grandChildren: grandChildren,
                                    oldestSince: new Date(grandChildren[0].addedTime)
                                };
                            })
                        };
                    });
                });
        } catch (e) {
            console.error(e);
            this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.advanceSearchFailed'), 'failure');
        }
    }

    /**
     * Does a global search
     */
    doGlobalSearch(): void {
        const globalKey = this.globalSearchControl.value;
        const { agentId } = this.user;

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const searchParams = {
            skills: [globalKey],
            agent: '',
            startDate: moment(today).format('YYYYMMDDHHmmss'),
            endDate: moment(yesterday).format('YYYYMMDDHHmmss')
        };
    }

    /**
     * Check if tree node has child
     * @param {number} _
     * @param {any} node
     */
    hasChild = (_: number, node: any) => !!node.children && node.children.length > 0;

    /**
     * selects skill and scrolls to the skill
     * @param node
     */
    selectSkill(node: any): void {
        const element = document.getElementById(node.uiKey);
        this.selectedSkill = node.uiKey;
        if (element) {
            this.chatsRef.nativeElement.scrollTop = element.offsetTop - 50;
        } else {
            console.error('Element not found !!!!');
        }
    }

    /**
     * Pulls email
     * @param {any} node
     */
    pullChat(node: any): void {
        const pullFunc = () => {
            const { tmacServer, agentId } = this.user;
            const { channel, itemID: itemid } = node;
            const snackbarRef = this._appUiService.showSnackbar('Pulling Chat', 'loading');
            this.http
                .post(this.data.Data.WorkbenchUrl + '/chat/queue/pull', {
                    tmacServer,
                    agentId,
                    channel: channel,
                    items: [{ itemid }]
                })
                .subscribe((res: any) => {
                    snackbarRef?.dismiss();
                    if (res && res.status !== 'FAILED') {
                        this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.pullChatSuccess'), 'success');
                        return;
                    }
                    this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.pullChatFailed'), 'failure');
                });
        };
        try {
            if (this.channelConf.Config.AskPullConfirmation) {
                const confirmDialogRef = this._appUiService.showAppConfirmDialog('generic', this.translocoService.translate('widgets.workbench.pullChatConfirmTitle'),this.translocoService.translate('widgets.workbench.pullChatConfirmMsg'));
                confirmDialogRef.afterClosed().subscribe((resp) => {
                    if (resp) {
                        pullFunc();
                    }
                });
            } else {
                pullFunc();
            }
        } catch (e) {
            console.error(e);
            this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.pullChatError'), 'failure');
        }
    }

    /**
     * Pulls email
     * @param {any} node
     */
    pushChat(node: any): void {
        try {
            // const data: AgentSkillListData = {
            //     Title: 'Push Chat',
            //     Type: 'pushChat',
            //     Agent: {
            //         Allowed: true,
            //         Consult: true,
            //         Blind: false,
            //         Comments: false,
            //         Source: 'agentId',
            //         AllowedStates: []
            //     },
            //     Skill: {
            //         Allowed: false,
            //         Consult: false,
            //         Blind: false,
            //         Comments: false,
            //         ChannelPrefix: [],
            //         Source: 'skill'
            //     }
            // };

            // data.Callback = (callbackData) => {
            //     const { TmacServer, LoginID } = callbackData.selectedRow;
            //     const { channel, itemID: itemid } = node;
            //     this._appUiService.showSnackbar('Pushing Chat', 'loading');
            //     this.http
            //         .post(this.data.Data.WorkbenchUrl + '/chat/queue/push', {
            //             tmacServer: TmacServer,
            //             agentId: LoginID,
            //             channel: channel,
            //             items: [{ itemid }]
            //         })
            //         .subscribe((res: any) => {
            //             if (res && res.status !== 'FAILED') {
            //                 this._appUiService.showSnackbar('Chat Pushed successfuly', 'success');
            //                 return;
            //             }
            //             this._appUiService.showSnackbar('Unable to push chat', 'failure');
            //         });
            // };

            // TODD:: add config for push

            let data: AgentSkillListData = new AgentSkillListDataModel('pushChat', 'Push Chat');
            data = {
                ...data,
                Agent: {
                    Allowed: true,
                    Consult: true,
                    Blind: false,
                    Comments: false,
                    Source: 'agentId',
                    AllowedStates: []
                },
                OtherData: node,
                Callback: ({ callbackData }) => {
                    const { TmacServer, LoginID } = callbackData.selectedRow;
                    const { channel, itemID: itemid } = node;
                    const snackbarRef = this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.pushChatLoading'), 'loading');
                    this.http
                        .post(this.data.Data.WorkbenchUrl + '/chat/queue/push', {
                            tmacServer: TmacServer,
                            agentId: LoginID,
                            channel: channel,
                            items: [{ itemid }]
                        })
                        .subscribe((res: any) => {
                            snackbarRef?.dismiss();
                            if (res && res.status !== 'FAILED') {
                                this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.pushChatSuccess'), 'success');
                                return;
                            }
                            this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.pushChatFailed'), 'failure');
                        });
                }
            };

            this._matDialog.open(AgentSkillListComponent, {
                data,
                panelClass: ['agent-skill-dialog', 'twd-w-11/12', 'twd-h-10/12', 'lg:twd-w-7/12', 'lg:twd-h-8/12', 'xl:twd-w-6/12', '2xl:twd-w-5/12'],
                minWidth: '30%',
                maxWidth: '100%',
                disableClose: true
            });
        } catch (e) {
            console.error(e);
            this._appUiService.showSnackbar(this.translocoService.translate('widgets.workbench.pushChatError'), 'failure');
        }
    }

    /**
     * To open push dialog
     */
    openPushDialog(): void {}

    /**
     * resets form
     */
    resetForm(): void {
        this.advancedSearchForm.reset();
    }
}

interface IWidgetWb extends IWidget {
    /**
     * Chat workbench config
     */
    Config: any;
    /**
     * Chat workbench active flag
     */
    IsActive: boolean;
}
