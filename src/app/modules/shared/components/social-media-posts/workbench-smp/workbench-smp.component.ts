import { initSmpostsSearchState, SocialMediaPostsService } from './../social-media-posts.service';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { IWidget, ResData } from 'app/interfaces';
import { TwSmpWorkbenchConfig, TwWorkbenchPanelChannel, TwWorkbenchPanelGeneral } from '@ad/types';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { filter, map, take, takeUntil, timeout } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { fuseAnimations } from '@fuse/animations';
import { BehaviorSubject, forkJoin, Observable, Subscription, timer } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { AppUiService } from '@services/app-ui.service';
import { addHours, format, format as formatDate } from 'date-fns';
import { HttpClient } from '@angular/common/http';
import { isEqual, sortBy } from 'lodash';
import { maticonByExtension, throwADError } from 'app/utils';
import { GetInboxItemResult, SDKClient, TUtils, PostAttachment, GetOutboxItemResult } from '@tmac/sdk';
import { AppDataService } from '@services/app-data.service';
import { OUTBOX_REASONS, SMP_CURRENTSTATUS_CODES } from 'app/constants';

export class SMPost {
    Mailbox?: string;
    ConversationID?: string;
    ItemId: string;
    AddedTime: Date;
    AgentId: string;
    Channel: string;
    CreatedBy: string;
    CustomerIdentifier: string;
    Key: string;
    OrderIndex: number;
    SubChannel: string;
    Status: number;
    SkillName: string;
    SkillId: string;
    RouteDate: string;
    RouteTime: string;
    RonaEnabled: boolean;
    Reason: string;
    PostData: PostData;
    Files?: any[]; // Will get assigned internally in code
}

interface PostData {
    SessionId: string;
    OutSessionId: string;
    RouteId: string;
    From: string;
    To: string;
    Subject: string;
    EmailType: string;
    Skill: string;
    Intent: string;
    JsonData: any;
    SentimentInfo: any;
    RouteReason: string;
    HasAttachment: boolean;
    IsEmailProbableSpam: boolean;
    RejectReason: string;
}

/**
 * Various states of the component
 */
type ComponentActions =
    | 'smposts/loading'
    | 'smposts/success'
    | 'smposts/failure'
    | 'smposts/open/loading'
    | 'smposts/open/success'
    | 'smposts/open/failure'
    | 'smposts/polling/active'
    | 'smposts/polling/failed'
    | 'smposts/polling/inactive'
    | 'smposts/search'
    | 'smposts/search/failure';

/**
 * Available tabs of the smp workbench
 */
type AvailableTabs = 'inbox' | 'sent' | 'queue' | 'drafts' | 'posts';

/**
 * Global search form controls
 * Global search is the direct search key input present at the top of the posts list
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
 * Snackbar component
 */
