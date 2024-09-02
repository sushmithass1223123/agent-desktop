import { AgentSkillListComponent } from '@modules/shared/components';
import { initSmpostsSearchState, SocialMediaPostsService } from './../social-media-posts.service';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { IWidget, MediaStreamerMetaResponse, MediaStreamerMultiResponse, ResData } from 'app/interfaces';
import { TwSmpWorkbenchConfig, TwWorkbenchPanelChannel, TwWorkbenchPanelGeneral } from '@ad/types';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { fuseAnimations } from '@fuse/animations';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { AppUiService } from '@services/app-ui.service';
import { addHours, format, format as formatDate } from 'date-fns';
import { isEqual, merge } from 'lodash';
import { maticonByExtension, throwADError } from 'app/utils';
import { GetInboxItemResult, SDKClient, TUtils } from '@tmac/sdk';
import { AppDataService } from '@services/app-data.service';
import { SMP_OUTBOX_REASONS } from 'app/constants';
import { MatDialog } from '@angular/material/dialog';
import { AgentSkillListDataModel } from 'app/models';

export class SMPost {
    Mailbox?: string;
    ConversationID?: string;
    ItemId: string;
    AddedTime: Date | string;
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
    PostId?: string;
    ActiveCommentId?: string;
    IsItemDeleted?: boolean;
}

