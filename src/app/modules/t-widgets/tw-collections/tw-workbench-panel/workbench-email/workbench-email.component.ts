import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { DomSanitizer } from '@angular/platform-browser';
import { fuseAnimations } from '@fuse/animations';
import { AgentSkillListComponent } from '@modules/shared/components';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { EmailTemplate, SDKClient } from '@tmac/sdk';
import { COMMON_ERR_MESSAGE, DRAFT_REASONS, INBOX_REASONS, OUTBOX_REASONS, QUILL_EDITOR_CONFIG } from 'app/constants';
import { AgentSkillListData, IWidget, ResData } from 'app/interfaces';
import { formatJsonData, urlify } from 'app/utils';
import { groupBy, sortBy } from 'lodash';
import * as moment from 'moment';
import Quill from 'quill';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { TwWorkBenchService } from '../tw-workbench-panel.service';

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
export class WorkbenchEmailComponent extends TWidgetWrapper implements OnInit, OnDestroy {
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
    replyEditorModal: MatDialogRef<any>;
    /**
     * Config for quill editor
     */
    editorConfig = QUILL_EDITOR_CONFIG;
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
     * Quill instance
     */
    quillInstance: any;

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
        private _workbenchService: TwWorkBenchService
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
        if (!this.globalSearchControl.value) {
            this.globalSearchControl.reset();
        }
        this.doAdvancedSearch();
        this.sortControls.sortBy.valueChanges.subscribe(() => this.sortEmailsByKey());
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
            const descendants = this.treeControl.getDescendants(curr);
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
                acc.push({ name, children, To: name || '' });
                return acc;
            }, []);
        } else {
            nodes = Object.keys(byMailList).map((name) => {
                const groupedNodes = groupBy(byMailList[name], 'Skill');
                return {
                    name,
                    children: Object.keys(groupedNodes).map((n) => ({
                        name: n,
                        children: groupedNodes[n],
                        To: name,
                        Skill: n
                    })),
                    To: name
                };
            });
        }
        this.dataSource.data = nodes;
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
                        const mails = res.result.map((x: any, idx) => {
                            const mailRes = typeof x.data === 'string' ? JSON.parse(x.data) : x;
                            if (x.addedTime) {
                                mailRes.addedTime = x.addedTime;
                            }
                            mailRes.uiId = `${idx}_${Date.now()}`;
                            mailRes.Subject = this.domSanitizer.bypassSecurityTrustHtml(
                                (mailRes.Subject || '').replaceAll('<a', '<a target="_blank"')
                            )['changingThisBreaksApplicationSecurity'];
                            mailRes.body = this.domSanitizer.bypassSecurityTrustHtml((mailRes.body || '').replaceAll('<a', '<a target="_blank"'))[
                                'changingThisBreaksApplicationSecurity'
                            ];
                            return mailRes;
                        });
                        this.sortEmailsByKey(mails);
                        this.emailSearchRes = {
                            loading: false,
                            error: false,
                            msg: '',
                            data: { selected: this.emailSearchRes.data.selected || false }
                        };
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
     * To do global search
     */
    doGlobalSearch(): void {
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
                listOfMailboxes: 'singteldemo@tetherfi.com',

                hasAttachments: 'no',
                replied: 'any',
                closed: 'any',
                assigned: 'any'
            };
            this.searchReqObs$[this.currentTab](searchParams).subscribe(
                (res: any) => {
                    if (res.status === 'SUCCESS') {
                        const mails = res.result.map((x: any) => {
                            const mailRes = typeof x.data === 'string' ? JSON.parse(x.data) : x;
                            if (x.addedTime) {
                                mailRes.addedTime = x.addedTime;
                            }
                            mailRes.id = Date.now();
                            mailRes.body = this.domSanitizer.bypassSecurityTrustHtml(mailRes.body);
                            return mailRes;
                        });
                        this.sortEmailsByKey(mails);
                        this.emailSearchRes = {
                            loading: false,
                            error: false,
                            msg: '',
                            data: { selected: this.emailSearchRes.data.selected || false }
                        };
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
            if (!['inbox', 'draft'].includes(this.currentTab)) {
                throw new Error('Cannot delete emails from this tab');
            }
            const sessionIds = emails.map((x) => x.SessionId) || [];
            if (this.currentTab === 'inbox') {
                await SDKClient.maskInboxEmail({
                    sessionId: sessionIds.join(','),
                    source: 'agent-desktop'
                });
            } else if (this.currentTab === 'draft') {
                await SDKClient.deleteBulkEmailsInDraft(sessionIds.join(','));
            }
            this.selectedMails = [];
            const selectedEmail = this.emailSearchRes.data.selected;
            if (selectedEmail && sessionIds.includes(selectedEmail.SessionId)) {
                this.emailSearchRes.data.selected = null;
            }
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

    /**
     * Searched through queued emails
     */
    advanceSearchQueuedEmail = (searchParams?: any): Observable<any> => {
        // const { agentId } = SDKClient.getAgentData();

        const searchFields = searchParams || this.advancedSearchForm.value;

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
            agent: searchFields.agent || '',
            startDate,
            endDate,
            subject: searchFields.subject,
            content: searchFields.content
        });
    };

    /**
     * Searched through inbox emails
     */
    advanceSearchInboxEmail = (searchParams?: any): Observable<any> => {
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
                listOfMailboxes: searchFields.listOfMailboxes,
                hasAttachments: searchFields.hasAttachments === 'yes',
                replied: searchFields.replied !== 'any',
                closed: searchFields.closed !== 'any',
                assigned: searchFields.assigned !== 'any'
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
                                Skill: 'makerSkillName',
                                Subject: 'subject',
                                From: 'from',
                                SessionId: 'sessionID',
                                RouteId: 'routeId',
                                RouteReason: 'RouteReason'
                            }),
                            addedTime
                        };
                    })
                }))
            );
    };

    /**
     * Searches through draft emails
     */
    advanceSearchDraftEmail = (searchParams?: any): Observable<any> => {
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
                listOfMailboxes: searchFields.listOfMailboxes
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
                            Skill: x.makerSkillName || x.cmSkill,
                            Subject: x.subject,
                            From: x.from,
                            addedTime,
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
    advanceSearchSentEmail = (searchParams?: any): Observable<any> => {
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
                listOfMailboxes: searchFields.listOfMailboxes,
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
                            Skill: x.makerSkillName || x.cmSkill,
                            Subject: x.subject,
                            From: x.toList,
                            addedTime,
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
            this.emailSearchRes.loading = true;
            // const fetchFromOutbox = [...this.OutboxReasons, ...this.DraftReasons].includes(email.RouteReason);
            const fetchFromOutbox = this.currentTab === 'draft' || this.currentTab === 'sentitem';
            const requestedSession = fetchFromOutbox
                ? email.sessionID || email.OutSessionId
                : email.inSessionID || email.sessionID || email.SessionId;
            if (!this.emailBodies[requestedSession]) {
                const res = (await (fetchFromOutbox ? SDKClient.getOutboxEmail(requestedSession) : SDKClient.getInboxEmail(requestedSession)))
                    .response;
                // check the response
                if (!res) {
                    this.appUiService.showSnackbar('Something went wrong, Error in email preview', 'failure');
                    this.emailSearchRes.loading = false;
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
            this.emailSearchRes.data.selected = { ...email, ...this.emailBodies[requestedSession], currentTab: this.currentTab };
            this.emailSearchRes.loading = false;

            // setTimeout(() => {
            //     const openEmailBodyRef = document.getElementById('openEmailRef');
            //     openEmailBodyRef.onscroll = (evt) => {
            //         if (openEmailBodyRef.scrollTop > 50) {
            //             this.minimizeSubject = true;
            //         } else {
            //             this.minimizeSubject = false;
            //         }
            //     };
            // }, 100);
        } catch (e) {
            console.error(e);
            this.emailSearchRes.loading = false;
        }
    }

    /**
     * Switches tabs
     * @param {AvailableTabs} tab tab key passed as argument
     */
    switchTab(tab: AvailableTabs): void {
        this.currentTab = tab;
        this.selectedMails = [];
        this.emailSearchRes.data.selected = false;
        // this.resetForm();
        this.doAdvancedSearch();
    }

    /**
     * Marks currently selected email as spam
     */
    markAsSpam(email: any): void {
        const confirmDialogRef = this.appUiService.showAppConfirmDialog('generic', 'Confirm Spam', 'Are you sure to mark this email as spam?');
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
                const loader = this.appUiService.showSnackbar('Spamming email', 'loading');
                SDKClient.markEmailAsSpam({
                    fromAddress: email.From,
                    routeId: email.RouteId,
                    sessionId: email.SessionId
                })
                    .then(() => {
                        loader.dismiss();
                        this.appUiService.showSnackbar('Email marked as spam');
                    })
                    .catch((err) => {
                        console.error(err);
                        this.appUiService.showSnackbar('Unable to spam the email', 'failure');
                    });
            }
        });
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
                    this.doAdvancedSearch();
                }
            }
        };
        this.matDialog.open(AgentSkillListComponent, {
            data: {
                ...data,
                // interactionId: email.InteractionId,
                otherData: {
                    type: 'transfer',
                    emails
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
        let loader;
        // let quill;
        try {
            this.replyEditorModal = this.matDialog.open(this.ReplyEditorDialog, {
                minHeight: '30%'
            });
            this.replyEditorModal.afterOpened().subscribe(() => {
                if (this.ReplyEditor.nativeElement) {
                    this.quillInstance = new Quill(this.ReplyEditor.nativeElement, QUILL_EDITOR_CONFIG);
                }
            });
            this.replyEditorModal.afterClosed().subscribe(async (reply = false) => {
                if (reply) {
                    loader = this.appUiService.showSnackbar('Replying to emails', 'loading');
                    const { routeIds, uiIds } = emails.reduce(
                        (acc, curr) => {
                            if (curr.RouteId) {
                                acc.routeIds.push(curr.RouteId);
                            }
                            if (curr.uiId) {
                                acc.uiIds.push(curr.uiId);
                            }
                        },
                        { routeIds: [], uiIds: [] }
                    );
                    await SDKClient.replyBulkEmailsInQueue({
                        body: this.quillInstance.root?.innerHTML || '',
                        // body: this.replyBody || '',
                        routeIdList: routeIds.join(',')
                    });
                    this.selectedMails = [];
                    if (uiIds.includes(this.emailSearchRes.data.selected.uiId)) {
                        this.emailSearchRes.data.selected = null;
                    }
                    this.doAdvancedSearch();
                    loader.dismiss();
                }
                // this.replyBody = '';
            });
        } catch (e) {
            console.error(e);
            if (loader) {
                loader.dismiss();
            }
            this.appUiService.showSnackbar('Unable to reply', 'failure');
        }
    }

    /**
     * Resets form
     */
    resetForm(): void {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

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
            hasAttachments: 'no',
            assignedTo: '',

            replied: 'any',

            closed: 'any',

            assigned: 'any',

            sesisonid: '',
            global: '',
            listOfMailboxes: 'singteldemo@tetherfi.com'
        });
    }

    /**
     * Uelifies the subject
     * @param subject
     * @returns
     */
    urlify(subject: string): string {
        if (subject) {
            return `${urlify(subject)} `;
        }
        return 'NA';
    }

    /**
     * Selects Emailtemplate
     */
    selectEmailTemplate(template: EmailTemplate): void {
        this.quillInstance.clipboard.dangerouslyPasteHTML(template.BodyHTML);
    }
}

// for more info visit - https://angular.io/api/core
