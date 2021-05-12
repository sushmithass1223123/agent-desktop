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
import { IGetInteractionHistory, InteractionAction, InteractionHistory, InteractionHistoryReadyEvent, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { ChatTranscripts, IWidget, ResData } from 'app/interfaces';
import { sortBy } from 'lodash';
import * as moment from 'moment';
import { from, Observable, of } from 'rxjs';
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
    @Input() data: IWidget;

    /**
     * Fuse confi
     */
    // fuseConfig: FuseConfig;

    /**
     * common fuse background
     */
    // customFuse: { content: string; body: string };
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

    showAttachments = false;
    smallEmailDescription = true;
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
                columns: ['InteractionDate', 'Channel', 'Intent', 'AgentName', 'CIF', 'NRIC', 'PhoneNumber', 'OverallSentiment', 'Actions'],
                selection: new SelectionModel<InteractionHistory>(false, []),
                source: new MatTableDataSource([])
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

        // subscribe to fuse
        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
        //     // config = config;
        //     this.customFuse = {
        //         content:
        //             config.layout.anchorWidget.customBackgroundColor === true && this.data.Config.Anchor
        //                 ? config.layout.anchorWidget.contentBackground
        //                 : config.layout.widget.customBackgroundColor === true
        //                     ? config.layout.widget.contentBackground
        //                     : '',
        //         body:
        //             config.layout.anchorWidget.customBackgroundColor === true && this.data.Config.Anchor
        //                 ? config.layout.anchorWidget.bodyBackground
        //                 : config.layout.widget.customBackgroundColor === true
        //                     ? config.layout.widget.bodyBackground
        //                     : ''
        //     };
        // });

        this.historyParams = {
            cif: '',
            email: '',
            nric: '',
            phone: '',
            noOfRecords: this.data.Data.NoOfRecords,
            lastId: '0'
        };

        this._tmacEventService
            .getInteractionEvents(['InteractionHistoryReadyEvent'], this.interactionId)
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
     * Handler for InteractionHistoryReadyEvent
     */
    InteractionHistoryReadyEvent = (evt: InteractionHistoryReadyEvent): void => {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }
        const noOfRecords = this.customerJourneyTable.tableData.source.paginator?.pageSize.toString() || this.data.Data.NoOfRecords;
        // assign the history params
        this.historyParams = {
            cif: evt.HistoryParameters.CIF,
            email: evt.HistoryParameters.EmailID,
            nric: evt.HistoryParameters.NRIC,
            phone: evt.HistoryParameters.PhoneNumber,
            noOfRecords,
            lastId: '0'
        };
        // get history
        this.getInteractionHistory();
    };

    /**
     * Gets interaction history and sets to table
     */
    private getInteractionHistory(lastId?: string): void {
        // // Interaction History Dummy data
        // SDKClient.getInteractionHistory(
        //     lastId ? { ...this.historyParams, lastId, phone: '96975347' } : { ...this.historyParams, phone: '96975347' },
        //     null
        // )
        this.customerJourneyTable.loading = true;
        SDKClient.getInteractionHistory(lastId ? { ...this.historyParams, lastId } : this.historyParams, null)
            .then((res) => {
                const tableData = {};
                let transcripts: Record<string, ChatTranscripts[]> = {};
                let sortedTabledata = [];
                if (lastId) {
                    sortedTabledata = sortBy([...this.customerJourneyTable.tableData.source.data, ...res.response], 'ItemID');
                } else {
                    sortedTabledata = [...sortBy(res.response, 'ItemID').reverse()];
                }
                sortedTabledata.forEach((data) => {
                    if (!tableData[data.SessionID]) {
                        tableData[data.SessionID] = {
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
                            ID: data.ID
                        };
                        // tableData[data.SessionID] = data;
                        transcripts[data.SessionID] = [];
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
                    transcripts[data.SessionID].push({
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
                // this.interactionTranscripts = JSON.stringify(transcripts);
                this.interactionTranscripts = transcripts;
                this.customerJourneyTable.tableData.source.data = Object.values(tableData);
                this.customerJourneyTable.lastId = res.response[0]?.LastID?.toString();
                this.customerJourneyTable.loading = false;
            })
            .catch((err) => {
                console.error(err);
                this.customerJourneyTable.loading = false;
            });
    }

    /**
     * Sets iframe for selected session
     */
    public setIframe(row: InteractionHistory): void {
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
    public pageEvent(): void {
        if (!this.customerJourneyTable.tableData.source.paginator?.hasNextPage()) {
            this.getInteractionHistory(this.customerJourneyTable.tableData.source.data[0].LastID.toString());
        }
    }

    /**
     * Get actions of selected sessionId
     * @param {String} sessionId selected Session Id
     */
    public async getSessionActions(sessionId: string): Promise<void> {
        try {
            this.sessionActions = { loading: true, error: false };
            const res = await SDKClient.getInteractionActions(sessionId);
            this.sessionActions = {
                loading: false,
                error: false,
                data: res.response.map((x) => ({ ...x, ActionTime: new Date(parseInt(x.ActionTime.toString().split('(')[1].split(')')[0], 10)) }))
            };
        } catch (e) {
            this.sessionActions = { loading: false, error: true, msg: COMMON_ERR_MESSAGE };
            console.error(e);
        }
    }

    /**
     * To open sentiment dashboard for a session
     *
     * @param sessionId
     */
    public openSentimentDashboard(sessionId: string): void {
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
    public onMaximized(max: boolean): void {
        this.maximized = max;
        this.maximizeEvent.emit(max);
    }

    /**
     * Fetches interaction data and assings to this.interactionNotesReq.data
     * @param {InteractionHistory} record
     */
    public async showInteractionData(record: InteractionHistory): Promise<void> {
        this.interactionNotesReq.loading = true;
        this.interactionNotesReq.data = from(
            SDKClient.getInteractionData({
                count: 10,
                fromDate: '',
                interactionId: '',
                sessionId: record.SessionID,
                toDate: '',
                agentId: record.AgentID
            })
        ).pipe(
            map((res) => res.response.filter((ih) => ih.AgentComment).map((ihF) => ihF.AgentComment)),
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
    public async showEmailThread(interaction?: InteractionHistory): Promise<void> {
        if (!interaction) {
            interaction = this.customerJourneyTable.tableData.selection.selected[0];
        }
        // const fetchFromOutbox = [...OUTBOX_REASONS, ...DRAFT_REASONS].includes(interaction.);
        // const requestedSession = fetchFromOutbox ? interaction.OutSessionID : interaction.SessionId;
        this.emailThreadReq.loading = true;
        const fetchFromOutbox = interaction.Direction === 'Out';
        const onSuccess = (res) => {
            if (res.response.Body) {
                res.response.Body = res.response.Body.replaceAll('<a', '<a target="_blank"');
            }
            this.emailThreadReq.data = res.response;
            this.emailThreadReq.loading = false;
            this.emailThreadReq.error = false;
        };
        const onFailure = (err) => {
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
    public switchMaximizedViewMode(mode: Mode, row: InteractionHistory): void {
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
    public closeActionWindow(): void {
        this.mode = null;
        this.customerJourneyTable.tableData.selection.clear();
        // this.interactionTranscripts = JSON.stringify(this.interactionTranscripts);
    }

    /**
     * Opens advanced search form inside a modal window
     */
    openAdvancedSearchModal(): void {}

    /**
     * Is row selected
     * @param row
     * @returns
     */
    isRowSelected(row: any): boolean {
        const selected = this.customerJourneyTable.tableData.selection.isSelected(row);
        return selected;
    }
}