const channelMapper: any = {
    fb: 'facebook',
    instagram: 'instagram',
    twitter: 'x'
};

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
type AvailableTabs = 'inbox' | 'sentitem' | 'queue' | 'draft' | 'posts';

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
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.sentItemLabel'),
            enabled: true,
            icon: 'send',
            key: 'sentitem'
        },
        {
            label: this.translocoService.translate('sharedComponents.socialMediaPosts.draftsLabel'),
            enabled: true,
            icon: 'file_copy',
            key: 'draft'
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

    selectedPostSessionId: string;
    selectedPostId: string;
    selectedPostOutSessionId: string;
    selectedPostRouteReason: string;
    /**
     * File upload url config
     */
    fileUploadUrl: any;

    // UI modifyers
    segregatedPosts: any = [];

    MaximumAllowedPostImageRendering: number = 5;
    ShowPostDetails: boolean = false;

    /**
     * Sort controls
     */
    sortControls = {
        sortBy: 'Date',
        ascending: false
    };

    rawResponse: any[] = [];
    chosenPostData: any;
    notificationAction: string = '';
    hidePostActions: boolean = false;
    isPullOnProgress: boolean = false;
    /**
     * Object to hold post data
     */
    postBodies: any = {};

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService,
        private _smpService: SocialMediaPostsService,
        private _appUiService: AppUiService,
        private _appDataService: AppDataService,
        private _matDialog: MatDialog
    ) {
        super('WorkbenchSmpComponent');
    }

    async ngOnInit() {
        try {
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

            this._smpService.getPostFromNotification.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
                this.chosenPostData = data.postData;
                this.notificationAction = data.action;
                if (
                    this.notificationAction === 'smrp_a' ||
                    this.notificationAction === 'smp_d' ||
                    this.notificationAction === 'smp_e'
                ) {
                    this.switchTab('posts', true);
                } else if (
                    this.notificationAction === 'smc_e' ||
                    this.notificationAction === 'smc_d' ||
                    this.notificationAction === 'smrc_a'
                ) {
                    this.switchTab('inbox', true);
                } else if (this.notificationAction === 'smco_e' || this.notificationAction === 'smco_d') {
                    this.switchTab('sentitem', true);
                }
            });

            this.MaximumAllowedPostImageRendering = (
                this.channelConf.Config as TwSmpWorkbenchConfig
            ).MaximumAllowedPostImageRendering;

            this.ShowPostDetails = (this.channelConf.Config as TwSmpWorkbenchConfig).ShowPostDetails;
        } catch (e) {
            this.logger.error('[WorkbenchSmpComponent.ngOnInit] - Error occured in ngOnInit:', JSON.stringify(e), true);
            console.error(e);
        }
    }

    /**
     * After View Init
     */
    ngAfterViewInit(): void {
        try {
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
                                if (!this.chosenPostData) this.doAdvancedSearch();
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
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.ngAfterViewInit] - Error occured in ngAfterViewInit:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to start polling
     */
    private startPolling(): void {
        try {
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
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.startPolling] - Error occured while starting search polling interval:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to stop polling
     */
    private stopPolling(): void {
        this.polling$?.unsubscribe();
    }

    /**
     * Method to set component state
     * @param {ComponentActions} action
     * @param {any} payload
     */
    setComponentState(action: ComponentActions, payload?: any): void {
        try {
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
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.setComponentState] - Error occured while setting component state:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to do advanced search by calling tmac workbench methods
     * @param {boolean} silent
     */
    async doAdvancedSearch(silent?: boolean): Promise<void> {
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

            if (silent) {
                this.setComponentState('smposts/polling/active', { silent });
            } else {
                this.setComponentState('smposts/loading', { silent });
            }

            this.disableAdvSearchActions = true;
            const currentSearchFilters = this.advancedSearch.data[this.currentTab];
            const searchFields = this.parseDateFromSearchParams(currentSearchFilters.data);
            let searchParams: any;
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
            }
            if (this.currentTab === 'inbox' || this.currentTab === 'posts') {
                searchParams.assignedTo = searchFields.assignedTo;
                searchParams.hasAttachments = searchFields.hasAttachments;
                searchParams.replied = searchFields.replied;
                searchParams.closed = searchFields.closed;
                searchParams.assigned = searchFields.assigned;
                searchParams.deviceId = '';
                searchParams.assignedValue = false;
                searchParams.closedValue = false;
                searchParams.repliedValue = false;
            }
            if (this.currentTab !== 'queue') {
                searchParams.insessionid = searchFields.inSessionId;
                searchParams.listOfMailboxes = searchFields.listOfMailboxes.join(',');
            }

            const maps: Record<AvailableTabs, any> = {
                inbox: this.mapInboxPosts,
                queue: this.mapQueuePosts,
                draft: this.mapDraftPosts,
                posts: this.mapPosts,
                sentitem: this.mapSentItemPosts
            };

            const { response } = await SDKClient.workbenchSearch(
                (this.currentTab === 'sentitem'
                    ? 'sent'
                    : this.currentTab === 'posts'
                    ? 'inbox'
                    : this.currentTab
                ).toLowerCase(),
                searchParams
            );
            if (response?.Status !== 'SUCCESS') {
                if (response?.ErrorCode && response.ErrorCode == '-101') {
                    this._appUiService.showSnackbar(
                        'Number of posts present in the search has reached maximum limit, Please select a shorter date range',
                        'warning'
                    );
                    return;
                }
                throwADError(
                    'Error in WorkbenchSmpComponent.doAdvancedSearch',
                    `Request to fetch ${this.currentTab} mails failed with response : \n ${JSON.stringify(
                        response,
                        null,
                        2
                    )}`
                );
                this.setComponentState('smposts/failure', { silent });
                this.setComponentState('smposts/polling/inactive', { silent });
            } else {
                this.rawResponse = maps[this.currentTab](response.Result ? response.Result : []);
                this.sortPosts();
                this.setComponentState('smposts/success', { silent });
                if (this.chosenPostData && !silent) {
                    if (
                        this.notificationAction === 'smrp_a' ||
                        this.notificationAction === 'smp_d' ||
                        this.notificationAction === 'smp_e'
                    ) {
                        const filteredPost = this.getPostObjectByPostId(
                            this.segregatedPosts,
                            this.chosenPostData?.SocialMediaData?.Posts?.PostId
                        );
                        if (filteredPost.length) this.openPost(filteredPost[0], true);
                    } else {
                        const filteredPost = this.rawResponse.find(
                            (rres) =>
                                rres?.PostData?.ActiveCommentId ===
                                this.chosenPostData?.SocialMediaData?.Comments?.CommentId
                        );
                        if (filteredPost) this.openPost(filteredPost, true);
                    }
                }
            }
            this.disableAdvSearchActions = false;
            this.setComponentState('smposts/polling/inactive', { silent });
        } catch (e) {
            this.disableAdvSearchActions = false;
            this.logger.error(
                '[WorkbenchSmpComponent.doAdvancedSearch] - Error occured while doing advanced search:',
                JSON.stringify(e),
                true
            );
            console.error(e);
            this.setComponentState('smposts/failure', { silent });
            this.setComponentState('smposts/polling/inactive', { silent });
        }
    }

    /**
     * Method to retrieve post data in segregated posts using post id
     * @param {any[]} data Segregated post data
     * @param {string} postId Post id to filter
     * @returns Post data
     */
    getPostObjectByPostId(data: any[], postId: string): any {
        try {
            let result = [];

            data.forEach((item) => {
                if (item.facebook) {
                    item.facebook.forEach((facebookItem) => {
                        for (let key in facebookItem) {
                            if (facebookItem[key] instanceof Array) {
                                facebookItem[key].forEach((skillItem) => {
                                    if (skillItem.PostData && skillItem.PostData.PostId === postId) {
                                        result.push(skillItem);
                                    }
                                });
                            }
                        }
                    });
                }
            });

            return result;
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.getPostObjectByPostId] - Error occured while getting post object by post id:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method used to parse the date from the search params
     * @param {any} searchParams
     * @returns {any} returns the search params for the advanced search
     */
    parseDateFromSearchParams(searchParams: any): any {
        try {
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
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.parseDateFromSearchParams] - Error occured while parsing date from search params:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to check if max search range for dates is configured, if yes then check if dates selected in
     * advance search is within the given range
     * @returns True / False
     */
    checkForErrorInDate(): any {
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
            this.logger.error(
                '[WorkbenchSmpComponent.checkForErrorInDate] - Error occured while validating dates in advance search',
                JSON.stringify(e),
                true
            );
            console.error(e);
            return false;
        }
    }

    /**
     * Method to update date and time with specifiec hours and minutes
     * @param {Date} date Actual date
     * @param {any} time Hours and minutes to set
     * @returns Updated date
     */
    getUpdatedDateTime(date: Date, time: any): Date {
        try {
            date.setHours(time?.split(':')[0] || '00');
            date.setMinutes(time?.split(':')[1] || '00');
            date.setSeconds(0);
            return date;
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.getUpdatedDateTime] - Error occured while getting upated date time:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

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
                    f.enabled = allowedTabs.includes(f.key.toLowerCase());
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
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.validateAvailabletabsFromConfiguration] - Error occured while validating available tabs from configurations:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to submit advanced search form
     * Pushes advance search form to advancedSearch.data
     * When the tab is switched, this vallue will be retained in advancedSearch.data
     */
    submitAdvanceSearchForm(): void {
        try {
            const searchParams = this.advancedSearch.form.value;
            this.advancedSearch.data[this.currentTab] = {
                data: searchParams,
                changed: !isEqual(searchParams, {
                    ...initSmpostsSearchState,
                    listOfMailboxes: this.advancedSearch.data[this.currentTab]?.data.listOfMailboxes ?? []
                })
            };
            this.doAdvancedSearch();
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.submitAdvancedSearchForm] - Error occured while submitting advanced search form:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to reset global search form
     */
    resetGlobalSearchForm(): void {
        try {
            this.globalSearch.form.setValue('');
            this.globalSearch.data[this.currentTab] = '';
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.resetGlobalSearchForm] - Error occured while resetting global search form:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to reset advanced search form
     */
    resetForm(): void {
        try {
            let updateValue = {} as any;

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

            this._smpService.resetPostState(updateValue);

            this.advancedSearch.data[this.currentTab] = {
                data: this.advancedSearch.form.value,
                changed: false
            };
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.resetForm] - Error occured while resetting advanced search form:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to handle tab switching from user
     * @param {AvailableTabs} tab Name of the tab that user tends to switch
     * @param {boolean} preserveChosenPostData Flag to decide whether
     * to clear chosen post data from notifications
     */
    switchTab(tab: AvailableTabs, preserveChosenPostData?: boolean): void {
        try {
            if (tab === this.currentTab && !preserveChosenPostData) return;
            if (!preserveChosenPostData) {
                this.chosenPostData = undefined;
                this.notificationAction = '';
            }
            this.advancedSearch.show = false;
            this.advancedSearch.sub$?.unsubscribe();
            this.segregatedPosts = [];
            this.openPostRes.data.next(null);
            this.currentTab = tab ?? '';
            this.selectedPostSessionId = '';
            this.selectedPostId = '';
            this.selectedPostOutSessionId = '';
            this.selectedPostRouteReason = '';
            if (tab) {
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
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.switchTab] - Error occured while switching tabs:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to parse dotnet date to js format
     * @param {string} dotnetDate Dotnet date format
     */
    parseDotnetDate(dotnetDate: string): Date {
        try {
            const regex = /\/Date\((\d+)\)\//;
            const match = dotnetDate.match(regex);
            if (match && match.length > 1) {
                const timestamp = parseInt(match[1], 10);
                return new Date(timestamp);
            }
            return new Date();
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.parseDotnetDate] - Error occured while parsing dotnet date format:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to map raw result from server into UI interface
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
                    AddedTime: x?.AddedTime,
                    AgentId: x?.AgentID,
                    Channel: x?.Channel,
                    CreatedBy: x?.CreatedBy,
                    CustomerIdentifier: x?.CustomerIdentifier,
                    ItemId: x?.ItemID,
                    Key: x?.Key,
                    OrderIndex: x?.OrderIndex,
                    Reason: x?.Reason,
                    RonaEnabled: x?.RonaEnabled,
                    RouteDate: x?.RouteDate,
                    RouteTime: x?.RouteTime,
                    SkillId: x?.SkillId,
                    SkillName: x?.SkillName,
                    Status: x?.Status,
                    SubChannel: channelMapper[x?.SubChannel?.toLowerCase()],
                    PostData: {
                        ...JSON.parse(x?.Data)
                    }
                };
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.mapQueuePosts] - Error occured while mapping queued posts:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to map raw result from server into UI interface
     * @param {any} result This is the response form the search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapInboxPosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                return {
                    Mailbox: x?.Mailbox,
                    ConversationID: x?.ConversationID,
                    AddedTime:
                        x?.SocialMediaData?.Comments?.CommentText?.InsertionDateTime ??
                        x?.SocialMediaData?.Comments?.InsertionDateTime,
                    AgentId: '',
                    Channel: '',
                    CreatedBy: '',
                    CustomerIdentifier: '',
                    ItemId: '',
                    Key: '',
                    OrderIndex: x?.OrderIndex,
                    Reason: x?.Reason,
                    RonaEnabled: x?.RonaEnabled,
                    RouteDate: x?.RouteDate,
                    RouteTime: x?.RouteTime,
                    SkillId: x?.MakerSkill,
                    SkillName: x?.MakerSkillName,
                    Status: x?.Status,
                    SubChannel: channelMapper[x?.Channel?.toLowerCase()],
                    PostData: {
                        SessionId: x?.SessionID,
                        OutSessionId: '',
                        PostId: x?.SocialMediaData?.Posts?.PostId,
                        ActiveCommentId: x?.SocialMediaData?.Comments?.CommentId,
                        RouteId: '',
                        From: x?.From,
                        To: '',
                        Subject: x?.SocialMediaData?.Comments?.CommentText?.Text,
                        EmailType: '',
                        Skill: '',
                        Intent: x?.Intent,
                        JsonData: '',
                        SentimentInfo: '',
                        RouteReason: '',
                        HasAttachment: x?.HasAttachments,
                        IsEmailProbableSpam: false,
                        RejectReason: '',
                        IsItemDeleted:
                            x?.SocialMediaData?.Comments?.IsDeleted ||
                            x?.SocialMediaData?.Posts?.IsDeleted ||
                            x?.SocialMediaData?.ParentComments?.IsDeleted
                    }
                };
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.mapInboxPosts] - Error occured while mapping inbox posts:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to map raw result from server into UI interface
     * @param {any} result This is the response form the search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapPosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                return {
                    Mailbox: x?.Mailbox,
                    ConversationID: x?.ConversationID,
                    AddedTime: x?.SocialMediaData?.Posts?.CreatedDateTime,
                    AgentId: '',
                    Channel: '',
                    CreatedBy: '',
                    CustomerIdentifier: '',
                    ItemId: '',
                    Key: '',
                    OrderIndex: x?.OrderIndex,
                    Reason: x?.Reason,
                    RonaEnabled: x?.RonaEnabled,
                    RouteDate: x?.RouteDate,
                    RouteTime: x?.RouteTime,
                    SkillId: x?.MakerSkill,
                    SkillName: x?.MakerSkillName,
                    Status: x?.Status,
                    SubChannel: channelMapper[x?.Channel?.toLowerCase()],
                    PostData: {
                        SessionId: x?.SessionID,
                        OutSessionId: '',
                        PostId: x?.SocialMediaData?.Posts?.PostId,
                        RouteId: '',
                        From: x?.SocialMediaData?.Posts?.AccountName,
                        To: '',
                        Subject: x?.SocialMediaData?.Posts?.PostText?.Text,
                        EmailType: '',
                        Skill: '',
                        Intent: x?.Intent,
                        JsonData: '',
                        SentimentInfo: '',
                        RouteReason: '',
                        HasAttachment: x?.HasAttachments,
                        IsEmailProbableSpam: false,
                        RejectReason: ''
                    }
                };
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.mapPosts] - Error occured while mapping posts:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to map raw result from server into UI interface
     * @param {any} result This is the response form the search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapDraftPosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                return {
                    Mailbox: x?.Mailbox,
                    ConversationID: x?.ConversationID,
                    AddedTime: x?.SocialMediaData?.Comments?.UpdatedDateTime,
                    AgentId: '',
                    Channel: '',
                    CreatedBy: '',
                    CustomerIdentifier: '',
                    ItemId: '',
                    Key: '',
                    OrderIndex: 0,
                    Reason: '',
                    RonaEnabled: false,
                    RouteDate: '',
                    RouteTime: '',
                    SkillId: '',
                    SkillName: '',
                    Status: 0,
                    SubChannel: channelMapper[x?.Label?.split('Draft_')?.pop()?.toLowerCase()],
                    PostData: {
                        SessionId: x?.InSessionID,
                        OutSessionId: x?.SessionID,
                        RouteId: x?.RouteId ?? '',
                        From: x?.From,
                        To: '',
                        Subject: x?.Body,
                        EmailType: '',
                        Skill: '',
                        Intent: '',
                        JsonData: '',
                        SentimentInfo: '',
                        RouteReason: '',
                        HasAttachment: x?.HasAttachments,
                        IsEmailProbableSpam: false,
                        RejectReason: ''
                    }
                };
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.mapDraftPosts] - Error occured while mapping draft posts:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to map raw result from server into UI interface
     * @param {any} result This is the response form the search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapSentItemPosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                return {
                    Mailbox: x?.Mailbox,
                    ConversationID: x?.ConversationID,
                    AddedTime:
                        x?.SocialMediaData?.Comments?.CommentText?.InsertionDateTime ??
                        x?.SocialMediaData?.Comments?.InsertionDateTime,
                    AgentId: '',
                    Channel: '',
                    CreatedBy: '',
                    CustomerIdentifier: '',
                    ItemId: '',
                    Key: '',
                    OrderIndex: 0,
                    Reason: '',
                    RonaEnabled: false,
                    RouteDate: '',
                    RouteTime: '',
                    SkillId: '',
                    SkillName: '',
                    Status: 0,
                    SubChannel: channelMapper[x?.Label?.split('Sent_')?.pop()?.toLowerCase()],
                    PostData: {
                        SessionId: x?.InSessionID,
                        OutSessionId: x?.SessionID,
                        RouteId: x?.RouteId ?? '',
                        From: x?.From,
                        To: '',
                        Subject: x?.SocialMediaData?.Comments?.CommentText?.Text,
                        EmailType: '',
                        Skill: '',
                        Intent: '',
                        JsonData: '',
                        SentimentInfo: '',
                        RouteReason: '',
                        HasAttachment: x?.HasAttachments,
                        IsEmailProbableSpam: false,
                        RejectReason: '',
                        ActiveCommentId: x?.SocialMediaData?.Comments?.CommentId
                    }
                };
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.mapSentItemPosts] - Error occured while mapping sent item posts:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Methos to set available mailboxes
     */
    private async setAvailableMailboxes(): Promise<void> {
        try {
            if (!this._smpService.globalSmpWorkbenchState$.availableMailboxes.value?.length) {
                await this._smpService.init();
            }

            this.availableMailboxes = this._smpService.globalSmpWorkbenchState$.availableMailboxes.value;
            this._smpService.globalSmpWorkbenchState$.availableMailboxes.valueChanges
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((res) => {
                    this.availableMailboxes = res;
                });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.setAvailableMailboxes] - Error occured while setting available mailboxes:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to segregate raw responses to UI friendly array
     * @param {SMPost[]} response Raw response from server
     */
    updateSegregatedPosts(response: SMPost[]): void {
        try {
            this.segregatedPosts = [];
            let channelIdentifier = 'SubChannel';
            let backupChannelIdentifier = 'EmailType';
            let skillIdentifier = 'SkillName';
            let backupSkillIdentifier = 'SkillId';
            if (this.currentTab === 'sentitem' || this.currentTab === 'draft') skillIdentifier = 'Mailbox';
            let availableChannels = Array.from(new Set(response.map((r: SMPost) => r[channelIdentifier])));

            const getSegregatedPostsBySkill = (channel: string) => {
                let filteredPostsByChannel: SMPost[] = response.filter(
                    (res: SMPost) => (res[channelIdentifier] ?? res[backupChannelIdentifier]) === channel
                );
                // Show only unique posts for posts tab
                if (this.currentTab === 'posts') {
                    filteredPostsByChannel = [
                        ...new Map(filteredPostsByChannel.map((item) => [item?.PostData?.PostId, item])).values()
                    ];
                }
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

            this.segregatedPosts.forEach((segPost: any) => {
                let skillCount = 0;

                segPost[Object.keys(segPost)[0]].forEach((segPostSkill: any) => {
                    segPostSkill.itemCount = segPostSkill[Object.keys(segPostSkill)[0]].length;
                    skillCount += segPostSkill[Object.keys(segPostSkill)[0]].length;
                });

                segPost.skillCount = skillCount;
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.updateSegregatedPosts] - Error occured while segregating posts:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to toggle dropdowns
     * @param {string} className Name of the css cass
     * @param {boolean} alwaysExpand Whether to keep expanded
     */
    toggleDropdown(className: string, alwaysExpand?: boolean) {
        try {
            const rippleEl = document.querySelector(`.${className}`);
            const triggerEl = document.getElementById(className);

            if (!rippleEl || !triggerEl) return;

            if (alwaysExpand) {
                rippleEl.classList.remove('expanded');
                triggerEl.classList.remove('expanded');
                rippleEl.classList.add('expanded');
                triggerEl.classList.add('expanded');
                return;
            }

            rippleEl.classList.toggle('expanded');
            triggerEl.classList.toggle('expanded');
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.toggleDropdown] - Error occured while toggling workbench dropdowns:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to open selected post
     * @param {SMPost[]} post Post data
     * @param {boolean} preserveChosenPost Flag to clear chosen post data after switching to another post
     */
    async openPost(post: SMPost, preserveChosenPost?: boolean): Promise<void> {
        try {
            if (this.openPostRes.loading) return;
            this.hidePostActions = false;
            if (!preserveChosenPost) {
                this.chosenPostData = undefined;
                this.notificationAction = '';
            }
            this.openPostRes.data.next(Object.assign(post, { Body: '' }, { currentTab: this.currentTab }));
            this.setComponentState('smposts/open/loading');

            let fetchFromOutbox =
                this.currentTab === 'draft' ||
                this.currentTab === 'sentitem' ||
                post.PostData.RouteReason === 'CheckerQueue';
            let inboxRes: GetInboxItemResult | any;
            let outboxRes: GetInboxItemResult | any;

            const getRequestedSession = () => (fetchFromOutbox ? post.PostData.OutSessionId : post.PostData.SessionId);

            const getAttachments = (attachments: any[]): any[] => {
                if (attachments && attachments.length) {
                    return attachments.map((item: any) => {
                        let uploadedName = item.Url.split('/').pop();
                        if (!item.Name) {
                            uploadedName = uploadedName.replace(getRequestedSession(), '');
                            item.Name = uploadedName;
                        }
                        item.Icon = maticonByExtension(item.Ext);
                        return item;
                    });
                }
                return [];
            };

            this.selectedPostSessionId = post.PostData.SessionId;
            this.selectedPostId = post.PostData.PostId;
            this.selectedPostOutSessionId = post.PostData.OutSessionId;
            this.selectedPostRouteReason = post.PostData.RouteReason;

            if (!fetchFromOutbox) {
                inboxRes = (await SDKClient.getInboxItem(post.PostData.SessionId)).response;
                if (!inboxRes || inboxRes?.EmailType === 'Dummy') {
                    if (this.currentTab === 'queue') {
                        fetchFromOutbox = true;
                    } else if (!fetchFromOutbox) {
                        throwADError('Error in WorkbenchSmpComponent.getInboxItem', 'Unexpected Response from server');
                    }
                } else {
                    let tempAttachments = await this.requestAttachmentData(inboxRes.Attachments);
                    this.postBodies = Object.assign(this.postBodies, {
                        [post.PostData.SessionId]: {
                            Files: getAttachments(tempAttachments),
                            ConversationID: inboxRes.ConversationID,
                            SessionId: post.PostData.SessionId,
                            SubChannel: (post.SubChannel ?? inboxRes.EmailType).toLowerCase(),
                            Subject: post.PostData.Subject,
                            PostAccountName: inboxRes.SocialMediaData.Posts.AccountName
                                ? inboxRes.SocialMediaData.Posts.AccountName
                                : inboxRes.SocialMediaData.Posts.AccountId,
                            PostCreatedTime: inboxRes.SocialMediaData.Posts.CreatedDateTime,
                            PostUpdatedTime: inboxRes.SocialMediaData.Posts.UpdatedDateTime,
                            PostId: inboxRes.SocialMediaData.Posts.PostId,
                            SmActiveComment: inboxRes.SocialMediaData.Comments,
                            SmParentComments: inboxRes.SocialMediaData.ParentComments,
                            PostText: inboxRes.SocialMediaData.Posts.PostText,
                            PostAttachments: inboxRes.SocialMediaData.Posts.PostAttachments,
                            PostEngagements: inboxRes.SocialMediaData.Posts.PostEngagements,
                            Engagement: inboxRes.SocialMediaData.Engagement,
                            IsOutbound: fetchFromOutbox,
                            IsParentCommentEdited: inboxRes.SocialMediaData.ParentComments?.IsEdited,
                            IsParentCommentDeleted: inboxRes.SocialMediaData.ParentComments?.IsDeleted,
                            IsCommentDeleted: inboxRes.SocialMediaData.Comments?.IsDeleted,
                            IsCommentEdited: inboxRes.SocialMediaData.Comments?.IsEdited,
                            IsPostDeleted: inboxRes.SocialMediaData.Posts?.IsDeleted,
                            RouteId: post.PostData.RouteId,
                            PostDetails: {
                                To: post.PostData.To,
                                From: post.PostData.From,
                                Intent: post.PostData.Intent,
                                Status: inboxRes.CurrentStatus
                            }
                        }
                    });
                }
            }

            if (fetchFromOutbox) {
                outboxRes = (
                    await SDKClient.getOutboxItem(
                        this.currentTab === 'draft'
                            ? post.PostData.OutSessionId
                            : `${post.PostData.OutSessionId}|${post.PostData.SessionId}`
                    )
                ).response;
                if (!outboxRes) {
                    throwADError('Error in WorkbenchSmpComponent.getOutboxItem', 'Unexpected Response from server');
                }
                let modifiedAttachmentData: any[] = [];
                if (outboxRes?.SocialMediaData?.Comments?.CommentAttachments?.length) {
                    modifiedAttachmentData = [
                        {
                            IsCloud: true,
                            Url: outboxRes?.SocialMediaData?.Comments?.CommentAttachments[0]?.MediaUrl,
                            IsUploaded: true,
                            Ext: outboxRes?.SocialMediaData?.Comments?.CommentAttachments[0]?.MediaType
                        }
                    ];
                }

                let tempAttachments = await this.requestAttachmentData(
                    this.currentTab === 'draft' ? modifiedAttachmentData : outboxRes.Attachments
                );
                this.postBodies = Object.assign(this.postBodies, {
                    [post.PostData.OutSessionId]: {
                        Files: getAttachments(tempAttachments),
                        ConversationID: outboxRes.ConversationID,
                        SessionId: post.PostData.SessionId,
                        OutSessionId: post.PostData.OutSessionId,
                        SubChannel: post.SubChannel,
                        Subject: post.PostData.Subject,
                        PostAccountName: outboxRes.SocialMediaData.Posts.AccountName
                            ? outboxRes.SocialMediaData.Posts.AccountName
                            : outboxRes.SocialMediaData.Posts.AccountId,
                        PostCreatedTime: outboxRes.SocialMediaData.Posts.CreatedDateTime,
                        PostUpdatedTime: outboxRes.SocialMediaData.Posts.UpdatedDateTime,
                        PostId: outboxRes.SocialMediaData.Posts.PostId,
                        SmActiveComment: outboxRes.SocialMediaData.Comments,
                        SmParentComments: outboxRes.SocialMediaData.ParentComments,
                        PostText: outboxRes.SocialMediaData.Posts.PostText,
                        PostAttachments: outboxRes.SocialMediaData.Posts.PostAttachments,
                        PostEngagements: outboxRes.SocialMediaData.Posts.PostEngagements,
                        Engagements: outboxRes.SocialMediaData.Engagement,
                        IsOutbound: fetchFromOutbox,
                        IsParentCommentEdited: outboxRes.SocialMediaData.ParentComments?.IsEdited,
                        IsParentCommentDeleted: outboxRes.SocialMediaData.ParentComments?.IsDeleted,
                        IsCommentDeleted: outboxRes.SocialMediaData.Comments?.IsDeleted,
                        IsCommentEdited: outboxRes.SocialMediaData.Comments?.IsEdited,
                        IsPostDeleted: outboxRes.SocialMediaData.Posts?.IsDeleted,
                        RouteId: post.PostData.RouteId,
                        PostDetails: {
                            To: post.PostData.To,
                            From: post.PostData.From,
                            Intent: post.PostData.Intent,
                            Status: outboxRes.CurrentStatus
                        }
                    }
                });
            }

            this.hidePostActions =
                inboxRes?.SocialMediaData?.Posts?.IsDeleted || outboxRes?.SocialMediaData?.Posts?.IsDeleted;

            this.openPostRes.data.next(
                Object.assign(post, this.postBodies[getRequestedSession()], {
                    currentTab: this.currentTab
                })
            );
            setTimeout(() => {
                if (preserveChosenPost) {
                    this.toggleDropdown(post.SubChannel, true);
                    setTimeout(() => {
                        if (this.notificationAction === 'smco_e' || this.notificationAction === 'smco_d') {
                            this.toggleDropdown(`${post.SubChannel}-${post.Mailbox.split('@')[0]}`, true);
                        } else {
                            this.toggleDropdown(
                                `${post.SubChannel}-${post.SkillName ? post.SkillName : post.SkillId}`,
                                true
                            );
                        }
                    }, 300);

                    // Just open the post and do nothing for post reaction notifications
                    if (this.notificationAction === 'smrp_a') {
                        this.chosenPostData = undefined;
                        this.notificationAction = undefined;
                    }
                }
            }, 300);
            this.setComponentState('smposts/open/success');
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.openPost] - Error occured while opening a post:',
                JSON.stringify(e),
                true
            );
            console.error(e);
            this.setComponentState('smposts/open/failure');
        }
    }

    /**
     * Method to get attachment meta data from media streamer for archive status
     */
    async requestAttachmentData(attachments: any[]): Promise<any> {
        try {
            let attachmentMap = attachments.reduce(
                (acc, cur) => {
                    if (cur.IsCloud) {
                        let split = cur.Url.split('/');
                        if (split.length > 0) {
                            let fileId = split[split.length - 1];
                            acc.ids.push(fileId);
                            acc.att.push({ ...cur, FileId: fileId, URL: cur.Url });
                        } else {
                            acc.att.push({ ...cur, URL: cur.Url });
                        }
                    } else {
                        acc.att.push({ ...cur, URL: cur.Url });
                    }
                    return acc;
                },
                { ids: [], att: [] }
            );
            if (attachmentMap.ids.length > 0) {
                let ids = attachmentMap.ids.join(',');
                try {
                    const { response } = await TUtils.HttpClient.sendRequest<
                        MediaStreamerMultiResponse<MediaStreamerMetaResponse>
                    >({
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
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.fileMetaError'),
                        'failure'
                    );
                    attachmentMap.att.forEach((cur) => {
                        cur.ArchiveStatus = null;
                        cur.RestoreStatus = null;
                        cur.FileError = true;
                    }, []);
                }
            }
            return attachmentMap.att;
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.requestAttachmentData] - Error occured while requesting attachment data:',
                JSON.stringify(e),
                true
            );
            console.error(e);
            return attachments;
        }
    }

    /**
     * Method to pull posts
     * @param {SMPost[]} posts
     */
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
                    if (this.currentTab === 'draft') {
                        item.sessionId = curr.PostData.OutSessionId;
                    } else if (
                        this.currentTab === 'queue' &&
                        curr.PostData.EmailType !== 'Dummy' &&
                        SMP_OUTBOX_REASONS.includes(curr.PostData.RouteReason)
                    ) {
                        item.sessionId = `${curr.PostData.SessionId}|${curr.PostData.OutSessionId}`;
                    } else if (this.currentTab === 'sentitem') {
                        item.sessionId = `${curr.PostData.SessionId}|${curr.PostData.OutSessionId}`;
                    }
                    acc.items.push(item);
                    return acc;
                },
                { items: [] }
            );
            this.isPullOnProgress = true;
            const { response } = await SDKClient.workbenchPull(
                (this.currentTab === 'sentitem'
                    ? 'sent'
                    : this.currentTab === 'posts'
                    ? 'inbox'
                    : this.currentTab
                ).toLowerCase(),
                {
                    tmacServer,
                    agentId,
                    items
                }
            );
            this.isPullOnProgress = false;

            if (response.Status === 'SUCCESS') {
                this.openPostRes.data.next(null);
                this.selectedPostSessionId = '';
                this.selectedPostId = '';
                this.selectedPostOutSessionId = '';
                this.selectedPostRouteReason = '';
                this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.pullPostsSuccess'),
                    'success'
                );
            }
            if (response.Status === 'FAILED') {
                loader.dismiss();
                const isAlreadyPulled = response.FailedList.Items.filter((f) => f.ResponseCode === -405);
                if (isAlreadyPulled.length) {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.postsAssigned'),
                        'failure'
                    );
                } else {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.pullPostsFailed'),
                        'failure'
                    );
                }
            }
            loader.dismiss();
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.pullPosts] - Error occured while pulling a post:',
                JSON.stringify(e),
                true
            );
            console.error(e);
            loader.dismiss();
            this.isPullOnProgress = false;
            this._appUiService.showSnackbar(
                this.translocoService.translate('sharedComponents.socialMediaPosts.pullPostsFailed'),
                'failure'
            );
        }
    }

    /**
     * Method to get post details in case if
     * session id is not there while pulling the post
     */
    async getValidDataForSelectedPost(): Promise<void> {
        try {
            const inboxRes: GetInboxItemResult = (await SDKClient.getInboxItem(this.selectedPostSessionId)).response;
            const outboxRes: GetInboxItemResult | any = (await SDKClient.getOutboxItem(this.selectedPostOutSessionId))
                .response;
            const postData: SMPost = new SMPost();

            postData.PostData.RouteId = inboxRes.RouteId;
            postData.PostData.SessionId = inboxRes.SessionID;
            postData.PostData.RouteReason = this.selectedPostRouteReason;
            postData.PostData.EmailType = inboxRes.EmailType;
            postData.PostData.OutSessionId = outboxRes?.SessionID;
            this.pullPosts([postData]);
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.getValidDateForSelectedPost] - Error occured while getting valid data for selected post:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to sort and segregate posts
     */
    sortPosts(): void {
        try {
            if (this.sortControls.sortBy === 'Date') {
                this.rawResponse.sort((a, b) => {
                    const dateA = new Date(this.parseDotnetDate(a.AddedTime));
                    const dateB = new Date(this.parseDotnetDate(b.AddedTime));

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
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.sortPosts] - Error occured while sorting post:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to submit global search form data and trigger search
     * Commits the value from global search control value to globalSearch.data
     * When the tab is swithced, this value will be retained in globalSearch.data
     */
    submitGlobalSearchForm(): void {
        try {
            this.globalSearch.data[this.currentTab] = this.globalSearch.form.value;
            this.doAdvancedSearch();
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.submitGlobalSearchForm] - Error occured while submitting global search:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to show post related details
     */
    showPostDetails(): void {
        try {
            let pdHtml = '';
            pdHtml += `<span style="font-weight: 800">To: </span><span style="font-weight: 500">${
                this.postBodies[this.selectedPostSessionId]?.PostDetails?.To
            }</span><br>`;
            pdHtml += `<span style="font-weight: 800">From: </span><span style="font-weight: 500">${
                this.postBodies[this.selectedPostSessionId]?.PostDetails?.From
            }</span><br>`;
            pdHtml += `<span style="font-weight: 800">Intent: </span><span style="font-weight: 500">${
                this.postBodies[this.selectedPostSessionId]?.PostDetails?.Intent
            }</span><br>`;
            pdHtml += `<span style="font-weight: 800">Status: </span><span style="font-weight: 500">${
                this.postBodies[this.selectedPostSessionId]?.PostDetails?.Status
            }</span><br>`;

            this._appUiService.showCustomDialog('alert', pdHtml, 'Post details', {
                messageClasses: 'twd-whitespace-pre-line twd-break-words'
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.showPostDetails] - Error occured while showing post details:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Transfers post
     * @param {SMPost[]} posts
     */
    transferPost(posts: SMPost[]): void {
        try {
            const config = (this.channelConf?.Config || {}) as TwSmpWorkbenchConfig;

            const transferConfig = config?.Transfer ?? {};
            let data = new AgentSkillListDataModel('transferPost', 'Transfer Post');
            data = merge({}, data, transferConfig);
            const sessionKey = this.getCurrentSessionKey();
            data = {
                ...data,
                OtherData: {
                    type: 'transfer',
                    posts: posts.map((p) => ({
                        ...p,
                        SessionId: p[sessionKey],
                        RouteId: p.PostData.RouteId
                    }))
                },
                Callback: ({ success }) => {
                    if (success) {
                        this.doAdvancedSearch(true);
                        this.openPostRes.data.next(null);
                    }
                }
            };

            this._matDialog.open(AgentSkillListComponent, {
                data,
                panelClass: [
                    'agent-skill-dialog',
                    'twd-w-11/12',
                    'twd-h-10/12',
                    'lg:twd-w-7/12',
                    'lg:twd-h-8/12',
                    'xl:twd-w-6/12',
                    '2xl:twd-w-5/12'
                ],
                minWidth: '30%',
                maxWidth: '100%',
                disableClose: true
            });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.transferPost] - Error occured while transferring a post:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Method to get the session key based on current tab
     * Gets the current session's key name
     * @returns {string}
     */
    getCurrentSessionKey(): string {
        try {
            let sessionKey = 'OutSessionId';
            if (['inbox', 'queue'].includes(this.currentTab)) {
                sessionKey = 'SessionId';
            }
            return sessionKey;
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.getCurrentSessionKey] - Error occured while getting current session key:',
                JSON.stringify(e),
                true
            );
            console.error(e);
        }
    }

    /**
     * Closes posts
     * @param {SMPost[]} posts post list
     */
    async closePosts(posts: SMPost[]): Promise<void> {

        // take user consent before closing the post in case of draft
        if(this.currentTab === 'draft') {
            const confirmDialogRef = this._appUiService.showAppConfirmDialog(
                'generic',
                this.translocoService.translate('widgets.smpControls.closeDraftConfirmationHeader'),
                this.translocoService.translate('widgets.smpControls.closeDraftConfirmationBody'),
                'no:yes'
            );

            const dialogResult = await confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)).toPromise();
            if (!dialogResult) {
                return;
            } 
        }
        
        const loader = this._appUiService.showSnackbar(
            this.translocoService.translate('sharedComponents.socialMediaPosts.closePostsLoading'),
            'loading'
        );
        try {
            if (this.currentTab === 'queue') {
                const routeIds = posts.map((curr) => {
                    if (this.selectedPostSessionId === curr.PostData.SessionId) {
                        this.openPostRes.data.next(null);
                    }
                    return curr.PostData.RouteId;
                });
                await SDKClient.closeBulkEmailsInQueue(routeIds.join(','), undefined, true);
            } else {
                await Promise.all(
                    posts.map((curr) => {
                        if (this.selectedPostSessionId === curr.PostData.SessionId) {
                            this.openPostRes.data.next(null);
                        }
                        return SDKClient.changeEmailStatus(
                            {
                                routeId: curr.PostData.RouteId,
                                sessionId: curr.PostData.SessionId,
                                status: ['sentitem', 'draft'].includes(this.currentTab)
                                    ? `Outbox,Closed,sent,${curr.PostData.OutSessionId}`
                                    : 'Close'
                            },
                            undefined,
                            true
                        );
                    })
                );
            }
            this._appUiService.showSnackbar(
                this.translocoService.translate('sharedComponents.socialMediaPosts.closePostsSuccess'),
                'success'
            );
            setTimeout(() => {
                this.doAdvancedSearch(true);
                loader.dismiss();
            }, 1000);
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.closePosts] - Error occured while closing a post:',
                JSON.stringify(e),
                true
            );
            console.error(e);
            loader.dismiss();
            this._appUiService.showSnackbar(
                this.translocoService.translate('sharedComponents.socialMediaPosts.closePostsFailed'),
                'failure'
            );
        }
    }
}
