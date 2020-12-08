import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { DomSanitizer } from '@angular/platform-browser';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AppUiService } from '@services/app-ui.service';
import { COMMON_ERR_MESSAGE, DRAFT_REASONS, INBOX_REASONS, OUTBOX_REASONS } from 'app/constants';
import { IWidget, ResData } from 'app/interfaces';
import { groupBy } from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

type AvailableTabs = 'inbox' | 'sentitem' | 'queue' | 'draft';
type EmailPullItem = { sessionId: string; routeId: string; conversationId: string };
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
export class WorkbenchEmailComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    OutboxReasons = OUTBOX_REASONS;
    DraftReasons = DRAFT_REASONS;
    InboxReasons = INBOX_REASONS;

    emailBodies: Record<string, any> = {};

    /**
     * To store the fuse config for theme
     */
    fuseConfig: FuseConfig;

    /**
     * Search key
     */
    searchTerm = '';
    /**
     * Selected Mail
     */
    selectedMails: any[] = [];
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
     * Advanced search form group
     */
    advancedSearchForm = new FormGroup({
        fromDate: new FormControl(''),
        fromTime: new FormControl(''),
        toDate: new FormControl(''),
        toTime: new FormControl(''),
        email: new FormControl(''),
        subject: new FormControl(''),
        content: new FormControl(''),
        skills: new FormControl(''),

        agent: new FormControl(''),

        inSessionid: new FormControl(''),

        deviceid: new FormControl(''),
        hasAttachments: new FormControl(false),
        assignedTo: new FormControl(''),

        replied: new FormControl(''),
        closed: new FormControl(''),
        assigned: new FormControl(''),

        sesisonid: new FormControl(''),
        global: new FormControl(''),
        listOfMailboxes: new FormControl('singteldemo@tetherfi.com', [Validators.required])
    });

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
    searchReqObs$: Record<AvailableTabs, () => Observable<any>>;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private http: HttpClient,
        private domSanitizer: DomSanitizer,
        private appUiService: AppUiService
    ) {
        super();
        this.searchReqObs$ = {
            draft: this.advanceSearchDraftEmail,
            inbox: this.advanceSearchInboxEmail,
            queue: this.advanceSearchQueuedEmail,
            sentitem: this.advanceSearchSentEmail
        };
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        this.advancedSearchForm.patchValue({
            fromDate: yesterday,
            fromTime: `00:00`,
            toDate: today,
            toTime: `${'23'}:${'59'}`
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // -----------------------------------------------------------
        // To get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        this.advancedSearchForm.get('global').valueChanges.subscribe((global) => {
            const toggledFields = [
                'email',
                'subject',
                'content',
                'skills',
                'agent',
                'inSessionid',
                'deviceid',
                'assignedTo',

                'hasAttachments',

                'replied',
                'repliedValue',

                'closed',
                'closedValue',

                'assigned',
                'assignedValue',

                'sesisonid',
                'listOfMailboxes'
            ];
            if (global) {
                toggledFields.forEach((field) => {
                    this.advancedSearchForm.controls[field].disable();
                });
            } else {
                toggledFields.forEach((field) => {
                    this.advancedSearchForm.controls[field].enable();
                });
            }
        });

        this.doAdvancedSearch();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Filter emails
     * TODO
     * @method filterEmails
     */
    filterEmails(): void {}

    /**
     * Check if tree node has child
     * @param {number} _
     * @param {any} node
     */
    hasChild = (_: number, node: any) => !!node.children && node.children.length > 0;

    /**
     * Advbanced Search
     * @method advancedSearch
     */
    doAdvancedSearch(): void {
        try {
            if (!this.data.Data.WorkbenchUrl) {
                this.emailSearchRes = {
                    loading: false,
                    error: true,
                    msg: 'WorkbenchUrl not provided',
                    data: { selected: this.emailSearchRes.data.selected || false }
                };
                return;
            }

            this.emailSearchRes.loading = true;
            this.emailSearchRes.error = false;
            this.showAdvancedSearchForm = false;

            this.searchReqObs$[this.currentTab]().subscribe(
                (res: any) => {
                    if (res.status === 'SUCCESS') {
                        const mails = res.result.map((x: any) => {
                            const mailRes = typeof x.data === 'string' ? JSON.parse(x.data) : x;
                            if (x.addedTime) {
                                mailRes.addedTime = x.addedTime;
                            }
                            mailRes.body = this.domSanitizer.bypassSecurityTrustHtml(mailRes.body);
                            return mailRes;
                        });
                        const byMailList = groupBy(mails, 'To');
                        let nodes: any;
                        if (['sentitem', 'draft'].includes(this.currentTab)) {
                            nodes = Object.keys(byMailList).map((name) => {
                                return { name, children: byMailList[name] };
                            });
                        } else {
                            nodes = Object.keys(byMailList).map((name) => {
                                const groupedNodes = groupBy(byMailList[name], 'Skill');
                                return { name, children: Object.keys(groupedNodes).map((n) => ({ name: n, children: groupedNodes[n] })) };
                            });
                        }
                        this.emailSearchRes = {
                            loading: false,
                            error: false,
                            msg: '',
                            data: { selected: this.emailSearchRes.data.selected || false }
                        };
                        this.dataSource.data = nodes;
                    } else {
                        this.emailSearchRes = {
                            loading: false,
                            error: true,
                            msg: COMMON_ERR_MESSAGE,
                            data: { selected: this.emailSearchRes.data.selected || false }
                        };
                    }
                },
                () => {
                    this.emailSearchRes = {
                        loading: false,
                        error: true,
                        msg: COMMON_ERR_MESSAGE,
                        data: { selected: this.emailSearchRes.data.selected || false }
                    };
                }
            );
        } catch (e) {
            console.error(e);
            this.emailSearchRes = {
                loading: false,
                error: true,
                msg: COMMON_ERR_MESSAGE,
                data: { selected: this.emailSearchRes.data.selected || false }
            };
        }
    }

    /**
     * Deletes emails via workbench
     * @param emails email items list
     */
    async deleteEmails(emails: any[]): Promise<void> {
        const loader = this.appUiService.showSnackbar('Deleting emails', 'loading');
        try {
            const sessionIds = emails.map((x) => x.SessionId) || [];
            await SDKClient.deleteBulkEmailsInDraft(sessionIds.join(','));
            this.selectedMails = [];
            this.doAdvancedSearch();
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
            const routeIds = emails.map((x) => x.RouteId) || [];
            await SDKClient.closeBulkEmailsInQueue(routeIds.join(','));
            this.selectedMails = [];
            this.doAdvancedSearch();
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
            const items: EmailPullItem[] = emails.map((x) => {
                return {
                    routeId: x.RouteId || '',
                    sessionId: x.SessionId,
                    conversationId: x.conversationID || '',
                    inSessionId: x.inSessionID,
                    mailbox: x.mailbox
                };
            });
            this.http
                .post(this.data.Data.WorkbenchUrl + `/${this.currentTab}/pull`, {
                    tmacServer,
                    agentId,
                    items
                })
                .subscribe(
                    (res: any) => {
                        if (res.status === 'FAILED') {
                            console.error(res);
                            loader.dismiss();
                            this.appUiService.showSnackbar('Unable to pull email', 'failure');
                            return;
                        }
                        this.selectedMails = [];
                        loader.dismiss();
                        this.appUiService.showSnackbar('Emails pulled successfully', 'success');
                    },
                    (err) => {
                        console.error(err);
                        loader.dismiss();
                        this.appUiService.showSnackbar('Unable to pull email', 'failure');
                    }
                );
        } catch (e) {
            console.error(e);
            loader.dismiss();
            this.appUiService.showSnackbar('Unable to pull email', 'failure');
        }
    }

    advanceSearchQueuedEmail = (): Observable<any> => {
        const { agentId } = SDKClient.getAgentData();

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

        return this.http.post(this.data.Data.WorkbenchUrl + '/queue/search', {
            skills: searchFields.skills ? [searchFields.skills] : [],
            email: searchFields.email,
            agent: '',
            startDate,
            endDate,
            subject: searchFields.subject,
            content: searchFields.content
        });
    };

    advanceSearchInboxEmail = (): Observable<any> => {
        const { agentId } = SDKClient.getAgentData();

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
            .post(this.data.Data.WorkbenchUrl + '/inbox/search', {
                skills: searchFields.skills ? [searchFields.skills] : [],
                email: searchFields.email,
                agent: '',
                startDate,
                endDate,
                subject: searchFields.subject,
                content: searchFields.content,
                deviceid: searchFields.deviceId,
                assignedTo: searchFields.assignedTo,
                sesisonid: searchFields.sesisonid,
                global: searchFields.global,
                listOfMailboxes: searchFields.listOfMailboxes,
                hasAttachments: searchFields.hasAttachments,
                replied: searchFields.replied === 'any',
                repliedValue: searchFields.replied === 'yes',
                closed: searchFields.closed === 'any',
                closedValue: searchFields.closedValue === 'yes',
                assigned: searchFields.assigned === 'any',
                assignedValue: searchFields.assignedValue === 'yes'
            })
            .pipe(
                map((res: any) => ({
                    ...res,
                    result: res.result.map((x: any, uiId) => {
                        return {
                            ...x,
                            To: x.mailbox,
                            Skill: x.cmSkill,
                            Subject: x.subject,
                            From: x.from,
                            addedTime: x.receivedDate,
                            uiId,
                            SessionId: x.sessionID,
                            RouteId: x.routeId
                        };
                    })
                }))
            );
    };

    advanceSearchDraftEmail = (): Observable<any> => {
        const { agentId } = SDKClient.getAgentData();

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
                agent: '',
                startDate,
                endDate,
                subject: searchFields.subject,
                content: searchFields.content,
                inSessionid: searchFields.inSessionid,
                listOfMailboxes: searchFields.listOfMailboxes
            })
            .pipe(
                map((res: any) => ({
                    ...res,
                    result: res.result.map((x: any, uiId) => {
                        return {
                            ...x,
                            To: x.mailbox,
                            Skill: x.cmSkill,
                            Subject: x.subject,
                            From: x.from,
                            addedTime: x.receivedDate,
                            uiId,
                            SessionId: x.sessionID,
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
        const { agentId } = SDKClient.getAgentData();

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
                listOfMailboxes: searchFields.listOfMailboxes,
                InSessionid: searchFields.inSessionid,
                global: searchFields.global
            })
            .pipe(
                map((res: any) => ({
                    ...res,
                    result: res.result.map((x: any, uiId) => {
                        return {
                            ...x,
                            To: x.mailbox,
                            Skill: x.cmSkill,
                            Subject: x.subject,
                            From: x.from,
                            addedTime: x.receivedDate,
                            uiId,
                            SessionId: x.inSessionID,
                            RouteId: x.routeId
                        };
                    })
                }))
            );
    };

    /**
     * Select emails
     */
    selectEmail(evt: MatCheckboxChange): void {
        if (evt.checked) {
            this.selectedMails.push(evt.source.value);
        } else {
            this.selectedMails = this.selectedMails.filter((x) => x.uiId !== (evt.source.value as any).uiId);
        }
    }

    /**
     * opens email for preview
     */
    async openEmail(email: any): Promise<void> {
        try {
            const fetchFromOutbox = [...this.OutboxReasons, ...this.DraftReasons].includes(email.RouteReason);
            const requestedSession = fetchFromOutbox
                ? email.sessionID || email.OutSessionId
                : email.inSessionID || email.sessionID || email.SessionId;
            if (!this.emailBodies[requestedSession]) {
                const res = (await (fetchFromOutbox ? SDKClient.getOutboxEmail(requestedSession) : SDKClient.getInboxEmail(requestedSession)))
                    .response;
                // check the response
                if (!res) {
                    this.appUiService.showSnackbar('Something went wrong, Error in email preview', 'failure');
                    return;
                }
                this.emailBodies[requestedSession] = {
                    body: this.domSanitizer.bypassSecurityTrustHtml(res.Body),
                    attachmentList: res?.Attachments || [],
                    agentName: res?.AgentName,
                    repliedStatus: (res as any)?.RepliedStatus,
                    conversationID: res.ConversationID,
                    currentStatus: res.CurrentStatus,
                    closedBy: (res as any).ClosedBy
                };
            }
            this.emailSearchRes.data.selected = { ...email, ...this.emailBodies[requestedSession] };
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Switches tabs
     * @param {AvailableTabs} tab tab key passed as argument
     */
    switchTab(tab: AvailableTabs): void {
        this.currentTab = tab;
        this.selectedMails = [];

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        // this.advancedSearchForm.reset();
        this.advancedSearchForm.setValue({
            fromDate: yesterday,
            fromTime: `00:00`,
            toDate: today,
            toTime: `${'23'}:${'59'}`,
            email: '',
            subject: '',
            content: '',
            skills: '',

            agent: '',

            inSessionid: '',

            deviceid: '',
            hasAttachments: false,
            assignedTo: '',

            replied: 'any',
            repliedValue: false,

            closed: 'any',
            closedValue: false,

            assigned: 'any',
            assignedValue: false,

            sesisonid: '',
            global: '',
            listOfMailboxes: 'singteldemo@tetherfi.com'
        });
        this.doAdvancedSearch();
    }
}

// for more info visit - https://angular.io/api/core
