import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { InteractionData, SDKClient } from 'tmac-sdk';

/**
 * Agent Interactions details Table widget
 */
@Component({
    selector: 'tw-ad-interaction-details',
    templateUrl: './tw-ad-interaction-details.component.html',
    styleUrls: ['./tw-ad-interaction-details.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAdInteractionDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Shows Advanced Seargc Overlay
     */
    showAdvancedSearchOverlay = false;

    /**
     * app config data
     */
    @Input() data: any;

    /**
     * Table sort ref
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    /**
     * Table Paginator ref
     */
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    /**
     * Maximized state
     */
    maximized = false;
    /**
     * Interaction List
     */
    interactionList: any[] = [];

    /**
     * Minimized displayed columns
     */
    mindisplayedColumns: string[] = ['Channel', 'Direction', 'User', 'CreatedTime'];

    /**
     * Maximized displayed columns
     */
    maxdisplayedColumns: string[] = ['Channel', 'SubChannel', 'Direction', 'User', 'Dnis', 'Intent', 'CreatedTime', 'ClosedTime', 'ActiveTime'];

    /**
     * Interaction Details table data
     */
    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: this.mindisplayedColumns
    };

    /**
     * Advanced search form
     */
    advancedSearchForm = new FormGroup({
        Channel: new FormControl(),
        SubChannel: new FormControl(),
        Direction: new FormControl(),
        User: new FormControl(),
        Dnis: new FormControl(),
        Intent: new FormControl(),
        CreatedTimeStart: new FormControl(),
        CreatedTimeEnd: new FormControl(),
        ClosedTimeStart: new FormControl(),
        ClosedTimeEnd: new FormControl()
    });

    constructor() {
        super();
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        const dateCols = ['CreatedTimeStart', 'CreatedTimeEnd', 'ClosedTimeStart', 'ClosedTimeEnd'];
        this.advancedSearchForm.valueChanges.subscribe((res) => {
            const searchKey = {};
            Object.keys(res).forEach((k) => {
                if (res[k]) {
                    if (dateCols.includes(k)) {
                        searchKey[k] = res[k].toString().trim().toLowerCase();
                    } else {
                        searchKey[k] = res[k].trim().toLowerCase();
                    }
                }
            });
            const stringifiedSearch = JSON.stringify(searchKey);
            this.interactionDetailsTable.source.filter = stringifiedSearch === '{}' ? '' : stringifiedSearch;
        });

        SDKClient.events.on('AgentInteractionDetailsEvent', this.AgentInteractionDetailsEvent);
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('AgentInteractionDetailsEvent', this.AgentInteractionDetailsEvent);
    }

    /**
     * Custom filter method fot Angular Material Datatable
     */
    createFilter(): (data: any, filter: string) => boolean {
        const filterFunction = (data: any, filter: string): boolean => {
            const searchTerms = JSON.parse(filter);
            let isFilterSet = false;
            for (const col in searchTerms) {
                if (searchTerms[col].toString() !== '') {
                    isFilterSet = true;
                } else {
                    delete searchTerms[col];
                }
            }


            let filtersApplied = Object.keys(searchTerms).length;
            let filtersMatched = 0;

            const createdDateCols = ['CreatedTimeStart', 'CreatedTimeEnd'];
            const closedDateCols = ['ClosedTimeStart', 'ClosedTimeEnd'];
            const nameSearch = () => {
                let found = false;
                if (isFilterSet) {
                    Object.keys(searchTerms).map((col) => {
                        if (createdDateCols.includes(col)) {
                            const start = new Date(searchTerms['CreatedTimeStart']).getTime();
                            const endDate = new Date(searchTerms['CreatedTimeEnd']);
                            endDate.setHours(24);
                            const end = endDate.getTime();
                            const actualDate = new Date(data['CreatedDateTime']).getTime();

                            if (start && !end) {
                                if (actualDate >= start) {
                                    found = true;
                                    filtersMatched += 1;
                                }
                            } else if (!start && end) {
                                if (actualDate <= end) {
                                    found = true;
                                    filtersMatched += 1;
                                }
                            } else if (start && end) {
                                if (actualDate >= start && actualDate <= end) {
                                    found = true;
                                    filtersMatched += 1;
                                }
                            }
                        } else if (closedDateCols.includes(col)) {
                            const start = new Date(searchTerms['ClosedTimeStart']).getTime();
                            const endDate = new Date(searchTerms['ClosedTimeEnd']);
                            endDate.setHours(24);
                            const end = endDate.getTime();
                            const actualDate = new Date(data['ClosedDateTime']).getTime();
                            if (start && !end) {
                                if (actualDate >= start) {
                                    found = true;
                                    filtersMatched += 1;
                                }
                            } else if (!start && end) {
                                if (actualDate <= end) {
                                    found = true;
                                    filtersMatched += 1;
                                }
                            } else if (start && end) {
                                if (actualDate >= start && actualDate <= end) {
                                    found = true;
                                    filtersMatched += 1;
                                }
                            }
                        } else {
                            if (data[col] && data[col].toLowerCase().indexOf(searchTerms[col]) !== -1 && isFilterSet) {
                                found = true;
                                filtersMatched += 1;
                            }
                            // searchTerms[col]
                            //     .trim()
                            //     .toLowerCase()
                            //     .split(' ')
                            //     .forEach((word: any) => {
                            //         if (data[col]?.toString().toLowerCase().indexOf(word) !== -1) {
                            //             found = true;
                            //         }
                            //     });
                        }
                        // }
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
     * AgentInteractionDetailsEvent hanlder
     * @param {InteractionData} data
     */
    private AgentInteractionDetailsEvent = (data: InteractionData[]) => {
        this.interactionList = [...this.interactionList, ...data];

        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
        this.interactionDetailsTable.source.filterPredicate = this.createFilter();
    };

    /**
     * Maximize event
     * @param {Boolean} state
     */
    maximizeEvent(state: boolean): void {
        this.maximized = state;
        if (state) {
            this.interactionDetailsTable.columns = this.maxdisplayedColumns;
        } else {
            this.interactionDetailsTable.columns = this.mindisplayedColumns;
        }
    }
}
