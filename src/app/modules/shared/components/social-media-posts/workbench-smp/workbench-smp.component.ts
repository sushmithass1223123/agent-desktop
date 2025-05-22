import { AgentSkillListComponent } from '@modules/shared/components';
import { initSmpostsSearchState, SocialMediaPostsService } from './../social-media-posts.service';
import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
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
import { GetItemResult, SDKClient, TUtils } from '@tmac/sdk';
import { AppDataService } from '@services/app-data.service';
import { SMP_OUTBOX_REASONS } from 'app/constants';
import { MatDialog } from '@angular/material/dialog';
import { AgentSkillListDataModel } from 'app/models';

declare var document: any;

export class SMPost {
    Mailbox?: string;
    AddedTime: Date | string;
    SubChannel: string;
    SkillName: string;
    SkillId: string;
    PostData: PostData;
    Files?: any[]; // Will get assigned internally in code
}

interface PostData {
    SessionId: string;
    From: string;
    To: string;
    Subject: string;
    PostId?: string;
    ActiveCommentId?: string;
    ParentCommentId?: string;
    IsItemDeleted?: boolean;
    IsItemEdited?: boolean;
    RouteId: string;
}

const channelMapper: any = {
    fb: 'facebook',
    instagram: 'instagram',
    twitter: 'x',
    youtube: 'youtube'
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
     * List of available social media accounts
     */
    socialMediaAccounts: string[] = [];

    selectedPostSessionId: string;
    selectedPostId: string | any;
    selectedPostOutSessionId: string;
    selectedPostRouteReason: string;
    /**
     * File upload url config
     */
    fileUploadUrl: any;

    // UI modifyers
    segregatedPosts: any = [];

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
    isFullscreen: boolean = false;
    currentTheme: string = 'theme-default-2';
    /**
     * Holds the count of posts for paginator
     */
    totalPostCount: number = 0;

    /**
     * Holds the pageIndex to be shown for paginator
     */
    pageNumber: number = 1;

    /**
     * Holds the count of posts to be shown for paginator
     */
    pageSize: number = 10;

    /**
     * Holds the list of options for page size to be shown for paginator
     */
    pageSizeOptions: number[] = [5, 10, 20, 50, 100, 200];

    outboundStatusList: string[] = ['Pending', 'Failed', 'Success'];

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService,
        private _smpService: SocialMediaPostsService,
        private _appUiService: AppUiService,
        private _appDataService: AppDataService,
        private _matDialog: MatDialog
    ) {
        super('WorkbenchSmpComponent');

        this._fuseFacadeService
            .getConfig()
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((themeData) => {
                this.currentTheme = themeData.colorTheme;
            });
    }

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    onFullScreenChange(event: Event) {
        if (document.fullscreenElement) {
            this.isFullscreen = true;
        } else {
            this.isFullscreen = false;
        }
    }

    async ngOnInit() {
        try {
            // get and set the list of available social media accounts
            await this.setsocialMediaAccounts();

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
                    commentText: globalKey,
                    global: 'GLOBAL',
                    socialMediaAccounts:
                        this._smpService.globalSmpWorkbenchState$.searchParams.value.socialMediaAccounts.join(','),
                    accountName: searchFields.accountName,
                    startDate: searchFields.startDate,
                    endDate: searchFields.endDate,
                    pageSize: this.pageSize,
                    pageNumber: this.pageNumber
                };
            }
            if (!globalKey || (globalKey && this.advancedSearch.data[this.currentTab].changed)) {
                searchParams = {
                    global: '',
                    startDate: searchFields.startDate,
                    endDate: searchFields.endDate,
                    commentText: searchFields.commentText,
                    accountName: searchFields.accountName,
                    socialMediaAccounts: searchFields.socialMediaAccounts.join(','),
                    pageSize: this.pageSize,
                    pageNumber: this.pageNumber
                };
            }
            if (this.currentTab === 'sentitem') {
                searchParams.deviceid = searchFields.deviceid;
                searchParams.agent = searchFields.agent;
                searchParams.sessionid = searchFields.sessionid;
                searchParams.outboundStatus = searchFields.outboundStatus;
            } else if (this.currentTab === 'draft') {
                searchParams.agent = searchFields.agent;
                searchParams.sessionid = searchFields.sessionid;
            } else if (this.currentTab === 'inbox') {
                searchParams.deviceid = searchFields.deviceid;
                searchParams.queue = searchFields.queue;
                searchParams.postText = searchFields.postText;
                searchParams.hasCommentAttachments = searchFields.hasCommentAttachments;
                searchParams.hasPostAttachments = searchFields.hasPostAttachments;
                searchParams.assignedTo = searchFields.assignedTo;
                searchParams.replied = searchFields.replied;
                searchParams.closed = searchFields.closed;
                searchParams.assigned = searchFields.assigned;
                searchParams.sessionid = searchFields.sessionid;
            } else if (this.currentTab === 'queue') {
                searchParams.skills = searchFields.skills;
                searchParams.assignedTo = searchFields.assignedTo;
                searchParams.postText = searchFields.postText;
                searchParams.Channel = 'SM';
            } else if (this.currentTab === 'posts') {
                searchParams.deviceid = searchFields.deviceid;
                searchParams.postText = searchFields.postText;
                searchParams.hasPostAttachments = searchFields.hasPostAttachments;
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
                    ? 'post'
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
                console.log('*****Response from workbench search:', response);
                this.totalPostCount = response.TotalCount;
                this.rawResponse = maps[this.currentTab](response.ResultData ? response.ResultData : []);
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
                    } else if (this.notificationAction === 'smco_e' || this.notificationAction === 'smco_d') {
                        const filteredPost = this.rawResponse.find(
                            (rres) =>
                                rres?.PostData?.ActiveCommentId ===
                                    this.chosenPostData?.SocialMediaData?.Comments?.CommentId ||
                                rres?.PostData?.ParentCommentId ===
                                    this.chosenPostData?.SocialMediaData?.Comments?.CommentId
                        );
                        if (filteredPost) this.openPost(filteredPost, true);
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
                    SkillId: x?.SkillId,
                    SkillName: x?.SkillName,
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
                    Mailbox: x?.AccountName,
                    AddedTime: x?.CommentDatetime,
                    SkillId: x?.Skill,
                    SkillName: x?.SkillName,
                    SubChannel: channelMapper[x?.SubChannel?.toLowerCase()],
                    PostData: {
                        SessionId: x?.SessionID,
                        PostId: x?.PostID,
                        ActiveCommentId: x?.CommentID,
                        From: x?.From,
                        RouteId: '',
                        To: x?.AccountName,
                        Subject: x?.CommentText,
                        IsItemDeleted: x?.IsCommentDeleted || x?.IsPostDeleted,
                        IsItemEdited: x?.IsCommentEdited || x?.IsPostEdited
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
                    Mailbox: x?.AccountName,
                    AddedTime: x?.PostDatetime,
                    SkillId: x?.Skill,
                    SkillName: x?.SkillName,
                    SubChannel: channelMapper[x?.SubChannel?.toLowerCase()],
                    PostData: {
                        SessionId: x?.SessionID,
                        PostId: x?.PostID,
                        From: x?.AccountName,
                        To: x?.AccountName,
                        Subject: x?.PostText,
                        IsItemEdited: x?.IsPostEdited,
                        IsItemDeleted: x?.IsPostDeleted,
                        RouteId: ''
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
                    Mailbox: x?.AccountName,
                    AddedTime: x?.CommentDatetime,
                    SkillId: '',
                    SkillName: '',
                    SubChannel: channelMapper[x?.Label?.split('Draft_')?.pop()?.toLowerCase()],
                    PostData: {
                        SessionId: x?.SessionID,
                        From: x?.From,
                        To: x?.AccountName,
                        Subject: x?.CommentText,
                        RouteId: ''
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
                    Mailbox: x?.AccountName,
                    AddedTime: x?.CommentDatetime,
                    SubChannel: channelMapper[x?.Label?.split('Sent_')?.pop()?.toLowerCase()],
                    SkillId: '',
                    SkillName: '',
                    PostData: {
                        SessionId: x?.SessionID,
                        From: x?.From,
                        To: x?.From,
                        Subject: x?.CommentText,
                        ActiveCommentId: x?.CommentID,
                        ParentCommentId: x?.ParentCommentId,
                        RouteId: ''
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
    private async setsocialMediaAccounts(): Promise<void> {
        try {
            if (!this._smpService.globalSmpWorkbenchState$.socialMediaAccounts.value?.length) {
                await this._smpService.init();
            }

            this.socialMediaAccounts = this._smpService.globalSmpWorkbenchState$.socialMediaAccounts.value;
            this._smpService.globalSmpWorkbenchState$.socialMediaAccounts.valueChanges
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((res) => {
                    this.socialMediaAccounts = res;
                });
        } catch (e) {
            this.logger.error(
                '[WorkbenchSmpComponent.setsocialMediaAccounts] - Error occured while setting available mailboxes:',
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
            if (this.currentTab === 'sentitem' || this.currentTab === 'draft' || this.currentTab === 'posts')
                skillIdentifier = 'Mailbox';
            let availableChannels = Array.from(new Set(response.map((r: SMPost) => r[channelIdentifier])));

            const getSegregatedPostsBySkill = (channel: string) => {
                let filteredPostsByChannel: SMPost[] = response.filter(
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

            let fetchFromOutbox = this.currentTab === 'draft' || this.currentTab === 'sentitem';
            let inboxRes: GetItemResult | any;
            let outboxRes: GetItemResult | any;

            const getRequestedSession = () => post.PostData.SessionId;

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

            if (!fetchFromOutbox) {
                inboxRes = (
                    await SDKClient[this.currentTab === 'posts' ? 'getPostItem' : 'getInboxItem'](
                        post.PostData.SessionId ?? post.PostData.PostId
                    )
                ).response;
                if (!inboxRes) {
                    if (this.currentTab === 'queue') {
                        fetchFromOutbox = true;
                    } else if (!fetchFromOutbox) {
                        throwADError('Error in WorkbenchSmpComponent.getInboxItem', 'Unexpected Response from server');
                    }
                } else {
                    let modifiedAttachmentData: any[] = [];
                    if (inboxRes?.Comments?.CommentAttachments?.length) {
                        modifiedAttachmentData = inboxRes.Comments.CommentAttachments.map((attdat) => {
                            return {
                                IsCloud: true,
                                Url: attdat?.MediaUrl,
                                IsUploaded: true,
                                Ext: attdat?.MediaType
                            };
                        });
                    }
                    let tempAttachments = await this.requestAttachmentData(
                        modifiedAttachmentData.length ? modifiedAttachmentData : []
                    );
                    this.postBodies = Object.assign(this.postBodies, {
                        [post.PostData.SessionId]: {
                            Files: getAttachments(tempAttachments),
                            SessionId: post.PostData.SessionId,
                            SubChannel: post.SubChannel.toLowerCase(),
                            Subject: post.PostData.Subject,
                            PostAccountName: inboxRes.Posts.AccountName
                                ? inboxRes.Posts.AccountName
                                : inboxRes.Posts.AccountId,
                            PostCreatedTime: inboxRes.Posts.CreatedDateTime,
                            PostUpdatedTime: inboxRes.Posts.UpdatedDateTime,
                            PostId: inboxRes.Posts.PostId,
                            SmActiveComment: inboxRes.Comments,
                            SmParentComments: inboxRes.ParentComments,
                            PostText: inboxRes.Posts.PostText,
                            PostAttachments: inboxRes.Posts.PostAttachments,
                            PostEngagements: inboxRes.Posts.PostEngagements,
                            Engagement: inboxRes.Engagement,
                            IsOutbound: fetchFromOutbox,
                            IsParentCommentEdited: inboxRes.ParentComments?.IsEdited,
                            IsParentCommentDeleted: inboxRes.ParentComments?.IsDeleted,
                            IsCommentDeleted: inboxRes.Comments?.IsDeleted,
                            IsCommentEdited: inboxRes.Comments?.IsEdited,
                            IsPostDeleted: inboxRes.Posts?.IsDeleted,
                            IsPostEdited: inboxRes.Posts?.IsEdited,
                            RouteId: inboxRes.RouteId,
                            PostDetails: {
                                To: post.PostData.To,
                                From: post.PostData.From
                            }
                        }
                    });
                }
            }

            if (fetchFromOutbox) {
                outboxRes = (
                    await SDKClient[this.currentTab === 'posts' ? 'getPostItem' : 'getOutboxItem'](
                        post.PostData.SessionId ?? post.PostData.PostId
                    )
                ).response;
                if (!outboxRes) {
                    throwADError('Error in WorkbenchSmpComponent.getOutboxItem', 'Unexpected Response from server');
                }
                let modifiedAttachmentData: any[] = [];
                if (outboxRes?.SocialMediaData?.Comments?.CommentAttachments?.length) {
                    modifiedAttachmentData = outboxRes.SocialMediaData.Comments.CommentAttachments.map((attdat) => {
                        return {
                            IsCloud: true,
                            Url: attdat?.MediaUrl,
                            IsUploaded: true,
                            Ext: attdat?.MediaType
                        };
                    });
                }

                let tempAttachments = await this.requestAttachmentData(
                    this.currentTab === 'draft' ? modifiedAttachmentData : []
                );
                this.postBodies = Object.assign(this.postBodies, {
                    [post.PostData.SessionId]: {
                        Files: getAttachments(tempAttachments),
                        SessionId: post.PostData.SessionId,
                        SubChannel: post.SubChannel,
                        Subject: post.PostData.Subject,
                        PostAccountName: outboxRes.Posts.AccountName
                            ? outboxRes.Posts.AccountName
                            : outboxRes.Posts.AccountId,
                        PostCreatedTime: outboxRes.Posts.CreatedDateTime,
                        PostUpdatedTime: outboxRes.Posts.UpdatedDateTime,
                        PostId: outboxRes.Posts.PostId,
                        SmActiveComment: outboxRes.Comments,
                        SmParentComments: outboxRes.ParentComments,
                        PostText: outboxRes.Posts.PostText,
                        PostAttachments: outboxRes.Posts.PostAttachments,
                        PostEngagements: outboxRes.Posts.PostEngagements,
                        Engagements: outboxRes.Engagement,
                        IsOutbound: fetchFromOutbox,
                        IsParentCommentEdited: outboxRes.ParentComments?.IsEdited,
                        IsParentCommentDeleted: outboxRes.ParentComments?.IsDeleted,
                        IsCommentDeleted: outboxRes.Comments?.IsDeleted,
                        IsCommentEdited: outboxRes.Comments?.IsEdited,
                        IsPostDeleted: outboxRes.Posts?.IsDeleted,
                        IsPostEdited: outboxRes.Posts?.IsEdited,
                        RouteId: outboxRes.RouteId,
                        PostDetails: {
                            To: post.PostData.To,
                            From: post.PostData.From
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
                (acc: any, curr) => {
                    acc.items.push({
                        routeId: (curr as any).RouteId || '',
                        sessionId: curr.PostData.SessionId,
                        inSessionId: curr.PostData.SessionId,
                        account: curr?.Mailbox || ''
                    });
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
            const inboxRes: GetItemResult = (await SDKClient.getInboxItem(this.selectedPostSessionId)).response;
            const postData: SMPost = new SMPost();

            postData.PostData.RouteId = inboxRes.RouteId;
            postData.PostData.SessionId = inboxRes.CommentInSessionId;
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
        if (this.currentTab === 'draft') {
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
                await SDKClient.closeBulkSMInQueue(routeIds.join(','));
            } else {
                await Promise.all(
                    posts.map((curr) => {
                        if (this.selectedPostSessionId === curr.PostData.SessionId) {
                            this.openPostRes.data.next(null);
                        }
                        return SDKClient.changeSMStatus({
                            routeId: curr.PostData.RouteId,
                            inboxSessionId: curr.PostData.SessionId,
                            status: ['sentitem', 'draft'].includes(this.currentTab)
                                ? `Outbox,Closed,sent,${curr.PostData.SessionId}`
                                : 'Close'
                        });
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

    onToggleFullscreen(): void {
        try {
            const mainWbsmp: any = document.getElementById('mainContentWbsmp');

            if (!this.isFullscreen) {
                if (mainWbsmp.requestFullscreen) {
                    mainWbsmp.requestFullscreen();
                } else if (mainWbsmp.webkitRequestFullscreen) {
                    mainWbsmp.webkitRequestFullscreen();
                } else if (mainWbsmp.msRequestFullscreen) {
                    mainWbsmp.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
            this.isFullscreen = !this.isFullscreen;
        } catch (e) {}
    }

    trackByChannel(index: number, item: any): any {
        return Object.keys(item)[0];
    }

    trackBySkill(index: number, item: any): any {
        return Object.keys(item)[0];
    }

    trackByItem(index: number, item: SMPost): any {
        return item.PostData.SessionId;
    }

    /**
     * Method to handle paginator page change
     * @param {PageEvent} $event Page event
     */
    onPaginatorPageChange($event) {
        console.log('Page change:', $event);
        this.pageNumber = $event.pageIndex;
        this.pageSize = $event.pageSize;
        this.doAdvancedSearch(true);
    }
}
