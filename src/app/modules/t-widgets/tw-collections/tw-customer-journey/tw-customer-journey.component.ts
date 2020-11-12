import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ResData } from 'app/interfaces';
import { sortBy, uniqBy } from 'lodash';
import * as moment from 'moment';
import { takeUntil } from 'rxjs/operators';
import { IGetInteractionHistory, InteractionAction, InteractionHistory, InteractionHistoryReadyEvent, IUIEvent, SDKClient } from 'tmac-sdk';

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
    fuseConfig: FuseConfig;

    /**
     * Search for record in table
     */
    searchForm = new FormGroup({
        SessionID: new FormControl(''),
        InteractionDateStart: new FormControl(),
        InteractionDateEnd: new FormControl(),
        Channel: new FormControl(''),
        CIF: new FormControl(''),
        NRIC: new FormControl(''),
        PhoneNumber: new FormControl(''),
        OverallSentiment: new FormControl('')
    });

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
     * Fuse Perfect scrollbar ref
     */
    // @ViewChild(FusePerfectScrollbarDirective) fuseDirective: FusePerfectScrollbarDirective;

    /**
     * Current interaction Id
     */
    interactionId: number;
    historyParams: IGetInteractionHistory;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    /**
     * Customer journey table Info
     */
    customerJourneyTable: {
        loading: boolean;
        lastId: string;
        iframeUrl: SafeResourceUrl;
        tableData: {
            source: MatTableDataSource<InteractionHistory>;
            columns: string[];
            selection: SelectionModel<InteractionHistory>;
        };
    };
    maximized: boolean;
    interactionDateCols = ['InteractionDateStart', 'InteractionDateEnd'];

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _tmacEventService: TMACEventService,
        private sanitizer: DomSanitizer,
        private _appUIService: AppUiService
    ) {
        super();

        this.customerJourneyTable = {
            loading: true,
            iframeUrl: '',
            lastId: '',
            tableData: {
                columns: ['SessionID', 'InteractionDate', 'Channel', 'Intent', 'AgentName', 'CIF', 'NRIC', 'PhoneNumber', 'OverallSentiment', 'Actions'],
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
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        this.historyParams = {
            cif: '',
            email: '',
            nric: '',
            phone: '',
            noOfRecords: this.data.Data.NoOfRecords,
            lastId: '0'
        };

        // get the event from event bag to make sure no events are missed
        const eventBag = this._tmacEventService.interactionEvents(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        SDKClient.events.on('InteractionHistoryReadyEvent', this.InteractionHistoryReadyEvent);

        this.customerJourneyTable.tableData.source.filterPredicate = this.createFilter();
    }

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
        let filterFunction = (data: any, filter: string): boolean => {
            let searchTerms = JSON.parse(filter);
            let isFilterSet = false;
            for (const col in searchTerms) {
                if (searchTerms[col].toString() !== '') {
                    isFilterSet = true;
                } else {
                    delete searchTerms[col];
                }
            }

            let nameSearch = () => {
                let found = false;
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
                                    found = true;
                                }
                            } else if (!start && end) {
                                if (actualDate <= end) {
                                    found = true;
                                }
                            } else if (start && end) {
                                if (actualDate >= start && actualDate <= end) {
                                    found = true;
                                }
                            }
                        } else {
                            searchTerms[col]
                                .trim()
                                .toLowerCase()
                                .split(' ')
                                .forEach((word: any) => {
                                    if (data[col].toString().toLowerCase().indexOf(word) !== -1 && isFilterSet) {
                                        found = true;
                                    }
                                });
                            // }
                        }
                    });
                    return found;
                } else {
                    return true;
                }
            };
            return nameSearch();
        };
        return filterFunction;
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // de-register from TMAC event
        SDKClient.events.off('InteractionHistoryReadyEvent', this.InteractionHistoryReadyEvent);
    }

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

    private getInteractionHistory(lastId?: string): void {
        SDKClient.getInteractionHistory(lastId ? { ...this.historyParams, lastId } : this.historyParams, null)
            .then((res: any) => {
                let tableData = [];
                if (lastId) {
                    tableData = uniqBy(
                        sortBy([...this.customerJourneyTable.tableData.source.data, ...res.response], 'InteractionDate').reverse(),
                        'SessionID'
                    );
                } else {
                    tableData = uniqBy([...sortBy(res.response, 'InteractionDate').reverse()], 'SessionID');
                }
                this.customerJourneyTable.tableData.source.data = tableData;
                this.customerJourneyTable.lastId = res.response[0]?.LastIndex;
                this.customerJourneyTable.loading = false;
            })
            .catch((err: string) => {
                console.log({ err });
                this.customerJourneyTable.loading = false;
            });
    }

    public setIframe(row: InteractionHistory): void {
        if (!this.maximized) {
            this.maximized = true;
            this.wrapperComponent.maximize();
        }
        this.customerJourneyTable.tableData.selection.toggle(row);
        this.customerJourneyTable.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.data.Data.IframeBaseUrl}${row.SessionID}`);
    }

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
}