@Component({
    selector: 'workbench-smp',
    templateUrl: './workbench-smp.component.html',
    styleUrls: ['./workbench-smp.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class WorkbenchSmpComponent extends TWidgetWrapper implements OnInit, AfterViewInit {
    /**
     * holds all the data related to the parent tw workbecnh widget from the config
     */
    @Input() data: IWidget<TwWorkbenchPanelGeneral>;
    /**
     * holds all the data related to this workbench tab
     */
    @Input() channelConf: TwWorkbenchPanelChannel;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
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
        form: this._smpService.globalSmpWorkbenchState$.searchParams,
        data: {},
        show: false,
        sub$: null,
        snackbarRef: null
    };
    /**
     * Flag to disable advanced search fields
     */
    disableAdvSearchActions: boolean = false;
    /**
     * Post Search Stateful request
     */
    postSearchRes: ResData = {
        error: false,
        loading: false,
        msg: ''
    };
    /**
     * Post Search Stateful request
     */
    openPostRes: ResData<
        BehaviorSubject<
            SMPost & {
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
     * Flag to hold current tab
     */
    currentTab: string;
    /**
     * List of all available tabs
     */
    availableTabs = [
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.queueLabel'),
            enabled: true,
            icon: 'queue',
            key: 'queue'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.inboxLabel'),
            enabled: true,
            icon: 'inbox',
            key: 'inbox'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.sentLabel'),
            enabled: true,
            icon: 'send',
            key: 'sent'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.draftsLabel'),
            enabled: true,
            icon: 'file_copy',
            key: 'drafts'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.postsLabel'),
            enabled: true,
            icon: 'video_label',
            key: 'posts'
        }
    ];
    /**
     * Flag to hold boolean value of tabs availability
     */
    noTabsAvailable: boolean = false;
    /**
     * Polling Subscription
     */
    polling$: Subscription;
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
     * Chats workbech main ref
     */
    @ViewChild('smpWorkbench')
    smpWorkbench: ElementRef<HTMLDivElement>;
    /**
     * Intersection observer ref
     */
    intersectionObserver: IntersectionObserver;
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
     * List of availabloe mailboxes
     */
    availableMailboxes: string[] = [];
    /**
     * Replied post shown
     */
    latestPostPreview: boolean = false;

    selectedPostSessionId: string;
    selectedPostOutSessionId: string;
    selectedPostRouteReason: string;
    /**
     * File upload url config
     */
    fileUploadUrl: any;

    // UI modifyers
    segregatedPosts: any = [];

    MaximumAllowedPostImageRendering: number = 5;

    /**
     * Sort controls
     */
    sortControls = {
        sortBy: 'Date',
        ascending: false
    };

    rawResponse: any[] = [];

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService,
        private _smpService: SocialMediaPostsService,
        private _appUiService: AppUiService,
        private http: HttpClient,
        private _appDataService: AppDataService
    ) {
        super('WorkbenchSmpComponent');
    }

    async ngOnInit() {
        // get and set the list of available mailboxes
        await this.setAvailableMailboxes();

        this.validateAvailabletabsFromConfiguration();

        // set the current tab
        this.currentTab = this.availableTabs.find((f) => f.enabled)?.key ?? '';
        if (this.currentTab) {
            this.advancedSearch.data[this.currentTab] = { data: this.advancedSearch.form.value, changed: false };
            this.globalSearch.data[this.currentTab] = this.globalSearch.form.value;
        }

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fileUploadUrl = config.Main.Urls?.FileServerUrl || null;
        });

        this.MaximumAllowedPostImageRendering = (
            this.channelConf.Config as TwSmpWorkbenchConfig
        ).MaximumAllowedPostImageRendering;
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
                        this.polling.allowed = this.polling.enabled =
                            (this.channelConf.Config as TwSmpWorkbenchConfig).SearchPollingInterval > 0;
                        if ((this.channelConf.Config as TwSmpWorkbenchConfig).SearchPollingInterval) {
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
        this.intersectionObserver.observe(this.smpWorkbench.nativeElement);
    }

    /**
     * To start polling
     */
    private startPolling(): void {
        // polling timer
        this.polling$ = timer(0, (this.channelConf.Config as TwSmpWorkbenchConfig).SearchPollingInterval)
            .pipe(
                filter(
                    () =>
                        this.polling.enabled &&
                        !this.postSearchRes.loading &&
                        !this.polling.active &&
                        !this.advancedSearch.show
                )
            )
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
     * Sets component state
     * @param {ComponentActions} action
     * @param {any} payload
     */
    setComponentState(action: ComponentActions, payload?: any): void {
        switch (action) {
            case 'smposts/search/failure':
                this.advancedSearch.snackbarRef = this._appUiService.showSnackbar(payload?.msg, 'failure');
                return;

            case 'smposts/failure':
                this.advancedSearch.snackbarRef?.dismiss();
                this.postSearchRes.loading = false;
                this.postSearchRes.msg = this.translocoService.translate(
                    'sharedComponents.socialMediaPosts.getPostsFailed'
                );
                this.postSearchRes.error = true;
                this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.getPostsFailed'),
                    'failure'
                );
                break;

            case 'smposts/polling/active':
                this.polling.failed = false;
                this.polling.active = true;
                break;

            case 'smposts/loading':
                this.postSearchRes.loading = true;
                this.postSearchRes.error = false;
                this.openPostRes.data.next(null);
                this.advancedSearch.snackbarRef = this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.getPostsLoading'),
                    'loading'
                );
                break;

            case 'smposts/success':
                this.postSearchRes.loading = false;
                this.postSearchRes.error = false;
                this.advancedSearch.snackbarRef?.dismiss();
                break;

            case 'smposts/polling/inactive':
                this.polling.failed = false;
                this.polling.active = false;
                break;

            case 'smposts/open/loading':
                this.openPostRes.loading = true;
                this.openPostRes.error = false;
                break;

            case 'smposts/open/success':
                this.openPostRes.loading = false;
                this.openPostRes.error = false;
                break;

            case 'smposts/open/failure':
                this.openPostRes.loading = false;
                this.openPostRes.error = true;
                this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.openPostFailed'),
                    'failure'
                );
                break;

            default:
                break;
        }
        if (!payload?.silent) {
            this.advancedSearch.show = false;
        }
    }

    doAdvancedSearch(silent?: boolean): void {
        try {
            const errorInDate = this.checkForErrorInDate();
            if (errorInDate) {
                switch (errorInDate.type) {
                    case 'INVALID_RANGE':
                        this.setComponentState('smposts/search/failure', {
                            msg: 'From date can not be greater than To Date, Please select valid dates'
                        });
                        return;
                    case 'OUT_OF_RANGE':
                        const searchRange = (this.channelConf.Config as TwSmpWorkbenchConfig)?.MaxSearchRange
                            ? (this.channelConf.Config as TwSmpWorkbenchConfig).MaxSearchRange
                            : 30;
                        this.setComponentState('smposts/search/failure', {
                            msg: 'Please select dates within the range of ' + searchRange + ' days'
                        });
                        return;
                }
            }

            if (!this.data.Data.WorkbenchUrl) {
                this.setComponentState('smposts/failure', {
                    msg: this.translocoService.translate('sharedComponents.socialMediaPosts.workbenchURLNotFound'),
                    silent
                });
                return;
            }

            if (silent) {
                this.setComponentState('smposts/polling/active', { silent });
            } else {
                this.setComponentState('smposts/loading', { silent });
            }

            this.disableAdvSearchActions = true;
            const currentSearchFilters = this.advancedSearch.data[this.currentTab];
            const searchFields = this.parseDateFromSearchParams(currentSearchFilters.data);
            let searchParams: any;
            const requests: Observable<any>[] = [];
            const globalKey = this.globalSearch.data[this.currentTab];
            // In case if we are back to old tab, get the preserved global key
            if (globalKey) {
                searchParams = {
                    subject: globalKey,
                    content: this.currentTab !== 'queue' ? globalKey : undefined,
                    global: 'GLOBAL',
                    listOfMailboxes:
                        this._smpService.globalSmpWorkbenchState$.searchParams.value.listOfMailboxes.join(','),
                    hasAttachments: 2,
                    replied: 2,
                    closed: 2,
                    assigned: 2,
                    startDate: searchFields.startDate,
                    endDate: searchFields.endDate,
                    skills: [],
                    channel: 'socialmediachannel'
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
                    listOfMailboxes: searchFields.listOfMailboxes.join(','),
                    channel: 'socialmediachannel'
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
                requests.push(
                    this.http.post(
                        `${this.data.Data.WorkbenchUrl}/${
                            this.currentTab === 'sent' ? 'sentitem' : this.currentTab
                        }/search`,
                        searchParams
                    )
                );
            }

            const maps: Record<AvailableTabs, any> = {
                inbox: this.mapInboxPosts,
                queue: this.mapQueuePosts,
                drafts: [],
                posts: [],
                sent: []
            };

            this.advancedSearch.sub$ = forkJoin(requests)
                .pipe(
                    timeout(50000),
                    map((res: any) => {
                        this.disableAdvSearchActions = false;

                        if (res.find((x: any) => x.status !== 'SUCCESS')) {
                            const resultStr = JSON.parse(
                                JSON.stringify(res.find((x) => x.status !== 'SUCCESS'))?.toLowerCase()
                            );

                            if (resultStr?.errorcode && resultStr.errorcode == '-101') {
                                this._appUiService.showSnackbar(
                                    'Number of posts present in the search has reached maximum limit, Please select a shorter date range',
                                    'warning'
                                );
                                return;
                            }

                            throwADError(
                                'Error in WorkbenchSmpComponent.doAdvancedSearch',
                                `Request to fetch ${this.currentTab} mails failed with response : \n ${JSON.stringify(
                                    res,
                                    null,
                                    2
                                )}`
                            );
                        }
                        const posts = res.map((x: any) => x.result || []).flat();
                        return maps[this.currentTab](posts);
                    })
                )
                .subscribe({
                    next: (res: SMPost[]) => {
                        this.rawResponse = res;
                        this.sortPosts();
                        this.setComponentState('smposts/success', { silent });
                    },
                    error: (e) => {
                        this.disableAdvSearchActions = false;
                        console.error(e);
                        this.setComponentState('smposts/failure', { silent });
                        this.setComponentState('smposts/polling/inactive', { silent });
                    },
                    complete: () => {
                        this.setComponentState('smposts/polling/inactive', { silent });
                    }
                });
        } catch (error) {
            console.error(error);
        }
    }

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
     * Method to check if max search range for dates is configured, if yes then check if dates selected in
     * advance search is within the given range
     * @returns True / False
     */
    checkForErrorInDate = () => {
        try {
            const searchRange = (this.channelConf.Config as TwSmpWorkbenchConfig)?.MaxSearchRange
                ? (this.channelConf.Config as TwSmpWorkbenchConfig).MaxSearchRange
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

    /**
     * Method to validate availbale tabs from the configurations
     */
    validateAvailabletabsFromConfiguration(): void {
        try {
            // Modify enabled flag according to configurations received
            const allowedTabs =
                (this.channelConf.Config as TwSmpWorkbenchConfig)?.Tabs?.map((m: string) => m.toLowerCase()) ?? [];
            if (allowedTabs.length) {
                this.availableTabs.forEach((f) => {
                    f.enabled = allowedTabs.includes(f.label.toLowerCase());
                    if (f.enabled) {
                        this.noTabsAvailable = false;
                    }
                });
            } else {
                this.noTabsAvailable = false;
            }

            // By default make the first available tab selected
            if (!this.noTabsAvailable)
                this.currentTab = this.availableTabs[this.availableTabs.findIndex((f) => f.enabled)].key;
        } catch (error) {
            console.error(error);
        }
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
                ...initSmpostsSearchState,
                listOfMailboxes: this.advancedSearch.data[this.currentTab]?.data.listOfMailboxes ?? []
            })
        };
        this.doAdvancedSearch();
    }

    /**
     * Resets global search key
     */
    resetGlobalSearchForm(): void {
        this.globalSearch.form.setValue('');
        this.globalSearch.data[this.currentTab] = '';
    }

    /**
     * Resets advance search form
     */
    resetForm(): void {
        let updateValue = {} as any;

        try {
            // check if search duration is configured, then patch the from datetime value
            if ((this.channelConf.Config as TwSmpWorkbenchConfig).SearchDuration) {
                const fromDate = addHours(
                    new Date(),
                    -(this.channelConf.Config as TwSmpWorkbenchConfig).SearchDuration
                );
                updateValue = {
                    fromDate,
                    fromTime: format(fromDate, 'HH:mm')
                };
            }
        } catch (error) {}

        this._smpService.resetPostState(updateValue);

        this.advancedSearch.data[this.currentTab] = {
            data: this.advancedSearch.form.value,
            changed: false
        };
    }

    /**
     * Method to handle tab switching from user
     * @param tabName Name of the tab that user tends to switch
     */
    switchTab(tab: AvailableTabs): void {
        try {
            if (tab === this.currentTab) return;
            this.advancedSearch.show = false;
            this.advancedSearch.sub$?.unsubscribe();
            this.segregatedPosts = [];
            this.openPostRes.data.next(null);
            this.currentTab = tab ?? '';
            this.selectedPostSessionId = '';
            this.selectedPostOutSessionId = '';
            this.selectedPostRouteReason = '';
            if (tab) {
                this.latestPostPreview = tab === 'drafts' || tab === 'sent';
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
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * This method is used to formate the post list reponse from the search api
     * @param {any} result This is the response form the search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapQueuePosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                return {
                    AddedTime: x?.addedTime,
                    AgentId: x?.agentID,
                    Channel: x?.channel,
                    CreatedBy: x?.createdBy,
                    CustomerIdentifier: x?.customerIdentifier,
                    ItemId: x?.itemID,
                    Key: x?.key,
                    OrderIndex: x?.orderIndex,
                    Reason: x?.reason,
                    RonaEnabled: x?.ronaEnabled,
                    RouteDate: x?.routeDate,
                    RouteTime: x?.routeTime,
                    SkillId: x?.skillId,
                    SkillName: x?.skillName,
                    Status: x?.status,
                    SubChannel: x?.subChannel,
                    PostData: {
                        ...JSON.parse(x?.data)
                    }
                };
            });
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * This method is used to formate the post list reponse from the search api
     * @param {any} result This is the response form the search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapInboxPosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                const AddedTime = new Date(x.receivedDate);
                if (!x.receivedTime) {
                    console.log('Unable to split x.receivedTime', x);
                }
                const time = x.receivedTime.split(':');
                AddedTime.setHours(time[0]);
                AddedTime.setMinutes(time[1]);

                return {
                    Mailbox: x?.mailbox,
                    ConversationID: x?.conversationID,
                    AddedTime,
                    AgentId: '',
                    Channel: '',
                    CreatedBy: '',
                    CustomerIdentifier: '',
                    ItemId: '',
                    Key: '',
                    OrderIndex: x?.orderIndex,
                    Reason: x?.reason,
                    RonaEnabled: x?.ronaEnabled,
                    RouteDate: x?.routeDate,
                    RouteTime: x?.routeTime,
                    SkillId: x?.makerSkill,
                    SkillName: x?.makerSkillName,
                    Status: x?.status,
                    SubChannel: x?.channel?.toLowerCase(),
                    PostData: {
                        SessionId: x?.sessionID,
                        OutSessionId: '',
                        RouteId: '',
                        From: x?.from,
                        To: '',
                        Subject: x?.subject,
                        EmailType: '',
                        Skill: '',
                        Intent: x?.intent,
                        JsonData: '',
                        SentimentInfo: '',
                        RouteReason: '',
                        HasAttachment: x?.hasAttachments,
                        IsEmailProbableSpam: false,
                        RejectReason: ''
                    }
                };
            });
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * This method is used to formate the post list reponse from the search api
     * @param {any} result This is the response form the search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapSentPosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                const AddedTime = new Date(x.sendDate);
                if (!x.sendTime) {
                    console.log('Unable to split x.sendTime', x);
                }
                const time = x.sendTime.split(':');
                AddedTime.setHours(time[0]);
                AddedTime.setMinutes(time[1]);

                return {
                    Mailbox: x?.mailbox,
                    ConversationID: x?.conversationID,
                    AddedTime,
                    AgentId: '',
                    Channel: '',
                    CreatedBy: '',
                    CustomerIdentifier: '',
                    ItemId: '',
                    Key: '',
                    OrderIndex: x?.orderIndex,
                    Reason: x?.reason,
                    RonaEnabled: x?.ronaEnabled,
                    RouteDate: x?.routeDate,
                    RouteTime: x?.routeTime,
                    SkillId: x?.makerSkill,
                    SkillName: x?.makerSkillName,
                    Status: x?.status,
                    SubChannel: x?.channel?.toLowerCase(),
                    PostData: {
                        SessionId: x?.sessionID,
                        OutSessionId: '',
                        RouteId: '',
                        From: x?.from,
                        To: '',
                        Subject: x?.subject,
                        EmailType: '',
                        Skill: '',
                        Intent: x?.intent,
                        JsonData: '',
                        SentimentInfo: '',
                        RouteReason: '',
                        HasAttachment: x?.hasAttachments,
                        IsEmailProbableSpam: false,
                        RejectReason: ''
                    }
                };
            });
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Sets available mailboxes
     */
    private async setAvailableMailboxes(): Promise<void> {
        if (!this._smpService.globalSmpWorkbenchState$.availableMailboxes.value?.length) {
            await this._smpService.init();
        }

        this.availableMailboxes = this._smpService.globalSmpWorkbenchState$.availableMailboxes.value;
        this._smpService.globalSmpWorkbenchState$.availableMailboxes.valueChanges
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((res) => {
                this.availableMailboxes = res;
            });
    }

    updateSegregatedPosts(response: SMPost[]): void {
        try {
            this.segregatedPosts = [];
            let channelIdentifier = 'SubChannel';
            let backupChannelIdentifier = 'EmailType';
            let skillIdentifier = 'SkillName';
            let backupSkillIdentifier = 'SkillId';
            let availableChannels = Array.from(new Set(response.map((r: SMPost) => r[channelIdentifier])));

            const getSegregatedPostsBySkill = (channel: string) => {
                const filteredPostsByChannel: SMPost[] = response.filter(
                    (res: SMPost) => (res[channelIdentifier] ?? res[backupChannelIdentifier]) === channel
                );
                let availableSkills = Array.from(
                    new Set(filteredPostsByChannel.map((r: SMPost) => r[skillIdentifier] ?? r[backupSkillIdentifier]))
                );

                let constructedPost: any = [];

                availableSkills.forEach((skill: string) => {
                    constructedPost.push({
                        [skill]: filteredPostsByChannel.filter(
                            (post: SMPost) => post[skillIdentifier] === skill || post[backupSkillIdentifier] === skill
                        )
                    });
                });

                return constructedPost;
            };

            availableChannels.forEach((channel: string) => {
                this.segregatedPosts.push({
                    [channel]: getSegregatedPostsBySkill(channel)
                });
            });

            console.log(this.segregatedPosts);
        } catch (error) {
            console.error(error);
        }
    }

    getTotalArrayCount(channel: any, skillname?: string) {
        const dataArray: any = Object.values(channel)[0];
        let count = 0;
        dataArray.forEach((skillArray: any) => {
            if (skillname && Object.keys(skillArray)[0] !== skillname) return;
            let arrc: any = Object.values(skillArray)[0];
            count += arrc.length;
        });
        return count;
    }

    getObjectKeyString(data: any): string {
        return Object.keys(data)[0];
    }

    getObjectValueData(data: any): any {
        return Object.values(data)[0];
    }

    formatDate(inputDateStr: string): { date: string; time: string } {
        const inputDate = new Date(inputDateStr);
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        const day = inputDate.getDate();
        const month = inputDate.getMonth();
        const year = inputDate.getFullYear();
        const hours = inputDate.getHours();
        const minutes = inputDate.getMinutes();

        const addOrdinalSuffix = (day) => {
            if (day >= 11 && day <= 13) {
                return day + 'th';
            }
            switch (day % 10) {
                case 1:
                    return day + 'st';
                case 2:
                    return day + 'nd';
                case 3:
                    return day + 'rd';
                default:
                    return day + 'th';
            }
        };

        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;

        return {
            date: `${addOrdinalSuffix(day)} ${months[month]} ${year}`,
            time: `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
        };
    }

    toggleDropdown(className: string) {
        const rippleEl = document.querySelector(`.${className}`);
        const triggerEl = document.getElementById(className);

        rippleEl.classList.toggle('expanded');
        triggerEl.classList.toggle('expanded');
    }

    /**
     * opens post for preview
     */
    async openPost(post: SMPost): Promise<void> {
        try {
            this.openPostRes.data.next(Object.assign(post, { Body: '' }, { currentTab: this.currentTab }));
            this.setComponentState('smposts/open/loading');

            let fetchFromOutbox =
                (this.currentTab === 'drafts' ||
                    this.currentTab === 'sent' ||
                    post.PostData.RouteReason === 'CheckerQueue') &&
                this.latestPostPreview;
            let inboxRes: GetInboxItemResult;
            let outboxRes: GetOutboxItemResult;

            const getRequestedSession = () => (fetchFromOutbox ? post.PostData.OutSessionId : post.PostData.SessionId);

            this.selectedPostSessionId = post.PostData.SessionId;
            this.selectedPostOutSessionId = post.PostData.OutSessionId;
            this.selectedPostRouteReason = post.PostData.RouteReason;

            if (!this._smpService.draftData[this.selectedPostSessionId]) {
                this._smpService.draftData[this.selectedPostSessionId] = {
                    body: '',
                    mimeConstraints: '',
                    rawAttachmentData: '',
                    attachments: []
                };
            }

            if (!this._smpService.postBodies[post.PostData.SessionId]) {
                inboxRes = (await SDKClient.getInboxItem(post.PostData.SessionId)).response;
                if (!inboxRes || inboxRes?.EmailType === 'Dummy') {
                    if (this.currentTab === 'queue') {
                        fetchFromOutbox = true;
                    } else if (!fetchFromOutbox) {
                        throwADError('Error in WorkbenchSmpComponent.getInboxItem', 'Unexpected Response from server');
                    }
                } else {
                    this._smpService.postBodies = Object.assign(this._smpService.postBodies, {
                        [post.PostData.SessionId]: {
                            ConversationID: inboxRes.ConversationID,
                            SessionId: post.PostData.SessionId,
                            OutSessionId: post.PostData.OutSessionId,
                            SubChannel: (post.SubChannel ?? inboxRes.EmailType).toLowerCase(),
                            Subject: post.PostData.Subject,
                            PostAccountName: inboxRes.SocialMediaData.Posts.AccountName,
                            PostId: inboxRes.SocialMediaData.Posts.PostId,
                            SmActiveComment: inboxRes.SocialMediaData.Comments,
                            SmParentComments: inboxRes.SocialMediaData.ParentComments,
                            PostText: inboxRes.SocialMediaData.Posts.PostText,
                            PostAttachments: inboxRes.SocialMediaData.Posts.PostAttachments,
                            PostDetails: {
                                To: post.PostData.To,
                                From: post.PostData.From,
                                Intent: post.PostData.Intent,
                                Status: post.Status
                            }
                        }
                    });
                }
            }

            if (fetchFromOutbox && !this._smpService.postBodies[post.PostData.OutSessionId]) {
                outboxRes = (await SDKClient.getOutboxItem(post.PostData.OutSessionId)).response;
                if (!outboxRes) {
                    throwADError('Error in WorkbenchSmpComponent.getOutboxItem', 'Unexpected Response from server');
                }

                // this._smpService.postBodies = Object.assign(this._smpService.postBodies, {
                //     [post.PostData.OutSessionId]: {
                //         ConversationID: outboxRes.ConversationID,
                //         SessionId: post.PostData.SessionId,
                //         OutSessionId: post.PostData.OutSessionId,
                //         SubChannel: post.SubChannel,
                //         Subject: post.PostData.Subject,
                //         PostAccountName: outboxRes.SocialMediaData.Posts.AccountName,
                //         PostId: outboxRes.SocialMediaData.Posts.PostId,
                //         SmActiveComment: outboxRes.SocialMediaData.Comments,
                //         SmParentComments: outboxRes.SocialMediaData.ParentComments,
                //         PostText: outboxRes.SocialMediaData.Posts.PostText,
                //         PostAttachments: outboxRes.SocialMediaData.Posts.PostAttachments
                //     }
                // });
            }

            this.openPostRes.data.next(
                Object.assign(post, this._smpService.postBodies[getRequestedSession()], { currentTab: this.currentTab })
            );
            this.setComponentState('smposts/open/success');
        } catch (e) {
            console.error(e);
            this.setComponentState('smposts/open/failure');
        }
    }

    async pullPosts(posts: SMPost[]): Promise<void> {
        const loader = this._appUiService.showSnackbar(
            this.translocoService.translate('sharedComponents.socialMediaPosts.pullPostLoading'),
            'loading'
        );
        try {
            const { agentId, tmacServer } = SDKClient.getAgentData();
            if (posts.find((post) => !post.PostData.SessionId)) {
                this.getValidDataForSelectedPost();
                return;
            }
            const { items } = posts.reduce(
                (acc, curr) => {
                    const item = {
                        routeId: curr.PostData.RouteId || '',
                        sessionId: curr.PostData.SessionId,
                        inSessionId: curr.PostData.SessionId,
                        conversationId: curr?.ConversationID || '',
                        mailbox: curr?.Mailbox || ''
                    };
                    if (this.currentTab === 'drafts') {
                        item.sessionId = curr.PostData.OutSessionId;
                    } else if (
                        this.currentTab === 'queue' &&
                        curr.PostData.EmailType !== 'Dummy' &&
                        OUTBOX_REASONS.includes(curr.PostData.RouteReason)
                    ) {
                        item.sessionId = `${curr.PostData.SessionId}|${curr.PostData.OutSessionId}`;
                    } else if (this.currentTab === 'sent') {
                        item.sessionId = `${curr.PostData.SessionId}|${curr.PostData.OutSessionId}`;
                    }
                    acc.items.push(item);
                    return acc;
                },
                { items: [] }
            );
            this.http
                .post(this.data.Data.WorkbenchUrl + `/${this.currentTab}/pull`, {
                    tmacServer,
                    agentId,
                    items
                })
                .subscribe({
                    next: (res: any) => {
                        if (res.status === 'SUCCESS') {
                            this.openPostRes.data.next(null);
                        }
                        if (res.status === 'FAILED') {
                            loader.dismiss();
                            const isAlreadyPulled = res.failedList.items.filter((f) => f.responseCode === -405);
                            if (isAlreadyPulled.length) {
                                if (isAlreadyPulled.length > 1) {
                                    if (isAlreadyPulled.length === posts.length) {
                                        this._appUiService.showSnackbar(
                                            this.translocoService.translate(
                                                'sharedComponents.socialMediaPosts.postsAssigned'
                                            ),
                                            'failure'
                                        );
                                    } else {
                                        this._appUiService.showSnackbar(
                                            this.translocoService.translate(
                                                'sharedComponents.socialMediaPosts.somePostsAssigned'
                                            ),
                                            'failure'
                                        );
                                    }
                                } else {
                                    this._appUiService.showSnackbar(
                                        this.translocoService.translate(
                                            'sharedComponents.socialMediaPosts.postsAssigned'
                                        ),
                                        'failure'
                                    );
                                }
                            } else {
                                this._appUiService.showSnackbar(
                                    this.translocoService.translate(
                                        'sharedComponents.socialMediaPosts.pullPostsFailed'
                                    ),
                                    'failure'
                                );
                            }
                            return;
                        }
                        loader.dismiss();
                        this._appUiService.showSnackbar(
                            this.translocoService.translate('sharedComponents.socialMediaPosts.pullPostsSuccess'),
                            'success'
                        );
                    },
                    error: (err) => {
                        console.error(err);
                        loader.dismiss();
                        this._appUiService.showSnackbar(
                            this.translocoService.translate('sharedComponents.socialMediaPosts.pullPostsFailed'),
                            'failure'
                        );
                    }
                });
        } catch (e) {
            console.error(e);
            loader.dismiss();
            this._appUiService.showSnackbar(
                this.translocoService.translate('sharedComponents.socialMediaPosts.pullPostsFailed'),
                'failure'
            );
        }
    }

    async getValidDataForSelectedPost() {
        try {
            const inboxRes: GetInboxItemResult = (await SDKClient.getInboxItem(this.selectedPostSessionId)).response;
            const postData: SMPost = new SMPost();

            postData.PostData.RouteId = inboxRes.RouteId;
            postData.PostData.SessionId = inboxRes.SessionID;
            postData.PostData.RouteReason = this.selectedPostRouteReason;
            postData.PostData.EmailType = inboxRes.EmailType;
            this.pullPosts([postData]);
        } catch (e) {
            this.logger.error('Error occured while getting valid data for selected post:', JSON.stringify(e), true);
        }
    }

    sortPosts(): void {
        try {
            if (this.sortControls.sortBy === 'Date') {
                this.rawResponse.sort((a, b) => {
                    const dateA = new Date(a.AddedTime);
                    const dateB = new Date(b.AddedTime);

                    if (this.sortControls.ascending) {
                        if (dateA < dateB) {
                            return -1;
                        }
                        if (dateA > dateB) {
                            return 1;
                        }
                    } else {
                        if (dateA > dateB) {
                            return -1;
                        }
                        if (dateA < dateB) {
                            return 1;
                        }
                    }
                    return 0;
                });
                this.updateSegregatedPosts(this.rawResponse);
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Commits the value from global search control value to globalSearch.data
     * When the tab is swithced, this value will be retained in globalSearch.data
     */
    submitGlobalSearchForm(): void {
        this.globalSearch.data[this.currentTab] = this.globalSearch.form.value;
        this.doAdvancedSearch();
    }

    showPostDetails(): void {
        let pdHtml = '';
        pdHtml += `<span style="font-weight: 800">To: </span><span style="font-weight: 500">${
            this._smpService.postBodies[this.selectedPostSessionId].PostDetails.To
        }</span><br>`;
        pdHtml += `<span style="font-weight: 800">From: </span><span style="font-weight: 500">${
            this._smpService.postBodies[this.selectedPostSessionId].PostDetails.From
        }</span><br>`;
        pdHtml += `<span style="font-weight: 800">Intent: </span><span style="font-weight: 500">${
            this._smpService.postBodies[this.selectedPostSessionId].PostDetails.Intent
        }</span><br>`;
        pdHtml += `<span style="font-weight: 800">Status: </span><span style="font-weight: 500">${
            SMP_CURRENTSTATUS_CODES[this._smpService.postBodies[this.selectedPostSessionId].PostDetails.Status]
        }</span><br>`;

        this._appUiService.showCustomDialog('alert', pdHtml, 'Post details', {
            messageClasses: 'twd-whitespace-pre-line twd-break-words'
        });
    }
}
