import {
    AgentSkillListData,
    AgentTransferConferenceConfig,
    AOTWidget,
    SkillTransferConferenceConfig,
    TwEmailWorkbenchConfig,
    TwWorkbenchPanelChannel,
    TwWorkbenchPanelGeneral
} from '@ad/types';
import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { fuseAnimations } from '@fuse/animations';
import { AgentSkillListComponent, SnackbarComponent } from '@modules/shared/components';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { AppDataService } from '@services/app-data.service';
import { EmailInboxModel, EmailOutboxModel, SDKClient, TUtils } from '@tmac/sdk';
import { AGENT_FEATURES, DRAFT_REASONS, INBOX_REASONS, OUTBOX_REASONS, SENT_REASONS } from 'app/constants';
import { EmailComponentInputs, IWidget, ResData, MediaStreamerMultiResponse, MediaStreamerMetaResponse } from 'app/interfaces';
import { AgentSkillListDataModel, TwWidgetModel } from 'app/models';
import { maticonByExtension, throwADError } from 'app/utils';
import { addHours, format, format as formatDate } from 'date-fns';
import { groupBy, isEqual, merge, sortBy, uniqBy } from 'lodash';
import { BehaviorSubject, forkJoin, Observable, Subscription, timer } from 'rxjs';
import { filter, map, take, takeUntil, timeout } from 'rxjs/operators';
import { EmailService, initEmailSearchState } from '../email.service';
import { TranslocoService } from '@ngneat/transloco';

/**
 * Type of the mail node
 */
