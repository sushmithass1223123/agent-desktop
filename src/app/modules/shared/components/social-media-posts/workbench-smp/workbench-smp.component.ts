import { initSmpostsSearchState, SocialMediaPostsService } from './../social-media-posts.service';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { IWidget, ResData } from 'app/interfaces';
import { TwSmpWorkbenchConfig, TwWorkbenchPanelChannel, TwWorkbenchPanelGeneral } from '@ad/types';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { filter, map, timeout } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { fuseAnimations } from '@fuse/animations';
import { BehaviorSubject, forkJoin, Observable, Subscription, timer } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { AppUiService } from '@services/app-ui.service';
import { addHours, format, format as formatDate } from 'date-fns';
import { HttpClient } from '@angular/common/http';
import { isEqual } from 'lodash';
import { throwADError } from 'app/utils';

export class SMPost {
    Skill: string;
    AddedTime: Date;
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
        form: this._smpService.globalEmailWorkbenchState$.searchParams,
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
     * Email Search Stateful request
     */
    smpSearchRes: ResData = {
        error: false,
        loading: false,
        msg: ''
    };
    /**
     * Email Search Stateful request
     */
    openSmpRes: ResData<
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

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService,
        private _smpService: SocialMediaPostsService,
        private _appUiService: AppUiService,
        private http: HttpClient
    ) {
        super('WorkbenchSmpComponent');
    }

    ngOnInit(): void {
        this.validateAvailabletabsFromConfiguration();

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
                        // check if polling is enabled in config or not
                        // polling is disabled when it is set to 0
                        this.polling.allowed = this.polling.enabled =
                            (this.channelConf.Config as TwSmpWorkbenchConfig).SearchPollingInterval > 0;
                        if ((this.channelConf.Config as TwSmpWorkbenchConfig).SearchPollingInterval) {
                            this.startPolling();
                        } else {
                            // if polling is disabled, do an advanced search only once
                            // this.doAdvancedSearch();
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
                        !this.smpSearchRes.loading &&
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
                this.smpSearchRes.loading = false;
                this.smpSearchRes.msg = this.translocoService.translate(
                    'sharedComponents.socialMediaPosts.getPostsFailed'
                );
                this.smpSearchRes.error = true;
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
                this.smpSearchRes.loading = true;
                this.smpSearchRes.error = false;
                this.openSmpRes.data.next(null);
                this.advancedSearch.snackbarRef = this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.getPostsLoading'),
                    'loading'
                );
                break;

            case 'smposts/success':
                this.smpSearchRes.loading = false;
                this.smpSearchRes.error = false;
                this.advancedSearch.snackbarRef?.dismiss();
                break;

            case 'smposts/polling/inactive':
                this.polling.failed = false;
                this.polling.active = false;
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
                    msg: this.translocoService.translate('sharedComponents.email.workbenchURLNotFound'),
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
                    content: this.currentTab !== 'queue' ? globalKey : undefined,
                    global: 'GLOBAL',
                    startDate: searchFields.startDate,
                    endDate: searchFields.endDate,
                    skills: []
                };
                requests.push(this.http.post(`${this.data.Data.WorkbenchUrl}/${this.currentTab}/search`, searchParams));
            }

            const maps: Record<AvailableTabs, any> = {
                inbox: this.mapInboxPosts,
                queue: [],
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
                                JSON.stringify(res.find((x: any) => x.status !== 'SUCCESS'))?.toLowerCase()
                            );

                            // Todo: handle result str
                            alert(resultStr);
                        }
                        const posts = res.map((x: any) => x.result || []).flat();
                        return maps[this.currentTab](posts);
                    })
                )
                .subscribe({
                    next: (res: SMPost[]) => {
                        this.setComponentState('smposts/success', { silent });
                    },
                    error: (e) => {
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

        this._smpService.resetEmailState(updateValue);

        this.advancedSearch.data[this.currentTab] = {
            data: this.advancedSearch.form.value,
            changed: false
        };
    }

    /**
     * Method to handle tab switching from user
     * @param tabName Name of the tab that user tends to switch
     */
    switchTab(tabName: string): void {
        try {
            this.currentTab = tabName;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to handle data refreshing
     */
    doSmpDataRefresh(): void {
        try {
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * This method is used to formate the post list reponse from the inbox search
     * @param {any} result This is the response form the inbox search
     * @returns {SMPost[]} returns mapped posts parsed into SMPost type
     */
    mapInboxPosts(result: any): SMPost[] {
        try {
            if (!result || !result.length) {
                return [];
            }

            return result.map((x: any): SMPost => {
                const AddedTime = new Date(x.currentStatusDate);
                if (!x.currentStatusTime) {
                    console.log('Unable to split x.currentStatusTime', x);
                }
                const time = x.currentStatusTime.split(':');
                AddedTime.setHours(time[0]);
                AddedTime.setMinutes(time[1]);
                return {
                    Skill: x.makerSkillName || x.cmSkill,
                    AddedTime
                };
            });
        } catch (error) {
            console.error(error);
        }
    }
}
