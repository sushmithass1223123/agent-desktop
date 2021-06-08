import { NestedTreeControl } from '@angular/cdk/tree';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { DomSanitizer } from '@angular/platform-browser';
import { fuseAnimations } from '@fuse/animations';
import { AgentSkillListComponent, SnackbarComponent } from '@modules/shared/components';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { SDKClient, TUtils } from '@tmac/sdk';
import { DRAFT_REASONS, INBOX_REASONS, OUTBOX_REASONS, SENT_REASONS } from 'app/constants';
import { AgentSkillListData, IWidget, ResData } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { formatJsonData, maticonByExtension } from 'app/utils';
import { groupBy, sortBy } from 'lodash';
import * as moment from 'moment';
import { firstValueFrom, Observable, Subscription, timer } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import tinymce from 'tinymce';
import { TwWorkBenchService } from '../tw-workbench-panel.service';

type ComponentActions =
    | 'emails/loading'
    | 'emails/success'
    | 'emails/failure'
    | 'emails/failure/custom-message'
    | 'email/reply/loading'
    | 'email/reply/success'
    | 'email/reply/failure'
    | 'email/polling/active'
    | 'email/polling/inactive';

type AvailableTabs = 'inbox' | 'sentitem' | 'queue' | 'draft';
type EmailPullItem = {
    /**
     * Session ID
     */
    sessionId: string;
    /**
     * Route ID
     */
    routeId: string;
    /**
     * Conversation ID
     */
    conversationId: string;
};
/**
 * Workbench Email
 */