export class Mail {
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
    InternetHeaders?: string;
}

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
    | 'email/polling/inactive'
    | 'emails/search'
    | 'emails/search/failure';

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
    @Input() data: IWidget<TwWorkbenchPanelGeneral>;
    /**
     * holds all the data related to this workbench tab
     */
    @Input() channelConf: TwWorkbenchPanelChannel;

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

    selectedEmailInSessionId: string;
    selectedEmailOutSessionId: string;
    selectedEmailRouteReason: string;

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
    // currentTab: 'sentitem' | 'draft' | 'inbox' | 'queue';
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
        { label: this.translocoService.translate('sharedComponents.email.queueLabel'), enabled: true, icon: 'queue', key: 'queue' },
        { label: this.translocoService.translate('sharedComponents.email.inboxLabel'), enabled: true, icon: 'mail', key: 'inbox' },
        { label: this.translocoService.translate('sharedComponents.email.sentLabel'), enabled: true, icon: 'mark_email_read', key: 'sentitem' },
        { label: this.translocoService.translate('sharedComponents.email.draftsLabel'), enabled: true, icon: 'drafts', key: 'draft' }
    ];

    /**
     * Flag enabled when no tabs are visible
     */
    noTabsAvailable = true;

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
     * Flag to show email internet headers
     */
    showInternetHeaders = false;

    /**
     * Disable advance Search submit button
     */
    disableBtn: Boolean = false;
    /**
     * File upload url config
     */
    fileUploadUrl: any;
    /**
     * Constructor
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private http: HttpClient,
        private appUiService: AppUiService,
        private matDialog: MatDialog,
        private emailDialog: MatDialog,
        private _emailService: EmailService,
        private _aotWidgetService: AOTWidgetService,
        private _agentFeaturesService: AgentFeaturesService,
        private _appUIService: AppUiService,
        private translocoService: TranslocoService,
        private _appDataService: AppDataService
    ) {
        super('WorkbenchEmailComponent');
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
        // set the flag whether to get the email templates by departments by team
        this._emailService.emailTemplatesDepartmentsByTeam = !!(this.channelConf.Config as TwEmailWorkbenchConfig).TemplatesByTeam;
        // set the flag whether to get the email templates by departments by hierarchy
        this._emailService.emailTemplatesDepartmentsByHierarchy = !!(this.channelConf.Config as TwEmailWorkbenchConfig).TemplatesByTeam;
        // get the allowed tabs from config
        const allowedTabs = (this.channelConf.Config as TwEmailWorkbenchConfig)?.Tabs?.map((m: string) => m.toLowerCase()) ?? [];
        if (allowedTabs.length) {
            // filter the allowed tabs given in config
            this.availableTabs.forEach((f) => {
                f.enabled = allowedTabs.includes(f.label.toLowerCase());
                if (f.enabled) {
                    this.noTabsAvailable = false;
                }
            });
        } else {
            this.noTabsAvailable = false;
        }
        // subscribe to agent features to check for the allowed tabs realtime
        this._agentFeaturesService.features.pipe(takeUntil(this.unsubscribeAll)).subscribe((change: boolean) => {
            if (change) {
                this.checkAgentFeatures();
            }
        });

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fileUploadUrl = config.Main.Urls?.FileServerUrl || null;
        });

        // check for the agent features
        this.checkAgentFeatures();

        // set the flags to check if delete and queue transfers are allowed for the agent
        const { agentProfile } = SDKClient.getAgentData();
        // delete is not allowed for agents
        this.deleteAllowed = (this.channelConf.Config as TwEmailWorkbenchConfig).DeleteAllowed && agentProfile === 'S';
        // queue transfer allowed via config or if the user is a supervisor
        this.allowQueueTransfer = (this.channelConf.Config as TwEmailWorkbenchConfig)?.QueueTransferForAgent ? true : agentProfile === 'S';
        // set the current tab
        this.currentTab = this.availableTabs.find((f) => f.enabled)?.key ?? '';
        if (this.currentTab) {
            this.advancedSearch.data[this.currentTab] = { data: this.advancedSearch.form.value, changed: false };
            this.globalSearch.data[this.currentTab] = this.globalSearch.form.value;
        }
        this.showInternetHeaders = (this.channelConf.Config as TwEmailWorkbenchConfig)?.InternetHeadersAllowed;
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
                        // check if polling is enabled in config or not
                        // polling is disabled when it is set to 0
                        this.polling.allowed = this.polling.enabled = (this.channelConf.Config as TwEmailWorkbenchConfig).SearchPollingInterval > 0;
                        if ((this.channelConf.Config as TwEmailWorkbenchConfig).SearchPollingInterval) {
                            this.startPolling();
                        } else {
                            // if polling is disabled, do an advanced search only once
                            this.doAdvancedSearch();
                        }
                    } else {
                        // stop polling when not in view
                        this.stopPolling();
                        this.advancedSearch.show = false;
                    }
                }
            });
        });
        // observe the host element
        this.intersectionObserver.observe(this.emailWorkBench.nativeElement);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // disconnect the observer
        this.intersectionObserver?.disconnect();
        // stop the polling
        this.stopPolling();
    }

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

            // check if currently selected tab is disabled, switch to first available tab
            const { firstAvailableTab, isCurrentTabDisabled, noTabAvailable } = this.availableTabs.reduce(
                (acc, curr) => {
                    if (curr.enabled) {
                        acc.noTabAvailable = false;
                    }
                    if (!acc.firstAvailableTab && curr.enabled) {
                        acc.firstAvailableTab = curr.key;
                    }
                    if (curr.key === this.currentTab) {
                        acc.isCurrentTabDisabled = curr.enabled;
                    }
                    return acc;
                },
                { firstAvailableTab: '', isCurrentTabDisabled: false, noTabAvailable: true }
            );

            this.noTabsAvailable = noTabAvailable;
            if (isCurrentTabDisabled) {
                this.currentTab = firstAvailableTab;
            }
        } catch (error) {}
    }

    /**
     * Sets available mailboxes
     */
    private async setAvailableMailboxes(): Promise<void> {
        // check if mailboxes are set, if not, initialize the workench service which will do it for us
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
        // polling timer
        this.polling$ = timer(0, (this.channelConf.Config as TwEmailWorkbenchConfig).SearchPollingInterval)
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

    /**
     * returns sorted emails based on the filters applied
     * @returns {Mail[]}
     */
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
        this.disableBtn = false;

        if (!mails) {
            mails = this.getAllEmailNodes();
        }
        const byMailList = groupBy(mails, 'Mailbox');
        const selectedUiIds = this.getSelectedEmails().map((x) => x.uiId);
        let nodes: any;
        // sentitem and draft grouping is simple tree of 2 level height ie mailbox -> mails
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
        }
        // inbox and queue have a tree of 3 level height ie mailbox -> intent -> mails
        else {
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
                            // iterate over the emails to retain the checked status of the email
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
            const errorInDate = this.checkForErrorInDate();
            if (errorInDate) {
                switch (errorInDate.type) {
                    case 'INVALID_RANGE':
                        this.setComponentState('emails/search/failure', {
                            msg: 'From date can not be greater than To Date, Please select valid dates'
                        });
                        return;
                    case 'OUT_OF_RANGE':
                        const searchRange = (this.channelConf.Config as TwEmailWorkbenchConfig)?.MaxSearchRange
                            ? (this.channelConf.Config as TwEmailWorkbenchConfig).MaxSearchRange
                            : 30;
                        this.setComponentState('emails/search/failure', { msg: 'Please select dates within the range of ' + searchRange + ' days' });
                        return;
                }
            }

            if (!this.data.Data.WorkbenchUrl) {
                this.setComponentState('emails/failure', {
                    msg: this.translocoService.translate('sharedComponents.email.workbenchURLNotFound'),
                    silent
                });
                return;
            }

            if (silent) {
                this.setComponentState('email/polling/active', { silent });
            } else {
                this.setComponentState('emails/loading', { silent });
            }
            this.disableBtn = true;
            const currentSearchFilters = this.advancedSearch.data[this.currentTab];
            const searchFields = this.parseDateFromSearchParams(currentSearchFilters.data);
            let searchParams: any;
            const requests: Observable<any>[] = [];
            const globalKey = this.globalSearch.data[this.currentTab];
            if (globalKey) {
                searchParams = {
                    subject: globalKey,
                    content: this.currentTab !== 'queue' ? globalKey : undefined,
                    global: 'GLOBAL',
                    listOfMailboxes: this._emailService.globalEmailWorkbenchState$.searchParams.value.listOfMailboxes.join(','),
                    hasAttachments: 2,
                    replied: 2,
                    closed: 2,
                    assigned: 2,
                    startDate: searchFields.startDate,
                    endDate: searchFields.endDate,
                    skills: []
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
                        this.disableBtn = false;
                        if (res.find((x: any) => x.status !== 'SUCCESS')) {
                            const resultStr = JSON.parse(JSON.stringify(res.find((x) => x.status !== 'SUCCESS'))?.toLowerCase());

                            if (resultStr?.errorcode && resultStr.errorcode == '-101') {
                                this.appUiService.showSnackbar(
                                    'Number of emails present in the search has reached maximum limit, Please select a shorter date range',
                                    'warning'
                                );
                                return;
                            }

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
        const loader = this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.deleteEmailLoading'), 'loading');
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
            this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.deleteEmailFailed'), 'failure');
        }
    }

    /**
     * Closes emails in bulk
     * @param {any} emails email list
     */
    async closeEmails(emails: Mail[]): Promise<void> {
        const loader = this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.closeEmailLoading'), 'loading');
        try {
            if (this.currentTab === 'queue') {
                const routeIds = emails.map((curr) => {
                    if (this.openEmailRes.data?.value?.uiId === curr.uiId) {
                        this.openEmailRes.data.next(null);
                    }
                    return curr.RouteId;
                });
                await SDKClient.closeBulkEmailsInQueue(routeIds.join(','));
            } else {
                await Promise.all(
                    emails.map((curr) => {
                        if (this.openEmailRes.data?.value?.uiId === curr.uiId) {
                            this.openEmailRes.data.next(null);
                        }
                        return SDKClient.changeEmailStatus({
                            routeId: curr.RouteId,
                            sessionId: curr.InSessionId,
                            status: ['sentitem', 'draft'].includes(this.currentTab) ? `Outbox,Closed,sent,${curr.OutSessionId}` : 'Close'
                        });
                    })
                );
            }
            this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.closeEmailSuccess'), 'success');
            // deselect all the emails
            emails.forEach((f) => (f.checked = false));
            setTimeout(() => {
                this.doAdvancedSearch(true);
                loader.dismiss();
            }, 1000);
        } catch (e) {
            console.error(e);
            loader.dismiss();
            this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.closeEmailFailed'), 'failure');
        }
    }

    /**
     * Pull email
     * @method pullEmail
     */
    async pullEmails(emails: Mail[]): Promise<void> {
        let archivedAttachments = emails.find((e) => {
            let filesInArchive = e.Files.find((f) => {
                return f.ArchiveStatus || f.FileError;
            });
            if (filesInArchive) {
                return true;
            } else {
                return false;
            }
        });

        let pullEmailOp = () => {
            const loader = this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.pullEmailLoading'), 'loading');
            try {
                const { agentId, tmacServer } = SDKClient.getAgentData();
                if (emails.find((email) => !email.InSessionId)) {
                    this.getValidDataForSelectedEmail();
                    return;
                }
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
                            item.sessionId = curr.OutSessionId ? `${curr.InSessionId}|${curr.OutSessionId}` : curr.InSessionId;
                        } else if (this.currentTab === 'sentitem') {
                            item.sessionId = curr.OutSessionId ? `${curr.InSessionId}|${curr.OutSessionId}` : curr.InSessionId;
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
                                // console.error(res);
                                loader.dismiss();
                                const isAlreadyPulled = res.failedList.items.filter((f) => f.responseCode === -405);
                                if (isAlreadyPulled.length) {
                                    if (isAlreadyPulled.length > 1) {
                                        if (isAlreadyPulled.length === emails.length) {
                                            this.appUiService.showSnackbar(
                                                this.translocoService.translate('sharedComponents.email.emailsAssigned'),
                                                'failure'
                                            );
                                        } else {
                                            this.appUiService.showSnackbar(
                                                this.translocoService.translate('sharedComponents.email.someEmailsAssigned'),
                                                'failure'
                                            );
                                        }
                                    } else {
                                        this.appUiService.showSnackbar(
                                            this.translocoService.translate('sharedComponents.email.emailsAssigned'),
                                            'failure'
                                        );
                                    }
                                } else {
                                    this.appUiService.showSnackbar(
                                        this.translocoService.translate('sharedComponents.email.pullEmailFailed'),
                                        'failure'
                                    );
                                }
                                return;
                            }
                            if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
                                this.openEmailRes.data.next(null);
                            }
                            loader.dismiss();
                            this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.pullEmailSuccess'), 'success');
                        },
                        error: (err) => {
                            console.error(err);
                            loader.dismiss();
                            this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.pullEmailFailed'), 'failure');
                        }
                    });
            } catch (e) {
                console.error(e);
                loader.dismiss();
                this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.pullEmailFailed'), 'failure');
            }
        };

        if (archivedAttachments) {
            const confirmDialogRef = this.appUiService.showAppConfirmDialog(
                'generic',
                this.translocoService.translate('sharedComponents.email.emailPullConfirmHeader'),
                this.translocoService.translate('sharedComponents.email.emailConfirmBody')
            );

            const dialogResult = await confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)).pipe(take(1)).toPromise();
            if (dialogResult) {
                pullEmailOp();
            }
        } else {
            pullEmailOp();
        }
    }

    /**
     * Get attachment meta data from media streamer for archive status
     */
    async requestAttachmentData(attachments: any[]): Promise<any> {
        try {
            //extract file id's
            let attachmentMap = attachments.reduce(
                (acc, cur) => {
                    if (cur.IsCloud) {
                        let split = cur.URL.split('/');
                        if (split.length > 0) {
                            let fileId = split[split.length - 1];
                            acc.ids.push(fileId);
                            acc.att.push({ ...cur, FileId: fileId });
                        } else {
                            acc.att.push({ ...cur });
                        }
                    } else {
                        acc.att.push({ ...cur });
                    }
                    return acc;
                },
                { ids: [], att: [] }
            );
            if (attachmentMap.ids.length > 0) {
                let ids = attachmentMap.ids.join(',');
                try {
                    const { response } = await TUtils.HttpClient.sendRequest<MediaStreamerMultiResponse<MediaStreamerMetaResponse>>({
                        urls: [`${this.fileUploadUrl.MediaStreamer}/meta/mediaall?ids=${ids}`],
                        method: 'GET',
                        responseType: 'json'
                    });

                    if (response?.result?.length > 0) {
                        attachmentMap.att.forEach((cur) => {
                            if (cur.IsCloud) {
                                let fileMeta = response?.result.find((i) => i.interaction_id === cur.FileId);
                                if (fileMeta) {
                                    cur.ArchiveStatus = fileMeta.archiveStatus;
                                    cur.RestoreStatus = fileMeta.restoreStatus;
                                    cur.FileError = fileMeta.fileError;
                                }
                            }
                        }, []);
                    }
                } catch (ex) {
                    this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.fileMetaError'), 'failure');
                    attachmentMap.att.forEach((cur) => {
                        cur.ArchiveStatus = null;
                        cur.RestoreStatus = null;
                        cur.FileError = true;
                    }, []);
                }
            }
            return attachmentMap.att;
        } catch (error) {
            return attachments;
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
                    // request meta data from media streamer

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
                    let tempAttachments = await this.requestAttachmentData(inboxRes.Attachments);
                    this.emailBodies = Object.assign(this.emailBodies, {
                        [email.InSessionId]: {
                            Files: getAttachments(tempAttachments),
                            AgentName: inboxRes.AgentName,
                            Intent: inboxRes.Intent,
                            RepliedStatus:
                                inboxRes.RepliedStatus === '1'
                                    ? this.translocoService.translate('sharedComponents.email.replied')
                                    : this.translocoService.translate('sharedComponents.email.notReplied'),
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
                            EmailType: inboxRes?.EmailType,
                            IsEmailProbableSpam: inboxRes.IsEmailProbableSpam,
                            InternetHeaders: inboxRes.InternetHeaders
                        }
                    });
                    this.selectedEmailInSessionId = email.InSessionId;
                    this.selectedEmailOutSessionId = email.OutSessionId;
                    this.selectedEmailRouteReason = email.RouteReason;
                }
            }

            if (fetchFromOutbox && !this.emailBodies[email.OutSessionId]) {
                outboxRes = (await SDKClient.getOutboxEmail(email.OutSessionId)).response;
                if (!outboxRes) {
                    throwADError('Error in WorkbenchEmailComponent.getOutboxEmail', 'Unexpected Response from server');
                }
                let tempAttachments = await this.requestAttachmentData(outboxRes.Attachments);

                this.emailBodies = Object.assign(this.emailBodies, {
                    [email.OutSessionId]: {
                        Files: getAttachments(tempAttachments),
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
                        RepliedStatus:
                            inboxRes?.RepliedStatus === '1'
                                ? this.translocoService.translate('sharedComponents.email.replied')
                                : this.translocoService.translate('sharedComponents.email.notReplied'),
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
            const confirmDialogRef = this.appUiService.showAppConfirmDialog(
                'generic',
                this.translocoService.translate('sharedComponents.email.spamConfirmTitle'),
                this.translocoService.translate('sharedComponents.email.spamConfirmMsg')
            );
            const dialogResult = await confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)).pipe(take(1)).toPromise();
            if (dialogResult) {
                loader = this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.spamEmailLoading'), 'loading');
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
                this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.spamEmailSuccess'));
            }
        } catch (err) {
            console.error(err);
            loader?.dismiss();
            this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.spamEmailFailed'), 'failure');
        }
    }

    /**
     * Transfers email
     * @param {any} email
     */
    transferEmail(emails: Mail[]): void {
        const config = (this.channelConf?.Config || {}) as TwEmailWorkbenchConfig;
        const uiIds = emails.map((e) => e.uiId);

        // const agentConfig = config?.Transfer?.Agent || ({} as AgentTransferConferenceConfig);
        // const skillConfig = config?.Transfer?.Skill || ({} as SkillTransferConferenceConfig);
        // const data: AgentSkillListData = {
        //     Title: 'Email Transfer',
        //     Type: 'transferEmail',
        //     Agent: {
        //         Allowed: agentConfig.Allowed,
        //         Consult: agentConfig.Consult,
        //         Blind: agentConfig.Blind,
        //         Comments: agentConfig.Comments,
        //         Source: agentConfig.Source,
        //         AllowedStates: agentConfig.AllowedStates,
        //         Columns: agentConfig.Columns,
        //         TeamFilter: agentConfig.TeamFilter
        //     },
        //     Skill: {
        //         Allowed: skillConfig.Allowed,
        //         Consult: skillConfig.Consult,
        //         Blind: skillConfig.Blind,
        //         Comments: skillConfig.Comments,
        //         Source: skillConfig.Source,
        //         ChannelPrefix: skillConfig.ChannelPrefix,
        //         Columns: skillConfig.Columns
        //     },
        //     Callback: ({ success }) => {
        //         if (success) {
        //             this.doAdvancedSearch(true);
        //             if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
        //                 this.openEmailRes.data.next(null);
        //             }
        //         }
        //     }
        // };

        const transferConfig = config?.Transfer ?? {};
        let data = new AgentSkillListDataModel('transferEmail', 'Transfer Email');
        data = merge({}, data, transferConfig);
        const sessionKey = this.getCurrentSessionKey();
        data = {
            ...data,
            OtherData: {
                type: 'transfer',
                emails: emails.map((e) => ({
                    ...e,
                    SessionId: e[sessionKey]
                }))
            },
            Callback: ({ success }) => {
                if (success) {
                    this.doAdvancedSearch(true);
                    if (uiIds.includes(this.openEmailRes.data?.value?.uiId)) {
                        this.openEmailRes.data.next(null);
                    }
                }
            }
        };

        this.matDialog.open(AgentSkillListComponent, {
            data,
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
                            this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.emptyEmailWarning'), 'failure');
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
            this._aotWidgetService.addWidget(widget as AOTWidget);
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
            if ((this.channelConf.Config as TwEmailWorkbenchConfig).SearchDuration) {
                const fromDate = addHours(new Date(), -(this.channelConf.Config as TwEmailWorkbenchConfig).SearchDuration);
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
            case 'emails/search/failure':
                this.advancedSearch.snackbarRef = this.appUiService.showSnackbar(payload?.msg, 'failure');
                return;

            case 'emails/loading':
                this.emailSearchRes.loading = true;
                this.emailSearchRes.error = false;
                this.openEmailRes.data.next(null);
                this.advancedSearch.snackbarRef = this.appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.email.getEmailsLoading'),
                    'loading'
                );
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
                this.emailSearchRes.msg = this.translocoService.translate('sharedComponents.email.getEmailsFailed');
                this.emailSearchRes.error = true;
                this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.loadEmailsFailed'), 'failure');
                break;

            case 'email/reply/loading':
                this.replyEditorModal.sendingEmail = this.appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.email.replyEmailLoading'),
                    'loading'
                );
                break;
            case 'email/reply/success':
                if (this.replyEditorModal.sendingEmail) {
                    this.replyEditorModal.sendingEmail.dismiss();
                    this.replyEditorModal.sendingEmail = null;
                }
                this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.replyEmailSuccess'));
                break;
            case 'email/reply/failure':
                if (this.replyEditorModal.sendingEmail) {
                    this.replyEditorModal.sendingEmail.dismiss();
                    this.replyEditorModal.sendingEmail = null;
                }
                this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.replyEmailFailed'), 'failure');
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
                this.appUiService.showSnackbar(this.translocoService.translate('sharedComponents.email.openEmailFailed'), 'failure');
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
    selectEmails = (checked: boolean, emails?: Mail[], event?:any) => {
        const mails = emails ?? this.getAllEmailNodes();
        const maxSelection =(this.channelConf.Config as TwEmailWorkbenchConfig)?.MaxSelection?? 10;
        let totalCurrentSelections = this.getAllEmailNodes().filter((email:any) => email.checked)?.length ?? 0;
        const dynamicLabels = [
            {
                key: '#maxBulkMailCount',
                value: maxSelection.toString()
            }
        ];
        for (const n of mails) {
            if((totalCurrentSelections == maxSelection) && checked) {
                if(event) {
                    event.checked = false;
                    event.source.checked = false;
                }
                this._appUIService.showSnackbar(this._appDataService.getUpdatedLabel(
                    this.translocoService.translate('widgets.activeAgents.maxBulkMailCount'),
                    dynamicLabels
                ));
                return;
            }

            n.checked = checked;
            totalCurrentSelections++;
        }
    };

    /**
     * To show internet headers
     * @param {String} headers
     */
    showHeaders = (headers: string) => {
        this._appUIService.showCustomDialog('alert', headers, 'Internet Headers', {
            messageClasses: 'twd-whitespace-pre-line twd-break-words'
        });
    };

    /**
     * Method to check if max search range for dates is configured, if yes then check if dates selected in
     * advance search is within the given range
     * @returns True / False
     */
    checkForErrorInDate = () => {
        try {
            const searchRange = (this.channelConf.Config as TwEmailWorkbenchConfig)?.MaxSearchRange
                ? (this.channelConf.Config as TwEmailWorkbenchConfig).MaxSearchRange
                : 30;
            const searchValues = this.advancedSearch.form?.value;
            if (searchRange && searchValues) {
                const fromDateTime: Date = this.getUpdatedDateTime(searchValues.fromDate, searchValues.fromTime);
                const toDateTime: Date = this.getUpdatedDateTime(searchValues.toDate, searchValues.toTime);

                if (toDateTime.getTime() < fromDateTime.getTime()) {
                    return { type: 'INVALID_RANGE' };
                }

                const dateRange = Math.round((toDateTime.getTime() - fromDateTime.getTime()) / (1000 * 3600 * 24));

                if (dateRange > Number(searchRange)) {
                    return { type: 'OUT_OF_RANGE' };
                }

                return false;
            }
            return false;
        } catch (e) {
            this.logger.error('Error occured while validating dates in advance search', e, true);
            return false;
        }
    };

    getUpdatedDateTime = (date: Date, time) => {
        date.setHours(time?.split(':')[0] || '00');
        date.setMinutes(time?.split(':')[1] || '00');
        date.setSeconds(0);
        return date;
    };

    async getValidDataForSelectedEmail() {
        try {
            const inboxRes: EmailInboxModel = (await SDKClient.getInboxEmail(this.selectedEmailInSessionId)).response;
            const outboxRes: EmailOutboxModel = (await SDKClient.getOutboxEmail(this.selectedEmailOutSessionId)).response;
            const emailData: Mail = new Mail();

            emailData.Mailbox = inboxRes.Mailbox;
            emailData.RouteId = inboxRes.RouteId;
            emailData.InSessionId = inboxRes.SessionID;
            emailData.ConversationID = inboxRes.ConversationID;
            emailData.OutSessionId = outboxRes?.SessionID;
            emailData.RouteReason = this.selectedEmailRouteReason;
            emailData.uiId = inboxRes.SessionID;
            emailData.EmailType = inboxRes.EmailType;
            this.pullEmails([emailData]);
        } catch (e) {
            this.logger.error('Error occured while getting valid data for selected email:', JSON.stringify(e), true);
        }
    }
}

// for more info visit - https://angular.io/api/core
