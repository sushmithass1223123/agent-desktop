import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomSDKEvent } from 'app/interfaces';
import { format } from 'date-fns';
import { orderBy } from 'lodash';
import { filter, takeUntil } from 'rxjs/operators';

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
    @ViewChild(MatPaginator)
    set paginator(value: MatPaginator) {
        this.interactionDetailsTable.source.paginator = value;
    }

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
    mindisplayedColumns: string[] = ['Channel', 'Direction', 'User', 'CreatedDateTime'];

    /**
     * Maximized displayed columns
     */
    maxdisplayedColumns: string[] = [
        'Channel',
        'SubChannel',
        'Direction',
        'User',
        'Dnis',
        'Intent',
        'CreatedDateTime',
        'ClosedDateTime',
        'ActiveTime',
        'AgentComment'
    ];

    /**
     * Advanced Search Modal
     */
    @ViewChild('advanceSearchModal') advanceSearchModal: TemplateRef<MatDialog>;
    /**
     * Advanced Search Modal Ref
     */
    advanceSearchModalRef: MatDialogRef<any>;

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
        ClosedTimeEnd: new FormControl(),
        AgentComment: new FormControl()
    });

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    constructor(
        private _tmacEventService: TMACEventService,
        private _appUIService: AppUiService,
        private _matDialog: MatDialog,
        private _fuseFacadeService: FuseFacadeService
    ) {
        super();
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
        this.interactionDetailsTable.source.filterPredicate = this.filterPredicate;

        this._tmacEventService
            .getNonInteractionEvents(['AgentInteractionDetailsEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Custom filter method fot Angular Material Datatable
     */
    filterPredicate = (data: any, filterStr: string): boolean => {
        if (filterStr === '{}') {
            return true;
        }
        const filters = JSON.parse(filterStr);
        const dateCols = {
            CreatedTimeStart: data.CreatedDateTime,
            CreatedTimeEnd: data.CreatedDateTime,
            ClosedTimeStart: data.ClosedDateTime,
            ClosedTimeEnd: data.ClosedDateTime
        };

        const compareDates = (dateKey: string): boolean => {
            const filterDate = new Date(filters[dateKey]);
            const recordDate = new Date(dateCols[dateKey]).getTime();
            if (dateKey.includes('Start')) {
                filterDate.setHours(0, 0, 0, 0);
                return filterDate.getTime() <= recordDate;
            } else {
                filterDate.setHours(23, 59, 59, 9999);
                return filterDate.getTime() >= recordDate;
            }
        };

        const valid = Object.entries(filters).every((f) => {
            const [key, value] = f;
            if (!value) {
                return true;
            }
            if (dateCols[key]) {
                return compareDates(key);
            } else {
                return data[key] && (data[key].toString().toLowerCase() as string).includes((value as string).toLowerCase());
            }
        });
        return valid;
    };

    /**
     * AgentInteractionDetailsEvent hanlder
     * @param {CustomSDKEvent} data
     */
    private AgentInteractionDetailsEvent(evt: CustomSDKEvent): void {
        // check if empty array then reset
        if (!evt.Data.length) {
            this.interactionList = [];
        } else {
            this.interactionList = [...this.interactionList, ...evt.Data];
        }

        // assign the interaction list
        let source = this.interactionList;

        // take only 10 for minimized mode
        if (!this.maximized) {
            source = orderBy(this.interactionList, 'CreatedDateTime', ['desc']).slice(0, 15);
        }

        this.interactionDetailsTable.source.data = source;
    }

    /**
     * Maximize event
     * @param {Boolean} state
     */
    maximizeEvent(state: boolean): void {
        this.maximized = state;
        // assign the interaction list
        let source = this.interactionList;

        if (state) {
            this.interactionDetailsTable.columns = this.maxdisplayedColumns;
            source = orderBy(this.interactionList, 'CreatedDateTime', ['desc']);
        } else {
            this.interactionDetailsTable.columns = this.mindisplayedColumns;
            source = orderBy(this.interactionList, 'CreatedDateTime', ['desc']).slice(0, 15);
        }

        this.interactionDetailsTable.source.data = source;
    }

    /**
     * To show agent notes
     *
     * @param notes
     */
    showNotes(notes: string): void {
        let message = notes;
        let otherData = {
            messageClasses: 'twd-whitespace-pre-line'
        };
        try {
            const jsonMessage = JSON.parse(notes);
            message = '';
            otherData = null;
            jsonMessage.forEach((item: any, index: number, array: []) => {
                message += `
                <div class="text-primary mat-body-2">${item.Comment.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                <span class="time muted-text mat-body-1">${item.User}</span>,
                <span class="time muted-text mat-body-1">${format(new Date(item.Time), 'dd/MM/yyyy hh:mm:ss a')}</span> 
                `;
                // add space if there are multiple items
                if (index !== array.length - 1) {
                    message += `
                       <br />
                       <br />
                       `;
                }
            });
        } catch (error) {
            message = notes;
        }
        this._appUIService.showCustomDialog('alert', message, 'Interaction Comments', otherData, {
            minWidth: '30%',
            maxWidth: '30%'
        });
    }

    /**
     * Opens Advanced Search modal
     */
    showAdvanceSearchModal(): void {
        this.advanceSearchModalRef = this._matDialog.open(this.advanceSearchModal, {
            width: '50%',
            panelClass: 'interaction-details-advanced-form'
        });
    }

    /**
     * Does advanced Search over the table
     */
    doAdvancedSearch(): void {
        const filters = this.advancedSearchForm.value || {};
        this.interactionDetailsTable.source.filter = JSON.stringify(filters);
        this.advanceSearchModalRef?.close();
    }
}
