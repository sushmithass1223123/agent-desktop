import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { fuseAnimations } from '@fuse/animations';
import { AgentSkillListComponent, PreviewEmailComponent, SnackbarComponent } from '@modules/shared/components';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { EmailInboxModel, EmailOutboxModel, SDKClient } from '@tmac/sdk';
import { AGENT_FEATURES, DRAFT_REASONS, INBOX_REASONS, OUTBOX_REASONS, SENT_REASONS } from 'app/constants';
import { AgentSkillListData, EmailComponentInputs, IWidget, ResData } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { maticonByExtension, throwADError } from 'app/utils';
import { addHours, format, format as formatDate } from 'date-fns';
import { groupBy, isEqual, sortBy, uniqBy } from 'lodash';
import { BehaviorSubject, forkJoin, Observable, Subscription, timer } from 'rxjs';
import { filter, map, take, takeUntil, timeout } from 'rxjs/operators';
import { EmailService, initEmailSearchState } from '../email.service';

/**
 * Type of the mail node
 */
type Mail = {
    Mailbox: string;
    ToList: string;
    Skill: string;
    Subject: string;
    From: string;
    AddedTime: Date;
    OutSessionId: string;
    InSessionId: string;
    uiId: string;
    RouteId: string;
    HasAttachment: boolean;
    ConversationID: string;
    IsEmailProbableSpam: boolean;

    CCList?: string;
    BCCList?: string;
    Files?: any[];
    Body?: string;
    checked?: boolean;
    RouteReason?: string;
    EmailType?: string;
};

/**
 * Various states of the component
 */
type ComponentActions =
    | 'emails/loading'
    | 'emails/success'
    | 'emails/failure'
    | 'email/reply/loading'
    | 'email/reply/success'
    | 'email/reply/failure'
    | 'email/open/loading'
    | 'email/open/success'
    | 'email/open/failure'
    | 'email/polling/active'
    | 'email/polling/failed'
    | 'email/polling/inactive';

/**
 * Available tabs of the email workbench
 */
type AvailableTabs = 'inbox' | 'sentitem' | 'queue' | 'draft';
/**
 * Global search form controls
 * Global search is the direct search key input present at the top of the emails list
 */
type GlobalSearchFormData = { form: FormControl; data: Partial<Record<AvailableTabs, string>> };
/**
 * Advanced Search form data
 * Advanced search fields are displayed when the dropdown is opened in a tab
 * Under the hood, both global search and normal search / polling use this search only
 */
