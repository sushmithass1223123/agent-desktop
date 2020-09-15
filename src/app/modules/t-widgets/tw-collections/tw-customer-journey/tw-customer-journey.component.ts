import { SelectionModel } from '@angular/cdk/collections';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { InteractionEventService } from '@services/interaction-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { sortBy, uniqBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { IGetInteractionHistory, InteractionHistoryReadyEvent, IUIEvent, SDKClient, InteractionHistory } from 'tmac-sdk';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';

@Component({
    selector: 'tw-customer-journey',
    templateUrl: './tw-customer-journey.component.html',
    styleUrls: ['./tw-customer-journey.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerJourneyComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    fuseConfig: FuseConfig;

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

    @ViewChild(TwWrapperComponent) wrapperComponent: TwWrapperComponent;

    @ViewChild(FusePerfectScrollbarDirective) fuseDirective: FusePerfectScrollbarDirective;

    interactionId: number;
    historyParams: IGetInteractionHistory;

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

    maximized = false;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionEventService: InteractionEventService,
        private sanitizer: DomSanitizer
    ) {
        super();

        this.customerJourneyTable = {
            loading: true,
            iframeUrl: '',
            lastId: '',
            tableData: {
                columns: ['SessionID', 'InteractionDate', 'Channel', 'CIF', 'NRIC', 'PhoneNumber'],
                selection: new SelectionModel<InteractionHistory>(false, []),
                source: new MatTableDataSource([])
            }
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

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
        const eventBag = this._interactionEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });


        SDKClient.events.on('InteractionHistoryReadyEvent', this.InteractionHistoryReadyEvent);
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
    }

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

    public maximizeEvent(state: boolean): void {
        this.maximized = state;
    }
}
