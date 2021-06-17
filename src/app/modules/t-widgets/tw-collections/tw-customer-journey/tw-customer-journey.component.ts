import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    IGetInteractionHistory,
    InteractionAction,
    InteractionHistory,
    InteractionHistoryEvent,
    InteractionHistoryOnDemandEvent,
    InteractionHistoryReadyEvent,
    InteractionHistoryReLoadEvent,
    SDKClient
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ChatTranscripts, IWidget, ResData } from 'app/interfaces';
import { maticonByExtension } from 'app/utils';
import { format, parse } from 'date-fns';
import { groupBy, orderBy, sortBy } from 'lodash';
import * as moment from 'moment';
import { from, Observable, of, Subscription } from 'rxjs';
import { catchError, filter, map, share, takeUntil, tap } from 'rxjs/operators';

type Mode = 'Session History' | 'Comments' | 'Actions' | 'Transcripts' | 'Email Preview' | null;

/**
 * Customer journey component
 * Shows up during interactions
 * timeline when minimized and Table when maximised
 */
@Component({
    selector: 'tw-customer-journey',
    templateUrl: './tw-customer-journey.component.html',
    styleUrls: ['./tw-customer-journey.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerJourneyComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Input data from app config json
     */
    @Input() data: IWidget<any, WidgetData>;

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * available modes for maximised views
     */
    mode: Mode = null;

    /**
     * Search for record in table
     */
    searchForm = new FormGroup({
        SessionID: new FormControl(''),
        PhoneNumber: new FormControl(''),
        Channel: new FormControl(''),
        InteractionDateStart: new FormControl(),
        InteractionDateEnd: new FormControl(),
        CIF: new FormControl(''),
        NRIC: new FormControl(''),
        OverallSentiment: new FormControl(''),
        Agent: new FormControl(''),
        Intent: new FormControl('')
    });

    /**
     * Interaction notes ref
     */
    interactionNotesReq: ResData<Observable<string[]>> = {
        error: false,
        loading: false,
        data: from([])
    };

    /**
     * Interaction notes ref
     */
    emailThreadReq: ResData<Observable<string[]>> = {
        error: false,
        loading: false,
        data: null
    };

    /**
     * Interaction transcripts
     */
    interactionTranscripts = {};

    /**
     * Default customer name
     */
    defaultCustomerName = 'Customer';

    /**
     * File upload urls
     */
    fileUploadUrl$ = this._appDataService.config.pipe(
        takeUntil(this.unsubscribeAll),
        map((conf: any) => {
            return conf.Main.Urls?.FileServerUrl?.MediaProxy;
        })
    );

    /**
     * Show advanced search form
     */
    showAdvancedSearchOverlay = false;

    /**
     * session actions timeline
     */
    sessionActions: ResData<InteractionAction[]> = {
        error: false,
        loading: false
    };

    /**
     * Paginator ref
     */
    @ViewChild(MatPaginator) set paginatorContent(content: MatPaginator) {
        if (content) {
            // initially setter gets called with undefined
            this.customerJourneyTable.tableData.source.paginator = content;
        }
    }

    /**
     * Sorting Ref
     */
    @ViewChild(MatSort) set sortContent(content: MatSort) {
        if (content) {
            // initially setter gets called with undefined
            this.customerJourneyTable.tableData.source.sort = content;
        }
    }

    /**
     * Wrapper component Ref
     */
    @ViewChild(TwWrapperComponent) wrapperComponent: TwWrapperComponent;

    /**
     * Current interaction Id
     */
    interactionId: number;

    /**
     * History params to fetch data
     */
    historyParams: IGetInteractionHistory;

    /**
     * Widget maximzed event
     */
    @Output() maximizeEvent = new EventEmitter();

    /**
     * Widget float event
     */
    @Output() floatEvent = new EventEmitter();

    /**
     * Widget collapsed event
     */
    @Output() collapseEvent = new EventEmitter();

    /**
     * Maximized flag
     */
    maximized: boolean;

    /**
     * Customer journey table Info
     */
    customerJourneyTable: {
        /**
         * Loading flag
         */
        loading: boolean;
        /**
         * Last record id for pagination
         */
        lastId: string;
        /**
         * Iframe url
         */
        iframeUrl: SafeResourceUrl;
        /**
         * Table data
         */
        tableData: {
            /**
             * Table source
             */
            source: MatTableDataSource<InteractionHistory>;
            /**
             * Table columns
             */
            columns: string[];
            /**
             * Table selection
             */
            selection: SelectionModel<InteractionHistory>;
            /**
             * Size of the pages in table
             */
            pageSizes: number[];
            /**
             * Flag to enable sort
             */
            sortDisabled: boolean;
        };
    };

    /**
     * Interaction data columns
     */
    interactionDateCols = ['InteractionDateStart', 'InteractionDateEnd'];

    /**
     * Ng-template ref for advanced search form
     */
    @ViewChild('advancedSearchFormRef') set advancedSearchRef(content: any) {
        this.advancedSearchModal.ref = content;
    }

    /**
     * Advanced search modal Ui related configs
     */
    advancedSearchModal = {
        ref: null,
        open: () => {
            if (this.advancedSearchModal.ref) {
                this.advancedSearchModal.openedRef = this.matDialog.open(this.advancedSearchModal.ref, {
                    width: '50%',
                    panelClass: 'customer-journey-advanced-form'
                });
            }
        },
        openedRef: null,
        close: () => {
            this.advancedSearchModal.openedRef?.close();
        }
    };

    /**
     * To show attachments in email
     */
    showAttachments = false;

    /**
     * Small email description falg
     */
    smallEmailDescription = true;

    /**
     * This is the input for how the table records should be grouped
     */
    groupCtrl = new FormControl('');

    /**
     * Reduced records
     */
    reducedRecords: Record<string, InteractionHistory[]> = {};

    /**
     *
     * @param _fuseFacadeService
     * @param _tmacEventService
     * @param sanitizer
     * @param _appUIService
     * @param _appDataService
     * @param matDialog
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private _tmacEventService: TMACEventService,
        private sanitizer: DomSanitizer,
        private _appUIService: AppUiService,
        private _appDataService: AppDataService,
        private matDialog: MatDialog
    ) {
        super();
        this.customerJourneyTable = {
            loading: false,
            iframeUrl: '',
            lastId: '',
            tableData: {
                columns: [
                    'InteractionDate',
                    'Channel',
                    'InteractionText',
                    'Direction',
                    'Intent',
                    'AgentName',
                    'CIF',
                    'NRIC',
                    'PhoneNumber',
                    'OverallSentiment',
                    'Actions'
                ],
                selection: new SelectionModel<InteractionHistory>(false, []),
                source: new MatTableDataSource([]),
                pageSizes: [],
                sortDisabled: false
            }
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        const noOfRecords = this.data.Data.NoOfRecords;

        if (this.data.Data.Columns && this.data.Data.Columns.length) {
            this.customerJourneyTable.tableData.columns = this.data.Data.Columns;
        }
        this.customerJourneyTable.tableData.pageSizes = [0, 5, 10].map((r) => r + noOfRecords);

        this.historyParams = {
            cif: '',
            email: '',
            nric: '',
            phone: '',
            noOfRecords: this.data.Data.NoOfRecords.toString(),
            lastId: '0'
        };

        this._tmacEventService
            .getInteractionEvents(
                ['InteractionHistoryReadyEvent', 'InteractionHistoryEvent', 'InteractionHistoryOnDemandEvent', 'InteractionHistoryReLoadEvent'],
                this.interactionId
            )
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        this.customerJourneyTable.tableData.source.filterPredicate = this.createFilter();
    }

    /**
     * Adds filter to material table
     */
    doAdvancedSearch(): void {
        const res = this.searchForm.value;
        const searchKey = {};
        Object.keys(res).forEach((k) => {
            if (res[k]) {
                if (this.interactionDateCols.includes(k)) {
                    searchKey[k] = new Date(res[k].toString()).getTime();
                } else {
                    searchKey[k] = res[k].trim().toLowerCase();
                }
            }
        });
        const stringifiedSearch = JSON.stringify(searchKey);
        this.customerJourneyTable.tableData.source.filter = stringifiedSearch === '{}' ? '' : stringifiedSearch;
    }

    /**
     * Custom filter method fot Angular Material Datatable
     */
    createFilter(): (data: any, filter: string) => boolean {
        const filterFunction = (data: any, ftr: string): boolean => {
            const searchTerms = JSON.parse(ftr);
            let isFilterSet = false;
            let filtersApplied = 0;
            let filtersMatched = 0;
            for (const col in searchTerms) {
                if (searchTerms[col].toString() !== '') {
                    isFilterSet = true;
                } else {
                    delete searchTerms[col];
                }
            }

            filtersApplied = Object.keys(searchTerms).length;

            const nameSearch = () => {
                // let found = false;
                if (isFilterSet) {
                    Object.keys(searchTerms).map((col) => {
                        // for (const col in searchTerms) {
                        if (this.interactionDateCols.includes(col)) {
                            const start = searchTerms['InteractionDateStart'];
                            const endDate = new Date(parseInt(searchTerms['InteractionDateEnd'], 10));
                            endDate.setHours(24);
                            const end = endDate.getTime();
                            const actualDate = moment(data['InteractionDate'], 'DD/MM/yyyy HH:mm:ss').valueOf();
                            if (start && !end) {
                                if (actualDate >= start) {
                                    // found = true;
                                    filtersMatched += 1;
                                }
                            } else if (!start && end) {
                                if (actualDate <= end) {
                                    // found = true;
                                    filtersMatched += 1;
                                }
                            } else if (start && end) {
                                if (actualDate >= start && actualDate <= end) {
                                    // found = true;
                                    filtersMatched += 1;
                                }
                            }
                        } else {
                            if (data[col] && data[col].toLowerCase().indexOf(searchTerms[col]) !== -1 && isFilterSet) {
                                // found = true;
                                filtersMatched += 1;
                            }
                        }
                    });
                    return filtersMatched === filtersApplied;
                } else {
                    return true;
                }
            };
            return nameSearch();
        };
        return filterFunction;
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Gets interaction history and sets to table
     */
    private getInteractionHistory(
        noOfRecords = (this.customerJourneyTable.tableData.source.paginator?.pageSize || parseInt(this.historyParams.noOfRecords, 10)).toString()
    ): void {
        // // Interaction History Dummy data
        // SDKClient.getInteractionHistory(
        //     lastId ? { ...this.historyParams, lastId, phone: '96975347' } : { ...this.historyParams, phone: '96975347' },
        //     null
        // )
        const lastId = this.customerJourneyTable.lastId;
        if (!lastId) {
            this.customerJourneyTable.loading = true;
        }
        SDKClient.getInteractionHistory(lastId ? { ...this.historyParams, lastId, noOfRecords } : { ...this.historyParams, noOfRecords }, null)
            .then((res) => {
                if (!res.response) {
                    throw new Error('Invalid response from server');
                }
                if (res.response.length) {
                    this.processHistoryData(res.response, true);
                }
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                this.customerJourneyTable.loading = false;
            });
    }

    /**
     * To process history data
     *
     * @param {InteractionHistory[]} historyData
     * @param {Boolean} update
     */
    processHistoryData(historyData: InteractionHistory[], update?: boolean): void {
        const tableData = {};
        let transcripts: Record<string, ChatTranscripts[]> = {};
        let sortedTabledata = [];
        if (update) {
            sortedTabledata = sortBy(this.customerJourneyTable.tableData.source.data.concat(historyData), 'ItemID').reverse();
        } else {
            sortedTabledata = sortBy(historyData, 'ItemID').reverse();
        }
        sortedTabledata.forEach((data) => {
            if (!(data.InteractionDate instanceof Date)) {
                data.InteractionDate = parse(data.InteractionDate, 'dd/M/yyyy HH:mm:ss', new Date());
            }
            if (!tableData[data.GroupID]) {
                tableData[data.GroupID] = {
                    InteractionDate: data.InteractionDate,
                    Channel: data.Channel,
                    Intent: data.Intent,
                    AgentName: data.AgentName,
                    CIF: data.CIF,
                    NRIC: data.NRIC,
                    PhoneNumber: data.PhoneNumber,
                    OverallSentiment: data.OverallSentiment,
                    ItemID: data.ItemID,
                    SubType: data.SubType,
                    SessionID: data.SessionID,
                    Direction: data.Direction,
                    ID: data.ID,
                    GroupID: data.GroupID,
                    LastID: data.LastID,
                    Children: [],
                    expanded: false
                };
                transcripts[data.GroupID] = [];
            } else {
                const Children = tableData[data.GroupID].Children;
                Children.push({ ...tableData[data.GroupID], Children: null });
                tableData[data.GroupID] = {
                    InteractionDate: data.InteractionDate,
                    Channel: data.Channel,
                    Intent: data.Intent,
                    AgentName: data.AgentName,
                    CIF: data.CIF,
                    NRIC: data.NRIC,
                    PhoneNumber: data.PhoneNumber,
                    OverallSentiment: data.OverallSentiment,
                    ItemID: data.ItemID,
                    SubType: data.SubType,
                    SessionID: data.SessionID,
                    Direction: data.Direction,
                    ID: data.ID,
                    GroupID: data.GroupID,
                    LastID: data.LastID,
                    Children
                };
            }
            let message: any;
            try {
                message = JSON.parse(data.InteractionText);
            } catch (e) {
                message = {
                    type: 'text',
                    message: data.InteractionText
                };
            }
            transcripts[data.GroupID].push({
                who: data.Direction === 'Out' ? data.AgentName : this.defaultCustomerName,
                isAgent: data.Direction === 'Out',
                message,
                time: data.InteractionDate,
                type: data.SubType,
                messageId: data.ItemID
            });
        });
        transcripts = Object.entries(transcripts).reduce((acc, curr) => {
            const [key, val] = curr;
            acc[key] = sortBy(val, 'messageId');
            return acc;
        }, {});
        // assign the transcripts
        this.interactionTranscripts = transcripts;
        // order table data by received date
        if (!this.customerJourneyTable.tableData.source.data) {
            this.customerJourneyTable.tableData.source.data = [];
        }
        const newRecords = orderBy(Object.values(tableData), ['InteractionDate'], ['desc']) as InteractionHistory[];
        this.customerJourneyTable.tableData.source.data = newRecords;
        const lastEl = sortedTabledata.slice(-1) || [];
        this.customerJourneyTable.lastId = lastEl[0]?.LastID?.toString();
        this.customerJourneyTable.loading = false;
        const pageOffset = newRecords.length % parseInt(this.historyParams.noOfRecords, 10);
        const recordsIncompleteInFirstPage =
            newRecords.length < this.customerJourneyTable.tableData.source.paginator?.pageSize
                ? parseInt(this.historyParams.noOfRecords, 10) - pageOffset
                : 0;
        if (recordsIncompleteInFirstPage) {
            this.getInteractionHistory((recordsIncompleteInFirstPage + 1).toString());
        } else if (pageOffset === 0) {
            this.getInteractionHistory('1');
        }
        console.log(newRecords.filter((x: any) => x.Children));
    }

    /**
     * Handler for InteractionHistoryReadyEvent
     */
    InteractionHistoryReadyEvent(evt: InteractionHistoryReadyEvent): void {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }
        const noOfRecords = this.data.Data.NoOfRecords;
        // assign the history params
        this.historyParams = {
            cif: evt.HistoryParameters.CIF,
            email: evt.HistoryParameters.EmailID,
            nric: evt.HistoryParameters.NRIC,
            phone: evt.HistoryParameters.PhoneNumber,
            noOfRecords: noOfRecords.toString(),
            lastId: '0'
        };
        // get history
        this.getInteractionHistory();
    }

    /**
     * To process InteractionHistoryEvent
     *
     * @param {InteractionHistoryEvent} evt
     */
    InteractionHistoryEvent(evt: InteractionHistoryEvent): void {
        this.processHistoryData(evt.History, false);
    }

    /**
     * To process InteractionHistoryOnDemandEvent
     *
     * @param {InteractionHistoryOnDemandEvent} evt
     */
    InteractionHistoryOnDemandEvent(evt: InteractionHistoryOnDemandEvent): void {}

    /**
     * To process InteractionHistoryReLoadEvent
     *
     * @param {InteractionHistoryReLoadEvent} evt
     */
    InteractionHistoryReLoadEvent(evt: InteractionHistoryReLoadEvent): void {
        this.processHistoryData(evt.History, false);
    }

    /**
     * Sets iframe for selected session
     */
    setIframe(row: InteractionHistory): void {
        if (!this.maximized) {
            this.maximized = true;
            this.wrapperComponent.maximize();
        }
        this.customerJourneyTable.tableData.selection.toggle(row);
        this.customerJourneyTable.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.data.Data.IframeBaseUrl}${row.SessionID}`);
    }

    /**
     * Material table pagination event
     */
    pageEvent(_evt: any): void {
        if (!this.customerJourneyTable.tableData.source.paginator.hasNextPage()) {
            this.getInteractionHistory();
        }
    }

    /**
     * Get actions of selected sessionId
     * @param {String} sessionId selected Session Id
     */
    async getSessionActions(sessionId: string): Promise<void> {
        try {
            this.sessionActions = { loading: true, error: false };
            const res = await SDKClient.getInteractionActions(sessionId);
            this.sessionActions = {
                loading: false,
                error: false,
                data: res.response.map((x) => ({ ...x, ActionTime: new Date(parseInt(x.ActionTime.toString().split('(')[1].split(')')[0], 10)) }))
            };
        } catch (e) {
            this.sessionActions = { loading: false, error: true, msg: 'Unable to fetch session actions' };
            console.error(e);
        }
    }

    /**
     * To open sentiment dashboard for a session
     *
     * @param sessionId
     */
    openSentimentDashboard(sessionId: string): void {
        let url = this.data.Data.SentimentDashboardUrl;

        // verify the url
        if (!url) {
            this._appUIService.showSnackbar('Sentiment Dashboard Url is not configured!', 'failure');
            return;
        }

        url += `?/sessionid=${sessionId}&agentid=${SDKClient.getAgentData().agentId}`;

        window.open(
            url,
            'sentimentDashboard',
            `menubar=no,resizable=yes,location=no,scrollbars=no,
            width=${screen.width},
            height=${screen.height}`
        );
    }

    /**
     * On widget maximized
     */
    onMaximized(max: boolean): void {
        this.maximized = max;
        this.maximizeEvent.emit(max);
        let groupingSub$: Subscription;
        if (max) {
            groupingSub$ = this.initGroupingService();
            setTimeout(() => {
                this.customerJourneyTable.tableData.source.sort.sort({ id: 'InteractionDate', start: 'desc', disableClear: true });
            }, 0);
        } else if (groupingSub$) {
            groupingSub$.unsubscribe();
        }
    }

    /**
     * Fetches interaction data and assings to this.interactionNotesReq.data
     * @param {InteractionHistory} record
     */
    async showInteractionData(record: InteractionHistory): Promise<void> {
        this.interactionNotesReq.loading = true;
        this.interactionNotesReq.data = from(
            SDKClient.getInteractionData({
                count: 10,
                fromDate: '',
                interactionId: '',
                sessionId: record.SessionID,
                toDate: '',
                agentId: ''
            })
        ).pipe(
            map((res) =>
                res.response
                    .filter((ih) => ih.AgentComment)
                    .map((ihF) => {
                        let message = `
                        <div class='twd-whitespace-pre-line'>
                        ${ihF.AgentComment}
                        </div>
                        `;
                        try {
                            const jsonMessage = JSON.parse(ihF.AgentComment);
                            message = '';
                            jsonMessage.forEach((item: any, index: number, array: []) => {
                                message += `
                             <div class="text-primary mat-body-2">${item.Comment.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                             <span class="time muted-text mat-body-1">${item.User}</span>,
                             <span class="time muted-text mat-body-1">${format(new Date(item.Time), 'dd/MM/yyyy hh:mm:ss a')}</span>
                             `;
                                // add space if there are multiple items
                                if (index > array.length - 1) {
                                    message += `
                                    <br />
                                    <br />
                                    `;
                                }
                            });
                        } catch (error) {}
                        return message;
                    })
            ),
            tap(() => (this.interactionNotesReq.loading = false)),
            catchError((err) => {
                console.error(err);
                this.interactionNotesReq.error = true;
                return of([]);
            }),
            share()
        );
    }

    /**
     * Shows email thread for the session
     * @param record
     */
    async showEmailThread(interaction?: InteractionHistory): Promise<void> {
        if (!interaction) {
            interaction = this.customerJourneyTable.tableData.selection.selected[0];
        }

        this.emailThreadReq.error = false;
        this.emailThreadReq.data = null;
        this.emailThreadReq.loading = true;

        const fetchFromOutbox = interaction.Direction === 'Out';

        const onSuccess = (res: any) => {
            if (!res.response) {
                this._appUIService.showSnackbar('Unable to fetch email', 'failure');
                return;
            }
            // check if attachements are there
            if (res.response.Attachments && res.response.Attachments.length) {
                res.response.Attachments.forEach((item: any) => {
                    // get the file name from URL
                    let name = item.URL.split('/').pop();
                    name = name.replace(item.SessionID, '');
                    item.Name = name;
                    item.Ext = name.split('.').pop();
                    item.Icon = maticonByExtension(item.Ext);
                });
            }

            if (res.response.Body) {
                res.response.Body = this._appUIService.sanitizeEmailBody(res.response.Body);
            }

            this.emailThreadReq.data = res.response;
            this.emailThreadReq.loading = false;
            this.emailThreadReq.error = false;
        };

        const onFailure = (err: any) => {
            console.error(err);
            this.emailThreadReq.loading = false;
            this.emailThreadReq.error = true;
            this.emailThreadReq.data = err;
        };

        if (fetchFromOutbox) {
            SDKClient.getOutboxEmail(interaction.SessionID)
                .then((res) => onSuccess(res))
                .catch((err) => onFailure(err));
        } else {
            SDKClient.getInboxEmail(interaction.SessionID)
                .then((res) => onSuccess(res))
                .catch((err) => onFailure(err));
        }
    }

    /**
     * Switches Maximized View
     * @param {Mode} mode
     */
    switchMaximizedViewMode(mode: Mode, row: InteractionHistory): void {
        this.mode = mode;
        if (!this.maximized) {
            this.maximized = true;
            this.wrapperComponent.maximize();
        }
        if (this.customerJourneyTable.tableData.selection?.selected[0]?.ID !== row.ID) {
            setTimeout(() => {
                this.customerJourneyTable.tableData.selection.toggle(row);
            }, 0);
        }
        switch (mode) {
            case 'Session History': {
                this.customerJourneyTable.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                    `${this.data.Data.IframeBaseUrl}${row.SessionID}`
                );
                break;
            }
            case 'Actions': {
                this.getSessionActions(row.SessionID);
                break;
            }
            case 'Transcripts': {
                // if (typeof this.interactionTranscripts === 'string') {
                //     this.interactionTranscripts = JSON.parse(this.interactionTranscripts);
                // }
                break;
            }
            case 'Comments': {
                this.showInteractionData(row);
                break;
            }
            case 'Email Preview': {
                this.showEmailThread(row);
                break;
            }
        }
    }

    /**
     * Closes the bottom action window
     */
    closeActionWindow(): void {
        this.mode = null;
        this.customerJourneyTable.tableData.selection.clear();
        // this.interactionTranscripts = JSON.stringify(this.interactionTranscripts);
    }

    /**
     * Is row selected
     * @param row
     * @returns
     */
    isRowSelected(row: any): boolean {
        const selected = this.customerJourneyTable.tableData.selection.isSelected(row);
        return selected;
    }

    /**
     * Opens a selected attachment file
     * @param {String} fileUrl
     */
    openFile(fileUrl: string): void {
        window.open(fileUrl);
    }

    /**
     * This method returns a boolean value for when directive in group header row
     */
    isGroup = (idx: any): boolean => {
        const record = this.customerJourneyTable.tableData.source.data[idx];
        if (record) {
            return (record as any).isGroup;
        }
        return false;
    };

    /**
     * This method groups the material table records
     */
    initGroupingService(): Subscription {
        return this.groupCtrl.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((val) => {
            const data = this.customerJourneyTable.tableData.source.data.filter((x: any) => !x.isGroup);
            if (val) {
                this.customerJourneyTable.tableData.source.sort.sort({ id: null, start: 'desc', disableClear: true });
                this.customerJourneyTable.tableData.sortDisabled = true;
                const groupedRecords = groupBy(data, val);
                this.customerJourneyTable.tableData.source.data = Object.entries(groupedRecords).reduce((acc, curr) => {
                    const [key, records] = curr;
                    acc.push(
                        {
                            isGroup: true,
                            groupName: `${val} : ${key}`,
                            expanded: true,
                            value: key
                        },
                        ...records
                    );
                    return acc;
                }, []);
            } else {
                this.customerJourneyTable.tableData.sortDisabled = false;
                this.processHistoryData(data);
                this.customerJourneyTable.tableData.source.sort.sort({ id: 'InteractionDate', start: 'desc', disableClear: true });
            }
        });
    }

    /**
     * Toggles grouped node
     * @param {any} row
     * @param {number} idx
     */
    toggleGroupExpand(row: any, idx: number): void {
        const record: any = this.customerJourneyTable.tableData.source.data[idx];
        if (row.expanded) {
            const { reduced, newRecords } = this.customerJourneyTable.tableData.source.data.reduce(
                (acc, curr) => {
                    if (row.groupName === (curr as any).groupName) {
                        acc.newRecords.push({ ...curr, expanded: false });
                    } else {
                        if (curr[this.groupCtrl.value] === row.value) {
                            acc.reduced.push(curr);
                        } else {
                            acc.newRecords.push(curr);
                        }
                    }
                    return acc;
                },
                { reduced: [], newRecords: [] }
            );
            this.customerJourneyTable.tableData.source.data = newRecords;
            this.reducedRecords[row.groupName] = reduced;
        } else {
            const data = this.customerJourneyTable.tableData.source.data;
            data.splice(idx, 1, { ...record, expanded: true }, ...this.reducedRecords[row.groupName]);
            this.customerJourneyTable.tableData.source.data = data;
            this.reducedRecords[row.groupName] = [];
        }
    }
}

interface WidgetData {
    /**
     * Customer session journey url
     */
    IframeBaseUrl: string;
    /**
     * No of records to load
     */
    NoOfRecords: number;
    /**
     * Sentiment dashboard url
     */
    SentimentDashboardUrl: string;
    /**
     * Columns to show
     */
    Columns: string[];
}