type AdvanceSearchFormData = {
    form: FormGroup;
    data: Partial<Record<AvailableTabs, { data: any; changed: boolean }>>;
    show: boolean;
    sub$: any;
    snackbarRef: any;
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
    // changeDetection: ChangeDetectionStrategy.OnPush
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
     * Email reply dialog ref
     */
    @ViewChild('replyDialog')
    ReplyEditorDialog: TemplateRef<any>;

    // @ViewChild(PreviewEmailComponent)
    // previewEmailRef: PreviewEmailComponent;

    /**
     * Reply editor Modal
     */
    replyEditorModal: {
        sendEmail: (email: EmailComponentInputs) => void;
        templateRef: any;
        sendingEmail: MatSnackBarRef<SnackbarComponent>;
    };
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * Email Search Stateful request
     */
    emailSearchRes: ResData = {
        error: false,
        loading: false,
        msg: ''
    };

    /**
     * Email Search Stateful request
     */
    openEmailRes: ResData<
        BehaviorSubject<
            Mail & {
                Body: string;
            }
        >
    > = {
        error: false,
        loading: false,
        msg: '',
        data: new BehaviorSubject(null)
    };

    /**
     * Global search form control and cached data for each category
     */
    globalSearch: GlobalSearchFormData = {
        form: new FormControl(''),
        data: {}
    };

    /**
     * Advanced search form controls and cached search fields for each category
     */
    advancedSearch: AdvanceSearchFormData = {
        form: this._emailService.globalEmailWorkbenchState$.searchParams,
        data: {},
        show: false,
        sub$: null,
        snackbarRef: null
    };

    /**
     * Tree Controls
     */
    treeControl = new NestedTreeControl<any>((node) => node.children);

    /**
     * Tree Data source
     */
    dataSource = new MatTreeNestedDataSource<any>();

    // emailTree: Array<Mail | Mail[]> = [];

    /**
     * Currently selected tab
     */
    currentTab: string;

    /**
     * Sort controls
     */
    sortControls = {
        sortBy: 'Date',
        ascending: false
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
        failed: false,
        active: false
    };

    /**
     * Flag to allow transfer email button
     */
    allowQueueTransfer = false;

    /**
     * Intersection observer ref
     */
    intersectionObserver: IntersectionObserver;

    /**
     * Flag for delete button
     */
    deleteAllowed = false;

    /**
     * Replied email shown
     */
    latestEmailPreview = false;

    /**
     * Available tabs ref
     */
    availableTabs = [
        { label: 'Queue', enabled: true, icon: 'queue', key: 'queue' },
        { label: 'Inbox', enabled: true, icon: 'mail', key: 'inbox' },
        { label: 'Sent', enabled: true, icon: 'mark_email_read', key: 'sentitem' },
        { label: 'Drafts', enabled: true, icon: 'drafts', key: 'draft' }
    ];

    /**
     * Agent action features
     */
    agentFeatures: {
        /**
         * Queue tab allowed
         */
        queueTabAllowed: boolean;
        /**
         * Inbox tab allowed
         */
        inboxTabAllowed: boolean;
        /**
         * Sent tab allowed
         */
        sentTabAllowed: boolean;
        /**
         * Draft tab allowed
         */
        draftsTabAllowed: boolean;
    };

    /**
     * Constructor
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private http: HttpClient,
        private appUiService: AppUiService,
        private matDialog: MatDialog,
        private _emailService: EmailService,
        private _aotWidgetService: AOTWidgetService,
        private _agentFeaturesService: AgentFeaturesService
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
    async ngOnInit(): Promise<void> {
        // get and set the list of available mailboxes
        await this.setAvailableMailboxes();
        // set the flag whether to get the email templates by departments
        this._emailService.emailTemplatesDepartmentsByTeam = !!this.channelConf.Config.TemplatesByTeam;

        // get the allowed tabs from config
        const allowedTabs = this.channelConf.Config?.Tabs?.map((m: string) => m.toLowerCase()) ?? [];
        if (allowedTabs.length) {
            // filter the allowed tabs given in config
            this.availableTabs.forEach((f) => {
                f.enabled = allowedTabs.includes(f.label.toLowerCase());
            });
        }
        // subscribe to agent features to check for the allowed tabs realtime
        this._agentFeaturesService.features.pipe(takeUntil(this.unsubscribeAll)).subscribe((change: boolean) => {
            if (change) {
                this.checkAgentFeatures();
            }
        });

        // check for the agent features
        this.checkAgentFeatures();

        // set the flags to check if delete and queue transfers are allowed for the agent
        const { agentProfile } = SDKClient.getAgentData();
        // delete is not allowed for agents
        this.deleteAllowed = this.channelConf.Config.DeleteAllowed && agentProfile === 'S';
        // queue transfer allowed via config or if the user is a supervisor
        this.allowQueueTransfer = this.channelConf.Config?.QueueTransferForAgent ? true : agentProfile === 'S';

        // set the current tab
        this.currentTab = this.availableTabs.find((f) => f.enabled)?.key ?? '';
        if (this.currentTab) {
            this.advancedSearch.data[this.currentTab] = { data: this.advancedSearch.form.value, changed: false };
            this.globalSearch.data[this.currentTab] = this.globalSearch.form.value;
        }
    }

    /**
     * After View Init
     */
    ngAfterViewInit(): void {
        // create an intersection observer to start/stop polling when page is active/inactive
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.map((entry) => {
                if (this.currentTab) {
                    if (entry.isIntersecting) {
                        this.polling.allowed = this.polling.enabled = this.channelConf.Config.SearchPollingInterval > 0;
                        if (this.channelConf.Config.SearchPollingInterval) {
                            this.startPolling();
                        } else {
                            this.doAdvancedSearch();
                        }
                    } else {
                        this.stopPolling();
                        this.advancedSearch.show = false;
                    }
                }
            });
        });
        // observe the element
        this.intersectionObserver.observe(this.emailWorkBench.nativeElement);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this.intersectionObserver?.disconnect();
        this.stopPolling();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To check agent features for IsSetBroadcastEnabled
     */
    private checkAgentFeatures(): void {
        try {
            // check the agent features to enable/disable
            SDKClient.getAgentData().featuresList.forEach((f) => {
                // get the featue
                const feature = f.Feature.toLowerCase();

                // switch the feature
                switch (feature) {
                    case AGENT_FEATURES.IsEmailWorkbenchQueueAllowed:
                        this.availableTabs.forEach((x) => {
                            if (x.label === 'Queue') {
                                x.enabled = f.IsEnabled;
                            }
                        });
                        break;
                    case AGENT_FEATURES.IsEmailWorkbenchInboxAllowed:
                        this.availableTabs.forEach((x) => {
                            if (x.label === 'Inbox') {
                                x.enabled = f.IsEnabled;
                            }
                        });
                        break;
                    case AGENT_FEATURES.IsEmailWorkbenchSentAllowed:
                        this.availableTabs.forEach((x) => {
                            if (x.label === 'Sent') {
                                x.enabled = f.IsEnabled;
                            }
                        });
                        break;
                    case AGENT_FEATURES.IsEmailWorkbenchDraftsAllowed:
                        this.availableTabs.forEach((x) => {
                            if (x.label === 'Drafts') {
                                x.enabled = f.IsEnabled;
                            }
                        });
                        break;
                    default:
                }
            });

            // check if any selected tab is disabled, switch to first available tab
            this.availableTabs.forEach((f) => {
                if (!this.currentTab || (this.currentTab === f.key && !f.enabled)) {
                    const firstTab = this.availableTabs.find((x) => x.enabled) as any;
                    this.switchTab(firstTab?.key);
                }
            });
        } catch (error) {}
    }

    /**
     * Sets available mailboxes
     */
    private async setAvailableMailboxes(): Promise<void> {
        if (!this._emailService.globalEmailWorkbenchState$.availableMailboxes.value?.length) {
            await this._emailService.init();
        }
        this.availableMailboxes = this._emailService.globalEmailWorkbenchState$.availableMailboxes.value;
        this._emailService.globalEmailWorkbenchState$.availableMailboxes.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((res) => {
            this.availableMailboxes = res;
        });
    }

    /**
     * To start polling
     */
    private startPolling(): void {
        this.polling$ = timer(0, this.channelConf.Config.SearchPollingInterval)
            .pipe(filter(() => this.polling.enabled && !this.emailSearchRes.loading && !this.polling.active && !this.advancedSearch.show))
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

    getSortedEmails = (emails: Mail[]): Mail[] => {
        const sortKey = this.sortControls.sortBy;
        let sorted: Mail[];
        if (sortKey === 'Date') {
            sorted = sortBy(emails, (k) => k.AddedTime || '');
        } else {
            sorted = sortBy(emails, (k) => (k[sortKey] || '').toLowerCase());
        }
        return this.sortControls.ascending ? sorted : sorted.reverse();
    };

    /**
     * Returns all emails nodes
     * @returns
     */
    getAllEmailNodes(): Mail[] {
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
     * @param mails
     */
    groupNodes(mails?: Mail[]): void {
        if (!mails) {
            mails = this.getAllEmailNodes();
        }
        const byMailList = groupBy(mails, 'Mailbox');
        const selectedUiIds = this.getSelectedEmails().map((x) => x.uiId);
        let nodes: any;
        if (['sentitem', 'draft'].includes(this.currentTab)) {
            nodes = Object.entries(byMailList).reduce((acc, curr) => {
                const [name, children] = curr;
                acc.push({
                    name,
                    children: this.getSortedEmails(
                        children.map((x) => {
                            x.checked = selectedUiIds.includes(x.uiId);
                            return x;
                        })
                    ),
                    Mailbox: name,
                    uiId: `${this.currentTab}_${name}`
                });
                return acc;
            }, []);
        } else {
            nodes = Object.entries(byMailList).map((entry) => {
                const [name, mailList] = entry;
                const groupedNodes = groupBy(mailList, 'Skill');
                let grandChildren = 0;
                const children = Object.entries(groupedNodes).map((n) => {
                    const [nodeName, grandChildrenNodes] = n;
                    grandChildren += grandChildrenNodes.length;
                    return {
                        name: nodeName,
                        children: this.getSortedEmails(
                            grandChildrenNodes.map((x) => {
                                x.checked = selectedUiIds.includes(x.uiId);
                                return x;
                            })
                        ),
                        Mailbox: name,
                        Skill: nodeName,
                        uiId: `${this.currentTab}_${name}_${nodeName}`
                    };
                });
                return {
                    name,
                    children,
                    Mailbox: name,
                    uiId: `${this.currentTab}_${name}`,
                    grandChildren
                };
            });
        }
        this.dataSource.data = nodes;
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Pushes advance search form to advancedSearch.data
     * When the tab is switched, this vallue will be retained in advancedSearch.data
     */
    submitAdvanceSearchForm(): void {
        const searchParams = this.advancedSearch.form.value;
        this.advancedSearch.data[this.currentTab] = {
            data: searchParams,
            changed: !isEqual(searchParams, {
                ...initEmailSearchState,
                listOfMailboxes: this.advancedSearch.data[this.currentTab]?.data.listOfMailboxes ?? []
            })
        };
        this.doAdvancedSearch();
    }

    /**
     * Commits the value from global search control value to globalSearch.data
     * When the tab is swithced, this value will be retained in globalSearch.data
     */
    submitGlobalSearchForm(): void {
        this.globalSearch.data[this.currentTab] = this.globalSearch.form.value;
        this.doAdvancedSearch();
    }

    /**
     * Advanced Search
     * @method advancedSearch
     */
    doAdvancedSearch(silent = false): void {
        try {
            if (!this.data.Data.WorkbenchUrl) {
                this.setComponentState('emails/failure', { msg: 'WorkbenchUrl not provided', silent });
                return;
            }

            if (silent) {
                this.setComponentState('email/polling/active', { silent });
            } else {
                this.setComponentState('emails/loading', { silent });
            }

            const currentSearchFilters = this.advancedSearch.data[this.currentTab];
            const searchFields = this.parseDateFromSearchParams(currentSearchFilters.data);
            let searchParams: any;
            const requests: Observable<any>[] = [];
            const globalKey = this.globalSearch.data[this.currentTab];
            if (globalKey) {
                searchParams = {
                    startDate: searchFields.startDate,
                    endDate: searchFields.endDate,
                    email: globalKey,
                    subject: globalKey,
                    content: globalKey,
                    skills: [globalKey],
                    agent: globalKey,
                    insessionid: '',
                    assignedTo: globalKey,
                    global: 'GLOBAL',
                    listOfMailboxes: this._emailService.globalEmailWorkbenchState$.searchParams.value.listOfMailboxes.join(','),
                    hasAttachments: 2,
                    replied: 2,
                    closed: 2,
                    assigned: 2
                };
                requests.push(this.http.post(`${this.data.Data.WorkbenchUrl}/${this.currentTab}/search`, searchParams));
            }
            if (!globalKey || (globalKey && this.advancedSearch.data[this.currentTab].changed)) {
                searchParams = {
                    global: '',
                    skills: [],
                    email: searchFields.email,
                    agent: searchFields.agent || '',
                    startDate: searchFields.startDate,
                    endDate: searchFields.endDate,
                    subject: searchFields.subject,
                    content: searchFields.content,
                    listOfMailboxes: searchFields.listOfMailboxes.join(',')
                };
                if (this.currentTab === 'inbox') {
                    searchParams.assignedTo = searchFields.assignedTo;
                    searchParams.hasAttachments = searchFields.hasAttachments;
                    searchParams.replied = searchFields.replied;
                    searchParams.closed = searchFields.closed;
                    searchParams.assigned = searchFields.assigned;
                }
                if (this.currentTab !== 'queue') {
                    searchParams.insessionid = searchFields.inSessionId;
                    searchParams.listOfMailboxes = searchFields.listOfMailboxes.join(',');
                }
                requests.push(this.http.post(`${this.data.Data.WorkbenchUrl}/${this.currentTab}/search`, searchParams));
            }

            const maps: Record<AvailableTabs, any> = {
                inbox: this.mapInboxEmails,
                queue: this.mapQueuedEmails,
                sentitem: this.mapSentItemsEmails,
                draft: this.mapDraftEmails
            };

            this.advancedSearch.sub$ = forkJoin(requests)
                .pipe(
                    timeout(50000),
                    map((res: any) => {
                        if (res.find((x: any) => x.status !== 'SUCCESS')) {
                            throwADError(
                                'Error in WorkbenchEmailComponent.doAdvancedSearch',
                                `Request to fetch ${this.currentTab} mails failed with response : \n ${JSON.stringify(res, null, 2)}`
                            );
                        }
                        const mails = res.map((x) => x.result || []).flat();
                        return maps[this.currentTab](mails);
                    })
                )
                .subscribe({
                    next: (res: Mail[]) => {
                        const uniqMails = uniqBy(res, ['sentitem', 'draft'].includes(this.currentTab) ? 'OutSessionId' : 'InSessionId');
                        const mails = uniqMails.map((mailRes) => {
                            mailRes.Subject = this.appUiService.sanitizeEmailBody(mailRes.Subject || '')['changingThisBreaksApplicationSecurity'];
                            return mailRes;
                        });
                        this.groupNodes(mails || []);
                        if (!this.openEmailRes?.data) {
                            this.emailBodies = {};
                        }
                        this.setComponentState('emails/success', { silent });
                    },
                    error: (e) => {
                        console.error(e);
                        this.setComponentState('emails/failure', { silent });
                        this.setComponentState('email/polling/inactive', { silent });
                    },
                    complete: () => {
                        this.setComponentState('email/polling/inactive', { silent });
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
    async deleteEmails(emails: Mail[]): Promise<void> {
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
                            conversationId: e.ConversationID || ''
                        }))
                    })
                    .pipe(takeUntil(this.unsubscribeAll));
                const res: any = await res$.pipe(take(1)).toPromise();
                if (res.status !== 'SUCCESS') {
                    throw new Error(`Unable to delete emails ${sessionIds.join(',')}`);
                }
            }
            if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
                this.openEmailRes.data.next(null);
            }
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
    async closeEmails(emails: Mail[]): Promise<void> {
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
            if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
                this.openEmailRes.data.next(null);
            }
            this.appUiService.showSnackbar('Emails closed successfully', 'success');
            // deselect all the emails
            emails.forEach((f) => (f.checked = false));
            setTimeout(() => {
                this.doAdvancedSearch(true);
                loader.dismiss();
            }, 1000);
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
    pullEmails(emails: Mail[]): void {
        const loader = this.appUiService.showSnackbar('Pulling email', 'loading');
        try {
            const { agentId, tmacServer } = SDKClient.getAgentData();
            const { items, uiIds } = emails.reduce(
                (acc, curr) => {
                    const item = {
                        routeId: curr.RouteId || '',
                        sessionId: curr.InSessionId,
                        inSessionId: curr.InSessionId,
                        conversationId: curr.ConversationID || '',
                        mailbox: curr.Mailbox
                    };
                    if (this.currentTab === 'draft') {
                        item.sessionId = curr.OutSessionId;
                    } else if (this.currentTab === 'queue' && curr.EmailType !== 'Dummy' && OUTBOX_REASONS.includes(curr.RouteReason)) {
                        item.sessionId = `${curr.InSessionId}|${curr.OutSessionId}`;
                    } else if (this.currentTab === 'sentitem') {
                        item.sessionId = `${curr.InSessionId}|${curr.OutSessionId}`;
                        // item.inSessionId = curr.OutSessionId;
                    }
                    delete this.emailBodies[curr.InSessionId];
                    delete this.emailBodies[curr.OutSessionId];
                    acc.items.push(item);
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
                        if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
                            this.openEmailRes.data.next(null);
                        }
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
     * opens email for preview
     */
    async openEmail(email: Mail): Promise<void> {
        try {
            this.openEmailRes.data.next(Object.assign(email, { Body: '' }, { currentTab: this.currentTab }));
            this.setComponentState('email/open/loading');
            let fetchFromOutbox =
                (this.currentTab === 'draft' || this.currentTab === 'sentitem' || email.RouteReason === 'CheckerQueue') && this.latestEmailPreview;
            let inboxRes: EmailInboxModel;
            let outboxRes: EmailOutboxModel;

            const getRequestedSession = () => (fetchFromOutbox ? email.OutSessionId : email.InSessionId);

            const getAttachments = (attachments: any[]): any[] => {
                // check if attachements are there
                if (attachments && attachments.length) {
                    return attachments.map((item: any) => {
                        let uploadedName = item.URL.split('/').pop();
                        if (!item.Name) {
                            // get the file name from URL
                            uploadedName = uploadedName.replace(getRequestedSession(), '');
                            item.Name = uploadedName;
                        }
                        item.Ext = item.Name.split('.').pop();
                        item.Icon = maticonByExtension(item.Ext);
                        return item;
                    });
                }
                return [];
            };

            // checking if email has been cached for the currentTab
            if (!this.emailBodies[email.InSessionId]) {
                // inbox call is always made no matter which tab
                // because if we're in inbox its necessary and if we're not then
                // the customer might want to view the original inbox email
                inboxRes = (await SDKClient.getInboxEmail(email.InSessionId)).response;
                // a dummy emailtype means that the email was composed by server for server use only
                // checking if user is trying to open a dummy email in a one of the non outbox tabs
                // and if so, logging an error since the UI is requiesting dummy email which is "server user only"
                //  and try to fetch the email from outbox
                if (!inboxRes || inboxRes?.EmailType === 'Dummy') {
                    if (this.currentTab === 'queue') {
                        fetchFromOutbox = true;
                    } else if (!fetchFromOutbox) {
                        throwADError('Error in WorkbenchEmailComponent.getInboxEmail', 'Unexpected Response from server');
                    }
                } else {
                    this.emailBodies = Object.assign(this.emailBodies, {
                        [email.InSessionId]: {
                            Files: getAttachments(inboxRes.Attachments),
                            AgentName: inboxRes.AgentName,
                            Intent: inboxRes.Intent,
                            RepliedStatus: inboxRes.RepliedStatus === '1' ? 'Replied' : 'Not Replied',
                            ConversationID: inboxRes.ConversationID,
                            CurrentStatus: inboxRes.CurrentStatus,
                            ClosedBy: inboxRes.ClosedBy,
                            CCList: inboxRes.CCList,
                            From: inboxRes.From,
                            Priority: inboxRes.Priority,
                            ToList: inboxRes.ToList,
                            Body: this.appUiService.sanitizeEmailBody(inboxRes.Body || '')['changingThisBreaksApplicationSecurity'],

                            InSessionId: email.InSessionId,
                            OutSessionId: email.OutSessionId,
                            EmailType: inboxRes?.EmailType
                        }
                    });
                }
            }

            if (fetchFromOutbox && !this.emailBodies[email.OutSessionId]) {
                outboxRes = (await SDKClient.getOutboxEmail(email.OutSessionId)).response;
                if (!outboxRes) {
                    throwADError('Error in WorkbenchEmailComponent.getOutboxEmail', 'Unexpected Response from server');
                }

                this.emailBodies = Object.assign(this.emailBodies, {
                    [email.OutSessionId]: {
                        Files: getAttachments(outboxRes.Attachments),
                        AgentName: outboxRes.AgentName,
                        ConversationID: outboxRes.ConversationID,
                        CurrentStatus: outboxRes.CurrentStatus,
                        ClosedBy: (inboxRes as any)?.ClosedBy,
                        CCList: outboxRes.CCList,
                        From: outboxRes.From,
                        ToList: outboxRes.ToList,
                        Body: this.appUiService.sanitizeEmailBody(outboxRes.Body || '')['changingThisBreaksApplicationSecurity'],

                        InSessionId: email.InSessionId,
                        OutSessionId: email.OutSessionId,

                        Priority: inboxRes?.Priority,
                        RepliedStatus: inboxRes?.RepliedStatus === '1' ? 'Replied' : 'Not Replied',
                        Intent: inboxRes?.Intent
                    }
                });
            }

            this.openEmailRes.data.next(Object.assign(email, this.emailBodies[getRequestedSession()], { currentTab: this.currentTab }));
            this.emailBodies = {};
            // this.previewEmailRef?.setEmailBody(this.openEmailRes.data?.value?.Body);
            // this.previewEmailRef.setEmailBody(this.emailBodies[requestedSession].Body);
            // this.emailInfo$.next(this.getSelectedEmailInfo());
            this.setComponentState('email/open/success');
        } catch (e) {
            console.error(e);
            this.setComponentState('email/open/failure');
        }
    }

    /**
     * Switches tabs
     * @param {AvailableTabs} tab tab key passed as argument
     */
    switchTab(tab: AvailableTabs): void {
        this.advancedSearch.show = false;
        this.advancedSearch.sub$?.unsubscribe();
        this.dataSource.data = [];
        this.openEmailRes.data.next(null);
        this.emailBodies = {};
        this.currentTab = tab ?? '';
        if (tab) {
            this.latestEmailPreview = tab === 'draft' || tab === 'sentitem';
            if (this.advancedSearch.data[tab]) {
                this.advancedSearch.form.setValue(this.advancedSearch.data[tab].data);
                this.globalSearch.form.setValue(this.globalSearch.data[tab]);
            } else {
                this.resetForm();
                this.advancedSearch.data[tab] = {
                    data: this.advancedSearch.form.value,
                    changed: false
                };
                this.globalSearch.form.setValue('');
                this.globalSearch.data[tab] = this.globalSearch.form.value;
            }
            this.doAdvancedSearch();
        }
    }

    /**
     * Marks currently selected email as spam
     */
    async markAsSpam(email: Mail): Promise<void> {
        let loader;
        try {
            const confirmDialogRef = this.appUiService.showAppConfirmDialog('generic', 'Confirm Spam', 'Are you sure to mark this email as spam?');
            const dialogResult = await confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)).pipe(take(1)).toPromise();
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
                if (email.uiId === this.openEmailRes.data?.value?.uiId) {
                    this.openEmailRes.data.next(null);
                }
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
    transferEmail(emails: Mail[]): void {
        const config = this.channelConf?.Config || {};
        const agentConfig = config?.Transfer?.Agent || {};
        const skillConfig = config?.Transfer?.Skill || {};
        const uiIds = emails.map((e) => e.uiId);
        const data: AgentSkillListData = {
            title: 'Email Transfer',
            type: 'transferEmail',
            agent: {
                allowed: agentConfig.Allowed,
                consult: agentConfig.Consult,
                blind: agentConfig.Blind,
                comments: agentConfig.Comments,
                source: agentConfig.Source,
                allowedStates: agentConfig.AllowedStates,
                columns: agentConfig.Columns,
                teamFilter: agentConfig.TeamFilter
            },
            skill: {
                allowed: skillConfig.Allowed,
                consult: skillConfig.Consult,
                blind: skillConfig.Blind,
                comments: skillConfig.Comments,
                source: skillConfig.Source,
                channelPrfix: skillConfig.ChannelPrefix,
                columns: skillConfig.Columns
            },
            callback: ({ success }) => {
                if (success) {
                    this.doAdvancedSearch(true);
                    if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
                        this.openEmailRes.data.next(null);
                    }
                }
            }
        };
        const sessionKey = this.getCurrentSessionKey();
        this.matDialog.open(AgentSkillListComponent, {
            data: {
                ...data,
                otherData: {
                    type: 'transfer',
                    emails: emails.map((e) => ({
                        ...e,
                        SessionId: e[sessionKey]
                    }))
                }
            },
            panelClass: ['agent-skill-dialog', 'twd-w-11/12', 'twd-h-10/12', 'lg:twd-w-7/12', 'lg:twd-h-8/12', 'xl:twd-w-6/12', '2xl:twd-w-5/12'],
            minWidth: '30%',
            maxWidth: '100%',
            disableClose: true
        });
    }

    /**
     * Closes emails in bulk
     * @param {any} emails email list
     */
    replyToSelectedEmails(emails: Mail[]): void {
        try {
            const widget = new TwWidgetModel('Reply', 'tw-panel');
            widget.Config.Anchor = true;
            widget.Config.Position.W = 800;
            widget.Config.Position.H = 500;
            widget.Config.Actions = ['maximize', 'collapse', 'destroy'];
            this.replyEditorModal = {
                sendEmail: async (email) => {
                    try {
                        const reply = email.Body;
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
                            if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
                                this.openEmailRes.data.next(null);
                            }
                            // deselect all the emails
                            emails.forEach((f) => (f.checked = false));
                            setTimeout(() => {
                                this.doAdvancedSearch(true);
                            }, 1000);
                            this.setComponentState('email/reply/success');
                            this._aotWidgetService.destroyWidget(widget.ID);
                        } else {
                            this.appUiService.showSnackbar('Email cannot be empty', 'failure');
                        }
                    } catch (e) {
                        console.error(e);
                        this.setComponentState('email/reply/failure');
                    }
                },
                sendingEmail: null,
                templateRef: this.ReplyEditorDialog
            };
            widget.Data = this.replyEditorModal;
            this._aotWidgetService.addWidget(widget);
        } catch (e) {
            console.error(e);
            this.setComponentState('email/reply/failure');
        }
    }

    /**
     * Resets advance search form
     */
    resetForm(): void {
        let updateValue = {} as any;

        try {
            // check if search duration is configured, then patch the from datetime value
            if (this.channelConf.Config.SearchDuration) {
                const fromDate = addHours(new Date(), -this.channelConf.Config.SearchDuration);
                updateValue = {
                    fromDate,
                    fromTime: format(fromDate, 'HH:mm')
                };
            }
        } catch (error) {}

        this._emailService.resetEmailState(updateValue);

        this.advancedSearch.data[this.currentTab] = {
            data: this.advancedSearch.form.value,
            changed: false
        };
    }

    /**
     * Resets global search key
     */
    resetGlobalSearchForm(): void {
        this.globalSearch.form.setValue('');
        this.globalSearch.data[this.currentTab] = '';
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
                this.openEmailRes.data.next(null);
                this.advancedSearch.snackbarRef = this.appUiService.showSnackbar('Loading emails', 'loading');
                break;

            case 'emails/success':
                this.emailSearchRes.loading = false;
                this.emailSearchRes.error = false;
                this.advancedSearch.snackbarRef?.dismiss();
                // if (!payload?.silent) {
                //     this.appUiService.showSnackbar('Emails loaded', 'success', 'top', 'center', 3000);
                // }
                break;

            case 'emails/failure':
                this.emailSearchRes.loading = false;
                this.emailSearchRes.msg = 'Error occured while fetching emails';
                this.emailSearchRes.error = true;
                this.appUiService.showSnackbar('Unable to load emails', 'failure');
                break;

            case 'email/reply/loading':
                this.replyEditorModal.sendingEmail = this.appUiService.showSnackbar('Replying to email', 'loading');
                break;
            case 'email/reply/success':
                if (this.replyEditorModal.sendingEmail) {
                    this.replyEditorModal.sendingEmail.dismiss();
                    this.replyEditorModal.sendingEmail = null;
                }
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
                this.polling.failed = false;
                this.polling.active = true;
                break;
            case 'email/polling/inactive':
                this.polling.failed = false;
                this.polling.active = false;
                break;
            case 'email/polling/failed':
                this.polling.failed = true;
                this.polling.active = false;
                break;
            case 'email/open/success':
                this.openEmailRes.loading = false;
                this.openEmailRes.error = false;
                break;
            case 'email/open/failure':
                this.openEmailRes.loading = false;
                this.openEmailRes.error = true;
                this.appUiService.showSnackbar('Unable to open email', 'failure');
                break;
            case 'email/open/loading':
                this.openEmailRes.loading = true;
                this.openEmailRes.error = false;
                break;

            default:
                break;
        }
        if (!payload?.silent) {
            this.advancedSearch.show = false;
        }
    }

    /**
     * Trackby for mat tree node
     * @param _index
     * @param email
     * @returns
     */
    trackBy = (_index: number, email: Mail): string => {
        return email.uiId;
    };

    /**
     * Iframe event when loaded , loads the email inside it
     * @param iframe
     */
    loadEmailInIframe(iframe: HTMLIFrameElement): void {
        const frag = document.createRange().createContextualFragment(this.openEmailRes.data.value?.Body);
        const doc = iframe.contentDocument || iframe.contentWindow;
        (doc as any).body.appendChild(frag);
    }

    /**
     * This method is used to formate the email list reponse from the queue search
     * @param {any} result This is the response form the queue search
     * @returns {Mail[]} returns mapped emails parsed into Mail type
     */
    mapQueuedEmails = (result: any): Mail[] => {
        if (!result || !result.length) {
            return [];
        }
        return result.reduce((acc, curr): Mail => {
            let data: any;
            if (typeof curr.data === 'string') {
                try {
                    data = JSON.parse(curr.data);
                } catch (e) {
                    this.logger.error('Invalid Queue Data', e);
                    console.error(e);
                }
            } else {
                data = curr;
            }
            if (data) {
                acc.push({
                    Mailbox: this.availableMailboxes.find((x) => x.includes(data.To) || data.To.includes(x)) || data.To,
                    Subject: data.Subject,
                    From: data.From,
                    RouteId: data.RouteId,
                    Skill: curr.skillName || curr.skillId,
                    ToList: data.To,
                    InSessionId: data.SessionId,
                    OutSessionId: data.OutSessionId,
                    HasAttachment: data.HasAttachment,
                    IsEmailProbableSpam: data.IsEmailProbableSpam,
                    AddedTime: new Date(curr.addedTime),
                    uiId: `${data.SessionId}|${data.OutSessionID}`,
                    ConversationID: curr.conversationID,
                    RouteReason: data.RouteReason
                });
            }
            return acc;
        }, []);
    };

    /**
     * This method is used to formate the email list reponse from the inbox search
     * @param {any} result This is the response form the inbox search
     * @returns {Mail[]} returns mapped emails parsed into Mail type
     */
    mapInboxEmails = (result: any): Mail[] => {
        if (!result || !result.length) {
            return [];
        }
        return result.map((x: any): Mail => {
            const AddedTime = new Date(x.receivedDate);
            if (!x.receivedTime) {
                console.log('Unable to split x.receivedTime', x);
            }
            const time = x.receivedTime.split(':');
            AddedTime.setHours(time[0]);
            AddedTime.setMinutes(time[1]);
            return {
                Mailbox: x.mailbox,
                ToList: x.toList,
                Skill: x.makerSkillName,
                Subject: x.subject,
                From: x.from,
                RouteId: x.routeId,
                InSessionId: x.sessionID,
                AddedTime,
                uiId: x.sessionID,
                OutSessionId: '',
                HasAttachment: x.hasAttachments,
                ConversationID: x.conversationID,
                // not available in inbox search
                IsEmailProbableSpam: x.IsEmailProbableSpam
            };
        });
    };

    /**
     * This method is used to formate the email list reponse from the draft search
     * @param {any} result This is the response form the draft search
     * @returns {Mail[]} returns mapped emails parsed into Mail type
     */
    mapDraftEmails = (result: any): Mail[] => {
        if (!result || !result.length) {
            return [];
        }
        return result.map((x: any): Mail => {
            const AddedTime = new Date(x.currentStatusDate);
            if (!x.currentStatusTime) {
                console.log('Unable to split x.currentStatusTime', x);
            }
            const time = x.currentStatusTime.split(':');
            AddedTime.setHours(time[0]);
            AddedTime.setMinutes(time[1]);
            return {
                Mailbox: x.mailbox,
                ToList: x.toList,
                Skill: x.makerSkillName || x.cmSkill,
                Subject: x.subject,
                From: x.from,
                AddedTime,
                OutSessionId: x.sessionID,
                InSessionId: x.inSessionID,
                uiId: `${x.inSessionID}|${x.sessionID}`,
                RouteId: x.routeId,
                HasAttachment: x.HasAttachment,
                ConversationID: x.conversationID,
                // not available in drafts search
                IsEmailProbableSpam: x.IsEmailProbableSpam
            };
        });
    };

    /**
     * This method is used to formate the email list reponse from the sent items search
     * @param {any} result This is the response form the sent items search
     * @returns {Mail[]} returns mapped emails parsed into Mail type
     */
    mapSentItemsEmails = (result: any): Mail[] => {
        if (!result || !result.length) {
            return [];
        }
        return result.map((x: any): Mail => {
            const AddedTime = new Date(x.sendDate);
            if (!x.sendTime) {
                console.log('Unable to split x.sendTime', x);
            }
            const time = x.sendTime.split(':');
            AddedTime.setHours(time[0]);
            AddedTime.setMinutes(time[1]);
            return {
                Mailbox: x.mailbox,
                ToList: x.toList,
                Skill: x.makerSkillName || x.cmSkill,
                Subject: x.subject,
                From: x.mailbox,
                AddedTime,
                OutSessionId: x.sessionID,
                InSessionId: x.inSessionID,
                uiId: `${x.inSessionID}|${x.sessionID}`,
                RouteId: x.routeId,
                HasAttachment: x.HasAttachment,
                ConversationID: x.conversationID,
                // not available in inbox search
                IsEmailProbableSpam: x.IsEmailProbableSpam
            };
        });
    };

    /**
     * This method is used to parse the date from the search params
     * @param {any} searchParams
     * @returns {any} returns the search params for the advanced search
     */
    parseDateFromSearchParams(searchParams: any): any {
        const searchFields = searchParams;

        let startDate: any = '';
        let endDate: any = '';

        if (searchFields.fromDate) {
            startDate = new Date(searchFields.fromDate);
            startDate.setHours(searchFields.fromTime?.split(':')[0] || '00');
            startDate.setMinutes(searchFields.fromTime?.split(':')[1] || '00');
            startDate.setSeconds(0);
            startDate = formatDate(startDate, 'yyyyMMddHHmmss');
        }

        if (searchFields.toDate) {
            endDate = new Date(searchFields.toDate);
            endDate.setHours(searchFields.toTime?.split(':')[0] || '00');
            endDate.setMinutes(searchFields.toTime?.split(':')[1] || '00');
            endDate.setSeconds(0);
            endDate = formatDate(endDate, 'yyyyMMddHHmmss');
        }

        return { ...searchParams, endDate, startDate };
    }

    /**
     * This method returns a list of selected emails
     * @returns Emails that are selected or checked
     */
    getSelectedEmails = () => this.getAllEmailNodes().filter((n) => n.checked);

    /**
     * This method is used to fill the checked and indeterminate inputs to checkbox,
     * which is used for bulk selection
     * @param {Mail[]} mails if this isnt passed, all the emails across all folders are used for this check
     * @returns {{all :boolean , some : boolean}} all when all emails selected under the folder or some when some selected
     */
    getEmailChecks = (
        mails?: Mail[]
    ): {
        /**
         * flag if all emails selected
         */
        all: boolean;
        /**
         * flag if some emails selected
         */
        some: boolean;
    } => {
        const allEmails = mails ?? this.getAllEmailNodes();
        const checks = { all: false, some: false };
        if (allEmails.length) {
            checks.all = allEmails.every((n) => n.checked);
            checks.some = allEmails.some((n) => n.checked) && !checks.all;
        }
        return checks;
    };

    /**
     * Selects emails for folders
     * @param {boolean} checked state of the checkbox
     * @param {Mail[]} emails if this isnt passed, all the emails across all folders are used for this check
     */
    selectEmails = (checked: boolean, emails?: Mail[]) => {
        const mails = emails ?? this.getAllEmailNodes();
        for (const n of mails) {
            n.checked = checked;
        }
    };

    // /**
    //  * Returns selected email info for rerender between switcher view
    //  * @returns {any}
    //  */
    // getSelectedEmailInfo(): any {
    //     return Object.assign({}, this.openEmailRes.data);
    // }
}

// for more info visit - https://angular.io/api/core