@Component({
    selector: 'workbench-email', // make sure you set the selector starts with <widget-name>
    templateUrl: './workbench-email.component.html',
    styleUrls: ['./workbench-email.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class WorkbenchEmailComponent extends TWidgetWrapper implements OnInit, AfterViewInit, OnDestroy {
    /**
     * holds all the data related to the parent tw workbecnh widget from the config
     */
    @Input() data: IWidget;
    /**
     * holds all the data related to this workbench tab
     */
    @Input() channelConf: any;

    /**
     * Outbox reasons
     */
    OutboxReasons = OUTBOX_REASONS;
    /**
     * Draft reasons
     */
    DraftReasons = DRAFT_REASONS;
    /**
     * Inbox reason
     */
    InboxReasons = INBOX_REASONS;
    /**
     * Sent reason
     */
    SentReasons = SENT_REASONS;
    /**
     * Email bodies
     */
    emailBodies: Record<string, any> = {};
    /**
     * Reply body for reply email in bulk
     */
    // replyBody = '';
    /**
     * Email reply dialog ref
     */
    @ViewChild('replyDialog')
    ReplyEditorDialog: TemplateRef<any>;

    /**
     * replyEditor div ref
     */
    @ViewChild('replyEditor')
    ReplyEditor: ElementRef<HTMLDivElement>;
    /**
     * openeing email flag for loader display
     */
    openingEmail = false;
    /**
     * Reply editor Modal
     */
    replyEditorModal: {
        sendEmail: () => void;
        close: () => void;
        templateRef: any;
        sendingEmail: MatSnackBarRef<SnackbarComponent>;
    };
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
     * Search key
     */
    searchTerm = '';
    /**
     * Selected Mail
     */
    selectedMails: any[] = [];
    /**
     * Selected Mail
     */
    selectedMailIds: any[] = [];

    /**
     * Email Search Stateful request
     */
    emailSearchRes: ResData<{
        /**
         * Selected email
         */
        selected: any;
    }> = {
        error: false,
        loading: false,
        msg: '',
        data: {
            selected: false
        }
    };
    /**
     * Global search form control
     */
    globalSearchControl = this._workbenchService.globalEmailWorkbenchState$.globalSearchKey;
    /**
     * Advanced search form group
     */
    advancedSearchForm = this._workbenchService.globalEmailWorkbenchState$.searchParams;
    /**
     * Tree Controls
     */
    treeControl = new NestedTreeControl<any>((node) => node.children);
    /**
     * Tree Data source
     */
    dataSource = new MatTreeNestedDataSource<any>();
    /**
     * Advanced search visibility
     */
    showAdvancedSearchForm = false;
    /**
     * Currently selected tab
     */
    currentTab: AvailableTabs = 'queue';
    /**
     * Search methods hash map
     */
    searchReqObs$: Record<AvailableTabs, (searchParams?: any) => Observable<any>>;

    /**
     * Show more Attachments flag
     */
    showMoreAttachments = false;

    /**
     * Oepened Email's body ref
     */
    @ViewChild('openEmailBody')
    openEmailBodyRef: ElementRef<HTMLDivElement>;

    /**
     * Minimizes subject and details of opened email
     */
    minimizeSubject = false;

    /**
     * Sort controls
     */
    sortControls = {
        sortBy: new FormControl('default'),
        ascending: true
    };

    /**
     * List of availabloe mailboxes
     */
    availableMailboxes: string[] = [];

    /**
     * Polling Subscription
     */
    polling$: Subscription;

    /**
     * Chats workbech main ref
     */
    @ViewChild('emailWorkBench')
    emailWorkBench: ElementRef<HTMLDivElement>;

    /**
     * Polling flags
     */
    polling = {
        allowed: false,
        enabled: true,
        active: false
    };

    /**
     * Shows email's category menu
     */
    showCategoryMenu = true;

    /**
     * Id for editor component
     */
    editorState = {
        id: TUtils.Generic.uuid(),
        loading: false
    };

    /**
     * Selected email form control
     */
    // myForm = new FormGroup({
    selectedEmailsControl = new FormArray([]);
    // });

    /**
     * Constructor
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private http: HttpClient,
        private domSanitizer: DomSanitizer,
        private appUiService: AppUiService,
        private matDialog: MatDialog,
        private _workbenchService: TwWorkBenchService,
        @Inject(APP_BASE_HREF) private baseHref: string,
        private _aotWidgetService: AOTWidgetService
    ) {
        super();
        this.searchReqObs$ = {
            draft: this.advanceSearchDraftEmail,
            inbox: this.advanceSearchInboxEmail,
            queue: this.advanceSearchQueuedEmail,
            sentitem: this.advanceSearchSentEmail
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    async ngOnInit(): Promise<void> {
        if (!this.globalSearchControl.value) {
            this.globalSearchControl.reset();
        }
        if (!this._workbenchService.globalEmailWorkbenchState$.initialized) {
            try {
                await this._workbenchService.init();
            } catch (e) {
                console.error(e);
            }
        }
        this.availableMailboxes = this._workbenchService.globalEmailWorkbenchState$.availableMailboxes.value;
        this._workbenchService.globalEmailWorkbenchState$.availableMailboxes.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((res) => {
            this.availableMailboxes = res;
        });
        this.selectedEmailsControl.valueChanges.subscribe({
            next: console.log,
            error: console.error,
            complete: console.log
        });
        this.sortControls.sortBy.valueChanges.subscribe(() => this.sortEmailsByKey());
    }

    /**
     * After View Init
     */
    ngAfterViewInit(): void {
        // create an intersection observer to start/stop polling when page is active/inactive
        const observer = new IntersectionObserver((entries) => {
            entries.map((entry) => {
                if (entry.isIntersecting) {
                    this.polling.allowed = this.polling.enabled = this.channelConf.Config.SearchPollingInterval > 0;
                    if (this.channelConf.Config.SearchPollingInterval) {
                        this.startPolling();
                    } else {
                        this.doAdvancedSearch();
                    }
                } else {
                    this.stopPolling();
                }
            });
        });
        // observe the element
        observer.observe(this.emailWorkBench.nativeElement);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        tinymce.activeEditor?.destroy();
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To start polling
     */
    private startPolling(): void {
        this.polling$ = timer(0, this.channelConf.Config.SearchPollingInterval)
            .pipe(filter(() => this.polling.enabled && !this.emailSearchRes.loading && !this.polling.active))
            .subscribe(() => {
                this.doAdvancedSearch(true);
            });
    }

    /**
     * To stop polling
     */
    private stopPolling(): void {
        this.polling$?.unsubscribe();
    }

    /**
     * Sort Callback
     */
    sortEmailsByKey(childrenNodes?: any[]): void {
        if (!childrenNodes) {
            childrenNodes = this.getAllEmailNodes();
        }
        const sortKey = this.sortControls.sortBy.value;
        let sorted;
        if (sortKey !== 'default') {
            sorted = sortBy(childrenNodes, sortKey);
        } else {
            sorted = childrenNodes;
        }
        const sortedEmails = this.sortControls.ascending ? sorted : sorted.reverse();
        this.groupNodes(sortedEmails);
    }

    /**
     * Sorts by asc / desc
     */
    sortEmailsByOrder(): void {
        const childrenNodes = this.getAllEmailNodes();
        const sortedEmails = childrenNodes.reverse();
        this.groupNodes(sortedEmails);
    }

    /**
     * Returns all emails nodes
     * @returns
     */
    getAllEmailNodes(): any[] {
        return this.dataSource.data.reduce((acc, curr) => {
            const descendants = this.treeControl.getDescendants(curr).filter((x) => !x.children);
            if (descendants && descendants.length) {
                acc.push(...descendants);
            }
            return acc;
        }, []);
    }

    /**
     * Groups nodes and assigns to mat-tree
     * @param sortedEmails
     */
    groupNodes(sortedEmails: any[]): void {
        const byMailList = groupBy(sortedEmails, 'To');
        let nodes: any;
        if (['sentitem', 'draft'].includes(this.currentTab)) {
            nodes = Object.entries(byMailList).reduce((acc, curr) => {
                const [name, children] = curr;
                const uiId = children.reduce((acc, curr) => {
                    acc += curr.uiId;
                    return acc;
                }, '');
                acc.push({
                    name,
                    children,
                    To: name || ''
                    // uiId
                });
                return acc;
            }, []);
        } else {
            nodes = Object.entries(byMailList).map((entry) => {
                const [name, mailList] = entry;
                const groupedNodes = groupBy(mailList, 'Skill');
                const children = Object.entries(groupedNodes).map((n) => {
                    const [nodeName, grandChildrenNodes] = n;
                    const subUiId = grandChildrenNodes.reduce((acc, curr) => {
                        acc += curr.uiId;
                        return acc;
                    }, '');
                    return {
                        name: nodeName,
                        children: grandChildrenNodes,
                        To: name,
                        Skill: nodeName
                        // uiId: subUiId
                    };
                });
                const { grandChildren, uiId } = children.reduce(
                    (acc, curr) => {
                        acc.grandChildren += curr.children.length;
                        // acc.uiId += curr.uiId;
                        return acc;
                    },
                    { grandChildren: 0, uiId: '' }
                );
                return {
                    name,
                    children,
                    To: name,
                    grandChildren
                    // uiId
                };
            });
        }
        this.dataSource.data = nodes;
        // const selected = this.treeControl.expansionModel.selected?.map((n) => n.uiId) || [];
        // this.treeControl.expandAll();
        // setTimeout(() => {
        //     if (selected.length) {
        //         this.treeControl.dataNodes.forEach((n) => {
        //             if (selected.includes(n.uiId)) {
        //                 this.treeControl.expand(n);
        //             }
        //         });
        //     }
        // }, 0);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Check if tree node has child
     * @param {number} _
     * @param {any} node
     */
    hasChild = (_: number, node: any) => !!node.children && node.children.length > 0;

    /**
     * Advanced Search
     * @method advancedSearch
     */
    doAdvancedSearch(silent = false): void {
        try {
            if (this.globalSearchControl.value) {
                this.doGlobalSearch(silent);
            }
            if (!this.data.Data.WorkbenchUrl) {
                this.setComponentState('emails/failure/custom-message', { msg: 'WorkbenchUrl not provided', silent });
                return;
            }

            if (silent) {
                this.setComponentState('email/polling/active');
            } else {
                this.setComponentState('emails/loading', { silent });
            }

            this.searchReqObs$[this.currentTab]().subscribe({
                next: (res: any) => {
                    if (res.status === 'SUCCESS') {
                        const mails = res.result.map((x: any, idx) => {
                            const mailRes = typeof x.data === 'string' ? JSON.parse(x.data) : x;
                            if (x.addedTime) {
                                mailRes.addedTime = x.addedTime;
                            }
                            if (!mailRes.uiId) {
                                mailRes.uiId = mailRes.SessionId;
                            }
                            mailRes.Subject = this.domSanitizer.bypassSecurityTrustHtml(
                                (mailRes.Subject || '').replaceAll('<a', '<a target="_blank"')
                            )['changingThisBreaksApplicationSecurity'];
                            mailRes.body = this.domSanitizer.bypassSecurityTrustHtml((mailRes.body || '').replaceAll('<a', '<a target="_blank"'))[
                                'changingThisBreaksApplicationSecurity'
                            ];
                            return mailRes;
                        });
                        this.sortEmailsByKey(mails);
                        this.emailBodies = {};
                        this.setComponentState('emails/success', { silent });
                    } else {
                        this.setComponentState('emails/failure', { silent });
                    }
                },
                error: () => {
                    this.setComponentState('emails/failure', { silent });
                },
                complete: () => {
                    this.setComponentState('email/polling/inactive');
                }
            });
        } catch (e) {
            console.error(e);
            this.setComponentState('emails/failure', { silent });
        }
    }

    /**
     * To do global search
     */
    doGlobalSearch(silent = false): void {
        try {
            if (!this.data.Data.WorkbenchUrl) {
                this.setComponentState('emails/failure/custom-message', { msg: 'WorkbenchUrl not provided', silent });
                return;
            }

            if (silent) {
                this.setComponentState('email/polling/active');
            } else {
                this.setComponentState('emails/loading', { silent });
            }

            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const globalKey = this.globalSearchControl.value;

            const searchParams = {
                fromDate: yesterday,
                fromTime: `00:00`,
                toDate: today,
                toTime: `${'23'}:${'59'}`,
                email: globalKey,
                subject: globalKey,
                content: globalKey,
                skills: globalKey,
                agent: globalKey,
                inSessionid: globalKey,
                deviceid: globalKey,
                assignedTo: globalKey,
                sesisonid: globalKey,
                global: 'GLOBAL',
                listOfMailboxes: this._workbenchService.globalEmailWorkbenchState$.searchParams.value.listOfMailboxes.join(','),
                hasAttachments: 2,
                replied: 2,
                closed: 2,
                assigned: 2
            };
            this.searchReqObs$[this.currentTab](searchParams).subscribe({
                next: (res: any) => {
                    if (res.status === 'SUCCESS') {
                        const mails = res.result.map((x: any) => {
                            const mailRes = typeof x.data === 'string' ? JSON.parse(x.data) : x;
                            if (x.addedTime) {
                                mailRes.addedTime = x.addedTime;
                            }
                            mailRes.id = Date.now();
                            mailRes.body = this.domSanitizer.bypassSecurityTrustHtml((mailRes.body || '').replaceAll('<a', '<a target="_blank"'));
                            return mailRes;
                        });
                        this.sortEmailsByKey(mails);
                        this.emailBodies = {};
                        this.setComponentState('emails/success', { silent });
                    } else {
                        this.setComponentState('emails/failure', { silent });
                    }
                },
                error: () => {
                    this.setComponentState('emails/failure', { silent });
                },
                complete: () => {
                    this.setComponentState('email/polling/inactive');
                }
            });
        } catch (e) {
            console.error(e);
            this.setComponentState('emails/failure', { silent });
        }
    }

    /**
     *
     * Gets the current session's key name
     * @returns {string}
     */
    getCurrentSessionKey(): string {
        let sessionKey = 'OutSessionId';
        if (['inbox', 'queue'].includes(this.currentTab)) {
            sessionKey = 'InSessionId';
        }
        return sessionKey;
    }

    /**
     * Deletes emails via workbench
     * @param emails email items list
     */
    async deleteEmails(emails: any[]): Promise<void> {
        const loader = this.appUiService.showSnackbar('Deleting emails', 'loading');
        try {
            const sessionKey = this.getCurrentSessionKey();
            const { sessionIds, uiIds, draftSessionIds }: Record<string, string[]> = emails.reduce(
                (acc, curr) => {
                    acc.sessionIds.push(curr[sessionKey]);
                    acc.draftSessionIds.push(`${curr.InSessionId}|${curr.OutSessionId}`);
                    acc.uiIds.push(curr.uiId);
                    return acc;
                },
                { sessionIds: [], draftSessionIds: [], uiIds: [] }
            );
            if (this.currentTab === 'inbox') {
                await SDKClient.maskInboxEmail({
                    sessionId: sessionIds.join(','),
                    source: 'agent-desktop'
                });
            } else if (this.currentTab === 'draft') {
                await SDKClient.deleteBulkEmailsInDraft(draftSessionIds.join(','));
            } else if (this.currentTab === 'queue') {
                const { tmacServer, agentId } = SDKClient.getAgentData();
                const res$ = this.http
                    .post(`${this.data.Data.WorkbenchUrl}/queue/delete`, {
                        tmacServer,
                        agentId,
                        source: 'queue|agent-desktop',
                        items: emails.map((e) => ({
                            sessionId: e[sessionKey],
                            routeId: e.RouteId || '',
                            conversationId: e.conversationID || ''
                        }))
                    })
                    .pipe(takeUntil(this.unsubscribeAll));
                const res: any = await firstValueFrom(res$);
                if (res.status !== 'SUCCESS') {
                    throw new Error(`Unable to delete emails ${sessionIds.join(',')}`);
                }
            }
            this.removeEmailsfromView('all', uiIds);
            this.doAdvancedSearch(true);
            loader.dismiss();
        } catch (e) {
            console.error(e);
            loader.dismiss();
            this.appUiService.showSnackbar('Unable to delete emails', 'failure');
        }
    }

    /**
     * Closes emails in bulk
     * @param {any} emails email list
     */
    async closeEmails(emails: any[]): Promise<void> {
        const loader = this.appUiService.showSnackbar('Closing emails', 'loading');
        try {
            const { routeIds, uiIds } = emails.reduce(
                (acc, curr) => {
                    acc.routeIds.push(curr.RouteId);
                    acc.uiIds.push(curr.uiId);
                    return acc;
                },
                { routeIds: [], uiIds: [] }
            );
            await SDKClient.closeBulkEmailsInQueue(routeIds.join(','));
            this.removeEmailsfromView('all', uiIds);
            this.doAdvancedSearch(true);
            loader.dismiss();
        } catch (e) {
            console.error(e);
            loader.dismiss();
            this.appUiService.showSnackbar('Unable to close emails', 'failure');
        }
    }

    /**
     * Pull email
     * @method pullEmail
     */
    pullEmails(emails: any[]): void {
        const loader = this.appUiService.showSnackbar('Pulling email', 'loading');
        try {
            const { agentId, tmacServer } = SDKClient.getAgentData();
            const { items, uiIds } = emails.reduce(
                (acc, curr) => {
                    acc.items.push({
                        routeId: curr.RouteId || '',
                        sessionId: this.currentTab === 'draft' ? curr.OutSessionId : curr.InSessionId,
                        conversationId: curr.conversationID || '',
                        inSessionId: curr.InSessionId,
                        mailbox: curr.mailbox
                    });
                    acc.uiIds.push(curr.uiId);
                    return acc;
                },
                { items: [], uiIds: [] }
            );
            this.http
                .post(this.data.Data.WorkbenchUrl + `/${this.currentTab}/pull`, {
                    tmacServer,
                    agentId,
                    items
                })
                .subscribe({
                    next: (res: any) => {
                        if (res.status === 'FAILED') {
                            console.error(res);
                            loader.dismiss();
                            this.appUiService.showSnackbar('Unable to pull email', 'failure');
                            return;
                        }
                        this.removeEmailsfromView('all', uiIds);
                        loader.dismiss();
                        this.appUiService.showSnackbar('Emails pulled successfully', 'success');
                    },
                    error: (err) => {
                        console.error(err);
                        loader.dismiss();
                        this.appUiService.showSnackbar('Unable to pull email', 'failure');
                    }
                });
        } catch (e) {
            console.error(e);
            loader.dismiss();
            this.appUiService.showSnackbar('Unable to pull email', 'failure');
        }
    }

    /**
     * Searched through queued emails
     */
    advanceSearchQueuedEmail = (): Observable<any> => {
        const searchFields = this.advancedSearchForm.value;

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

        return this.http
            .post(this.data.Data.WorkbenchUrl + '/queue/search', {
                skills: searchFields.skills ? [searchFields.skills] : [],
                email: searchFields.email,
                agent: searchFields.agent || '',
                startDate,
                endDate,
                subject: searchFields.subject,
                content: searchFields.content
            })
            .pipe(
                map((res: any) => ({
                    ...res,
                    result: res.result.map((x: any) => {
                        const data = typeof x.data === 'string' ? JSON.parse(x.data) : x;
                        data.Skill = x.skillName || x.skillId;
                        data.ToList = data.To;
                        data.InSessionId = data.SessionId;
                        data.OutSessionId = data.OutSessionId;
                        data.uiId = `${data.SessionId}|${data.OutSessionID}`;
                        data.addedTime = new Date(x.addedTime);
                        return data;
                    })
                }))
            );
    };

    /**
     * Searched through inbox emails
     */
    advanceSearchInboxEmail = (): Observable<any> => {
        // const { agentId } = SDKClient.getAgentData();

        const searchFields = this.advancedSearchForm.value;

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

        const response = this.http
            .post(this.data.Data.WorkbenchUrl + '/inbox/search', {
                skills: searchFields.skills ? [searchFields.skills] : [],
                email: searchFields.email,
                agent: searchFields.agent || '',
                startDate,
                endDate,
                subject: searchFields.subject,
                content: searchFields.content,
                deviceid: searchFields.deviceId,
                assignedTo: searchFields.assignedTo,
                sesisonid: searchFields.sesisonid,
                global: '',
                listOfMailboxes: searchFields.listOfMailboxes.join(','),
                hasAttachments: searchFields.hasAttachments,
                replied: searchFields.replied,
                closed: searchFields.closed,
                assigned: searchFields.assigned
            })
            .pipe(
                map((res: any) => ({
                    ...res,
                    result: res.result.map((x: any) => {
                        const addedTime = new Date(x.receivedDate);
                        const time = x.receivedTime.split(':');
                        addedTime.setHours(time[0]);
                        addedTime.setMinutes(time[1]);
                        return {
                            ...formatJsonData(x, {
                                To: 'mailbox',
                                ToList: 'toList',
                                Skill: 'makerSkillName',
                                Subject: 'subject',
                                From: 'from',
                                SessionId: 'sessionID',
                                RouteId: 'routeId',
                                RouteReason: 'RouteReason',
                                InSessionId: 'sessionID'
                            }),
                            addedTime,
                            uiId: x.sessionID
                        };
                    })
                }))
            );

        return response;
    };

    /**
     * Searches through draft emails
     */
    advanceSearchDraftEmail = (): Observable<any> => {
        // const { agentId } = SDKClient.getAgentData();

        const searchFields = this.advancedSearchForm.value;

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

        return this.http
            .post(this.data.Data.WorkbenchUrl + '/draft/search', {
                skills: searchFields.skills ? [searchFields.skills] : [],
                email: searchFields.email,
                agent: searchFields.agent || '',
                startDate,
                endDate,
                subject: searchFields.subject,
                content: searchFields.content,
                inSessionid: searchFields.inSessionid,
                listOfMailboxes: searchFields.listOfMailboxes.join(',')
            })
            .pipe(
                map((res: any) => ({
                    ...res,
                    result: res.result.map((x: any) => {
                        const addedTime = new Date(x.currentStatusDate);
                        const time = x.currentStatusTime.split(':');
                        addedTime.setHours(time[0]);
                        addedTime.setMinutes(time[1]);
                        return {
                            ...x,
                            To: x.mailbox,
                            ToList: x.toList,
                            Skill: x.makerSkillName || x.cmSkill,
                            Subject: x.subject,
                            From: x.from,
                            addedTime,
                            SessionId: x.sessionID,
                            OutSessionId: x.sessionID,
                            InSessionId: x.inSessionID,
                            uiId: `${x.inSessionID}|${x.sessionID}`,
                            RouteId: x.routeId
                        };
                    })
                }))
            );
    };

    /**
     * Advanced searches emails
     */
    advanceSearchSentEmail = (): Observable<any> => {
        // const { agentId } = SDKClient.getAgentData();

        const searchFields = this.advancedSearchForm.value;

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

        return this.http
            .post(this.data.Data.WorkbenchUrl + '/sentitem/search', {
                skills: searchFields.skills ? [searchFields.skills] : [],
                email: searchFields.email,
                agent: '',
                startDate,
                endDate,
                subject: searchFields.subject,
                content: searchFields.content,
                listOfMailboxes: searchFields.listOfMailboxes.join(','),
                InSessionid: searchFields.inSessionid,
                global: ''
            })
            .pipe(
                map((res: any) => ({
                    ...res,
                    result: res.result.map((x: any) => {
                        const addedTime = new Date(x.sendDate);
                        const time = x.sendTime.split(':');
                        addedTime.setHours(time[0]);
                        addedTime.setMinutes(time[1]);
                        return {
                            ...x,
                            To: x.mailbox,
                            ToList: x.toList,
                            Skill: x.makerSkillName || x.cmSkill,
                            Subject: x.subject,
                            From: x.mailbox,
                            addedTime,
                            // SessionId: x.inSessionID,
                            OutSessionId: x.sessionID,
                            InSessionId: x.inSessionID,
                            uiId: `${x.inSessionID}|${x.sessionID}`,
                            RouteId: x.routeId
                        };
                    })
                }))
            );
    };

    /**
     * Select emails
     */
    selectEmail(node: any, checked: boolean): void {
        if (checked) {
            this.selectedMails.push(node);
            this.selectedMailIds.push(node.uiId);
        } else {
            this.selectedMails = this.selectedMails.filter((x) => x.uiId !== node.uiId);
            this.selectedMailIds = this.selectedMails.map((x) => x.uiId) || [];
        }
    }

    /**
     * Selects all emails
     */
    selectAllEmails(checked: boolean): void {
        const nodes = this.getAllEmailNodes();
        nodes.forEach((n) => {
            this.selectEmail(n, checked);
        });
        for (const n of nodes) {
            console.log(nodes);
        }
    }

    /**
     * opens email for preview
     */
    async openEmail(email: any): Promise<void> {
        try {
            this.setComponentState('emails/loading');
            // const fetchFromOutbox = [...this.OutboxReasons, ...this.DraftReasons].includes(email.RouteReason);
            const fetchFromOutbox = this.currentTab === 'draft' || this.currentTab === 'sentitem';
            const requestedSession = fetchFromOutbox ? email.OutSessionId : email.InSessionId;
            if (!this.emailBodies[requestedSession]) {
                const res = (await (fetchFromOutbox ? SDKClient.getOutboxEmail(requestedSession) : SDKClient.getInboxEmail(requestedSession)))
                    .response;
                // check the response
                if (!res) {
                    this.setComponentState('emails/failure/custom-message', { msg: 'Something went wrong, Error in email preview', snackbar: true });
                    return;
                }

                // check if attachements are there
                if (res.Attachments && res.Attachments.length) {
                    res.Attachments.forEach((item: any) => {
                        // get the file name from URL
                        let name = item.URL.split('/').pop();
                        const sessionKey = this.getCurrentSessionKey();
                        name = name.replace(item[sessionKey], '');
                        item.Name = name;
                        item.Ext = name.split('.').pop();
                        item.Icon = maticonByExtension(item.Ext);
                    });
                }

                this.emailBodies[requestedSession] = {
                    body: this.domSanitizer.bypassSecurityTrustHtml((res.Body || '').replaceAll('<a', '<a target="_blank"')),
                    attachmentList: res?.Attachments || [],
                    agentName: res?.AgentName,
                    repliedStatus: (res as any)?.RepliedStatus,
                    conversationID: res.ConversationID,
                    currentStatus: res.CurrentStatus,
                    closedBy: (res as any).ClosedBy,
                    ccList: res?.CCList,
                    priority: (res as any).Priority
                };
            }
            this.emailSearchRes.data.selected = { ...email, ...this.emailBodies[requestedSession], currentTab: this.currentTab };
            this.setComponentState('emails/success');
        } catch (e) {
            console.error(e);
            this.setComponentState('emails/failure/custom-message', { msg: 'Something went wrong, Error in email preview', snackbar: true });
        }
    }

    /**
     * Switches tabs
     * @param {AvailableTabs} tab tab key passed as argument
     */
    switchTab(tab: AvailableTabs): void {
        this.currentTab = tab;
        this.removeEmailsfromView('all');
        this.emailBodies = {};
        this.doAdvancedSearch();
    }

    /**
     * Marks currently selected email as spam
     */
    async markAsSpam(email: any): Promise<void> {
        let loader;
        try {
            const confirmDialogRef = this.appUiService.showAppConfirmDialog('generic', 'Confirm Spam', 'Are you sure to mark this email as spam?');
            const dialogResult = await firstValueFrom(confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)));
            if (dialogResult) {
                loader = this.appUiService.showSnackbar('Spamming email', 'loading');
                const sessionKey = this.getCurrentSessionKey();
                const res = await SDKClient.markEmailAsSpam({
                    fromAddress: email.From,
                    routeId: email.RouteId,
                    sessionId: email[sessionKey]
                });
                if (res.response < 1) {
                    throw new Error('Email spam request failed');
                }
                this.removeEmailsfromView('opened');
                loader?.dismiss();
                this.appUiService.showSnackbar('Email marked as spam');
            }
        } catch (err) {
            console.error(err);
            loader?.dismiss();
            this.appUiService.showSnackbar('Unable to spam the email', 'failure');
        }
    }

    /**
     * Transfers email
     * @param {any} email
     */
    transferEmail(emails: any[]): void {
        // const config = this.data.Data.Channels.filter((f: any) => f.Type === 'Email')?.[0];
        const config = this.channelConf?.Config || {};
        const agentConfig = config?.Transfer?.Agent || {};
        const skillConfig = config?.Transfer?.Skill || {};
        const uiIds = emails.map((e) => e.uiId);
        const data: AgentSkillListData = {
            title: 'Email Transfer',
            type: 'transferEmail',
            agent: {
                allowed: agentConfig.Allowed,
                allowedStates: agentConfig.AllowedStates,
                blind: agentConfig.Blind,
                source: agentConfig.Source,
                columns: agentConfig.Columns,
                teamFilter: agentConfig.TeamFilter
            },
            skill: {
                allowed: skillConfig.Allowed,
                blind: false,
                channelPrfix: skillConfig.ChannelPrefix,
                source: skillConfig.Source,
                columns: skillConfig.Columns
            },
            callback: ({ success }) => {
                if (success) {
                    this.doAdvancedSearch(true);
                    this.removeEmailsfromView('all', uiIds);
                }
            }
        };
        const sessionKey = this.getCurrentSessionKey();
        this.matDialog.open(AgentSkillListComponent, {
            data: {
                ...data,
                // interactionId: email.InteractionId,
                otherData: {
                    type: 'transfer',
                    emails: emails.map((e) => ({
                        ...e,
                        SessionId: e[sessionKey]
                    }))
                }
            },
            panelClass: 'agent-skill-dialog',
            minWidth: '30%',
            maxWidth: '100%',
            height: '60%',
            disableClose: true
        });
    }

    /**
     * Closes emails in bulk
     * @param {any} emails email list
     */
    replyToSelectedEmails(emails: any[]): void {
        try {
            const widget = new TwWidgetModel('Reply All', 'tw-panel');
            widget.Config.Anchor = true;
            widget.Config.Position.W = 800;
            widget.Config.Position.H = 500;
            widget.Config.Actions = ['maximize', 'collapse', 'destroy'];
            this.replyEditorModal = {
                sendEmail: async () => {
                    try {
                        const reply = tinymce.activeEditor.getContent();
                        if (reply && reply !== '<p><br></p>') {
                            this.setComponentState('email/reply/loading');
                            const { routeIds, uiIds } = emails.reduce(
                                (acc, curr) => {
                                    acc.routeIds.push(curr.RouteId);
                                    acc.uiIds.push(curr.uiId);
                                    return acc;
                                },
                                { routeIds: [], uiIds: [] }
                            );
                            await SDKClient.replyBulkEmailsInQueue({
                                body: reply,
                                routeIdList: routeIds.join(',')
                            });
                            this.selectedMails = [];
                            this.selectedMailIds = [];
                            if (uiIds.includes(this.emailSearchRes.data.selected.uiId)) {
                                this.emailSearchRes.data.selected = null;
                            }
                            this.doAdvancedSearch(true);
                            this.setComponentState('email/reply/success');
                        } else {
                            this.appUiService.showSnackbar('Email cannot be empty', 'failure');
                        }
                    } catch (e) {
                        console.error(e);
                        this.setComponentState('email/reply/failure');
                    }
                },
                close: () => {
                    this._aotWidgetService.destroyWidget(widget.ID);
                },
                sendingEmail: null,
                templateRef: this.ReplyEditorDialog
            };
            widget.Data = this.replyEditorModal;
            this._aotWidgetService.addWidget(widget);
            this.editorState.loading = true;
            setTimeout(() => {
                tinymce
                    .init({
                        selector: `textarea#${this.editorState.id}`,
                        min_height: 200,
                        height: '100%',
                        menubar: false,
                        fontsize_formats: '8pt 9pt 10pt 11pt 12pt 26pt 36pt',
                        forced_root_block: false,
                        // force_br_newlines: true,
                        // force_p_newlines: false,
                        branding: false,
                        base_url: `${this.baseHref}assets/tinymce/`,
                        content_css: `${this.baseHref}assets/tinymce/editor.css`,
                        plugins: [
                            'advlist autolink lists link image charmap print preview anchor',
                            'searchreplace visualblocks code fullscreen',
                            'insertdatetime media table paste code wordcount'
                        ],
                        toolbar:
                            'undo redo | formatselect | ' +
                            'bold italic backcolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help',
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                        setup: (editor) => {
                            editor.on('init', () => {
                                this.editorState.loading = false;
                            });
                        }
                    })
                    .then(() => {
                        console.log('Email editor loaded succesfully');
                    })
                    .catch((err) => {
                        console.error('Unable to load editor');
                        console.error(err);
                    });
            }, 0);
        } catch (e) {
            console.error(e);
            this.setComponentState('email/reply/failure');
        }
    }

    /**
     * Resets form
     */
    resetForm(): void {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        this._workbenchService.resetEmailState();
        // this.advancedSearchForm.setValue({});
    }

    /**
     * Selects Emailtemplate
     * @param {String} html
     */
    selectEmailTemplate(html: string): void {
        if (!html) {
            this.appUiService.showSnackbar('Sorry, there is something wrong with this template', 'failure');
            return;
        }
        tinymce.activeEditor.setContent((html || '').replaceAll('<a', '<a target="_blank"'));
    }

    /**
     * Opens a selected attachment file
     * @param {String} fileUrl
     */
    openFile(fileUrl: string): void {
        window.open(fileUrl);
    }

    /**
     * Sets component state
     * @param {ComponentActions} action
     * @param {any} payload
     */
    setComponentState(action: ComponentActions, payload?: any): void {
        switch (action) {
            case 'emails/loading':
                this.emailSearchRes.loading = true;
                this.emailSearchRes.error = false;
                this.emailSearchRes.data.selected = false;
                break;

            case 'emails/success':
                this.emailSearchRes.loading = false;
                this.emailSearchRes.error = false;
                break;

            case 'emails/failure':
                this.emailSearchRes.loading = false;
                this.emailSearchRes.error = true;
                this.emailSearchRes.msg = 'Error occured while fetching emails';
                break;

            case 'emails/failure/custom-message':
                this.emailSearchRes.loading = false;
                if (payload.snackbar) {
                    this.appUiService.showSnackbar(payload.msg, 'failure');
                } else {
                    this.emailSearchRes.msg = payload.msg;
                    this.emailSearchRes.error = true;
                }
                break;

            case 'email/reply/loading':
                this.replyEditorModal.sendingEmail = this.appUiService.showSnackbar('Replying to emails', 'loading');
                break;
            case 'email/reply/success':
                if (this.replyEditorModal.sendingEmail) {
                    this.replyEditorModal.sendingEmail.dismiss();
                    this.replyEditorModal.sendingEmail = null;
                }
                this.replyEditorModal.close();
                this.appUiService.showSnackbar('Replied to emails');
                break;
            case 'email/reply/failure':
                if (this.replyEditorModal.sendingEmail) {
                    this.replyEditorModal.sendingEmail.dismiss();
                    this.replyEditorModal.sendingEmail = null;
                }
                this.appUiService.showSnackbar('Unable to reply', 'failure');
                break;
            case 'email/polling/active':
                this.polling.active = true;
                break;
            case 'email/polling/inactive':
                this.polling.active = false;
                break;

            default:
                break;
        }
        if (!payload?.silent) {
            this.showAdvancedSearchForm = false;
        }
    }

    /**
     * Trackby for mat tree node
     * @param _index
     * @param email
     * @returns
     */
    trackBy = (_index: number, email: any): string => {
        return email.uiId;
    };

    /**
     * Removes opened emails or selected emails
     * @param ids
     */
    removeEmailsfromView(type: 'opened' | 'selected' | 'all', ids?: string[]): void {
        if (ids) {
            if (['all', 'selected'].includes(type)) {
                this.selectedMails = this.selectedMails.filter((m) => !ids.includes(m.uiId));
                this.selectedMailIds = this.selectedMails.filter((m) => m.uiId) || [];
            }
            if (['all', 'opened'].includes(type) && ids.includes(this.emailSearchRes.data.selected?.uiId)) {
                this.emailSearchRes.data.selected = null;
            }
        } else {
            if (['all', 'selected'].includes(type)) {
                this.selectedMails = [];
                this.selectedMailIds = [];
            }
            if (['all', 'opened'].includes(type)) {
                this.emailSearchRes.data.selected = null;
            }
        }
    }
}

// for more info visit - https://angular.io/api/core
