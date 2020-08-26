import { SelectionModel } from '@angular/cdk/collections';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { HistoryInteraction } from 'app/models';
import { sortBy, uniqBy } from 'lodash';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-customer-journey',
    templateUrl: './tw-customer-journey.component.html',
    styleUrls: ['./tw-customer-journey.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerJourneyComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) set paginatorContent(content: MatPaginator) {
        if (content) {
            // initially setter gets called with undefined
            this.customerJourneyTable.tableData.source.paginator = content;
        }
    }

    @ViewChild(MatSort) set sortContent(content: MatSort) {
        if (content) {
            // initially setter gets called with undefined
            this.customerJourneyTable.tableData.source.sort = content;
        }
    }

    filterObj = {
        InteractionDate: {
            options: []
        },
        Channel: {
            options: []
        },
        CIF: {
            options: []
        },
        EmailId: {
            options: []
        },
        NRIC: {
            options: []
        },
        PhoneNumber: {
            options: []
        },
        SessionID: {
            options: []
        }
    };

    constructor(private sanitizer: DomSanitizer) {
        super();
        this.customerJourneyTable = {
            loading: true,
            iframeUrl: '',
            lastId: '',
            tableData: {
                columns: Object.keys(this.filterObj),
                selection: new SelectionModel<HistoryInteraction>(false, []),
                source: new MatTableDataSource([])
            }
        };
    }
    @Input() data: any;

    customerJourneyTable: {
        loading: boolean;
        lastId: string;
        iframeUrl: SafeResourceUrl;
        tableData: {
            source: MatTableDataSource<HistoryInteraction>;
            columns: string[];
            selection: SelectionModel<HistoryInteraction>;
        };
    };

    maximized = false;

    steps = Array(20)
        .fill(1)
        .map((x) => ({
            timestamp: Date.now(),
            name: `Chat with rahil`,
            type: 'chat'
        }));

    filterValues = {};

    getFilterObject(fullObj, key): any[] {
        const uniqChk = [];
        fullObj.filter((obj) => {
            if (!uniqChk.includes(obj[key])) {
                uniqChk.push(obj[key]);
            }
            return obj;
        });
        return uniqChk;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.customerJourneyTable.tableData.source.filterPredicate = this.createFilter();
        this.setupListeners();
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    maximizeEvent(state: boolean): void {
        this.maximized = state;
    }

    setupListeners(): void {
        this.setupInteractionHistory();
    }

    setupInteractionHistory(): void {
        this.getInteractionHistory();
        SDKClient.events.on('InteractionHistoryReadyEvent', (evt: HistoryInteraction[]) => {
            console.log('InteractionHistoryReadyEvent', { evt });
            this.getInteractionHistory();
        });
    }

    getInteractionHistory(lastId?: string): void {
        SDKClient.getInteractionHistory(
            {
                noOfRecords: this.customerJourneyTable.tableData.source.paginator?.pageSize.toString() || '20',
                cif: 'S1234567A',
                email: '',
                lastId: lastId || '0',
                nric: '',
                phone: ''
            },
            null
        )
            .then((res) => {
                let tableData = [];
                if (lastId) {
                    tableData = uniqBy([...this.customerJourneyTable.tableData.source.data, ...sortBy(res.response, 'ItemID')], 'SessionID');
                } else {
                    tableData = uniqBy([...sortBy(res.response, 'ItemID')], 'SessionID');
                }
                this.customerJourneyTable.tableData.source.data = tableData;
                this.customerJourneyTable.lastId = res.response[0]?.LastIndex;

                Object.keys(this.filterObj).filter((k) => {
                    const options = this.getFilterObject(tableData, k);
                    this.filterObj[k] = { options };
                });

                this.customerJourneyTable.loading = false;
            })
            .catch((err) => {
                console.log({ err });
                this.customerJourneyTable.loading = false;
            });
    }

    // Called on Filter change
    filterChange(column, event): void {
        console.log(event.target.value);
        this.filterValues[column] = event.target.value.trim().toLowerCase();
        this.customerJourneyTable.tableData.source.filter = JSON.stringify(this.filterValues);
    }

    // Custom filter method fot Angular Material Datatable
    createFilter(): any {
        let filterFunction = function (data: any, filter: string): boolean {
            let searchTerms = JSON.parse(filter);
            let isFilterSet = false;
            for (const col in searchTerms) {
                if (searchTerms[col].toString() !== '') {
                    isFilterSet = true;
                } else {
                    delete searchTerms[col];
                }
            }

            console.log(searchTerms);

            let nameSearch = () => {
                let found = false;
                if (isFilterSet) {
                    for (const col in searchTerms) {
                        searchTerms[col]
                            .trim()
                            .toLowerCase()
                            .split(' ')
                            .forEach((word) => {
                                if (data[col].toString().toLowerCase().indexOf(word) != -1 && isFilterSet) {
                                    found = true;
                                }
                            });
                    }
                    return found;
                } else {
                    return true;
                }
            };
            return nameSearch();
        };
        return filterFunction;
    }

    setIframe(row: HistoryInteraction): void {
        this.customerJourneyTable.tableData.selection.toggle(row);
        this.customerJourneyTable.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.data.Data.IframeBaseUrl}${row.SessionID}`);
    }

    pageEvent(): void {
        if (!this.customerJourneyTable.tableData.source.paginator?.hasNextPage()) {
            this.getInteractionHistory(this.customerJourneyTable.tableData.source.data[0].LastID.toString());
        }
    }
}
