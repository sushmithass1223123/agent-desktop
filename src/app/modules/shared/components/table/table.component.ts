import { Component, ElementRef, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FuseFacadeService } from '@services/fuse-facade.service';

type GenericLabel<T, K> = K | ((el: T) => K);

type Icon = { name?: string; only?: boolean; color?: 'warn' | 'primary' | 'accent'; prefixed?: boolean };

type BaseTableConfig = {
    /**
     * Title of the record
     */
    title?: string;
    /**
     * Width of the column
     */
    width?: string;
    /**
     * language code to display field name
     */
    langCode?: any | null;
};
export interface SelectedPayload {
    /**
     * Action selected of the row
     */
    action: string;
    /**
     * Selected record
     */
    record: any;
}

export type TableConfig<T = any> =
    | (BaseTableConfig & {
          /**
           * Type of the record to be displayed
           */
          type?: 'string';
          /**
           * Displayed Value of the record
           */
          value?: GenericLabel<T, string | number>;
          /**
           * icon value
           */
          icon?: GenericLabel<T, Icon>;
          /**
           * tooltip flag
           */
          tooltip?: boolean;
          /**
           * truncate flag
           */
          truncate?: boolean;
          /**
           * upper case flag
           */
          uppercase?: boolean;
          /**
           * searchable flag
           */
          searchable?: boolean;
          /**
           * custom ref for the cell
           */
          custom?: TemplateRef<any>;
      })
    | (BaseTableConfig & {
          /**
           * Type of the cell
           */
          type: 'date';
          /**
           * Displayed Value of the record
           */
          value?: GenericLabel<T, string | number>;
          /**
           * tooltip flag
           */
          tooltip?: boolean;
          truncate?: boolean;
          searchable?: boolean;
      })
    | (BaseTableConfig & {
          /**
           * Type of the cell
           */
          type: 'controls';
          /**
           * Config for the control cell
           */
          value?: {
              /**
               * Title of the record
               */ title: string;
              /**
               * icon value
               */ icon: string;
              /**
               * visibility flag for the control
               */
              visible?: (el: T) => boolean;
          }[];
      });

/**
 * Ad table component that can render a mat-table based on AD needs
 */
@Component({
    selector: 'ad-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    encapsulation: ViewEncapsulation.None
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit {
    /**
     * list of Columns allowed in the table
     */
    @Input() config: Record<string, TableConfig>;

    /**
     * List of displayed columns
     */
    @Input() columns = [];

    /**
     * Paginator flag
     * this enables pagination for the table
     */
    @Input() pagination = false;

    /**
     * Sort flag
     * This enables sort for the table
     */
    @Input() sort = false;

    /**
     * Grouping flag
     * This enables grouping for the table
     */
    @Input() grouping = false;

    /**
     * Expandable rows flag
     */
    @Input() expandableRows = false;

    /**
     * To hide page size
     */
    @Input() hidePageSize = false;

    /**
     * Page size when pagination enabled
     */
    @Input() pageSizeOptions = [15, 20, 30];

    /**
     * Footer flag
     * This disables, shows or hides the footer ie advanced search button and pagination controls
     */
    @Input() footer: 'disabled' | 'show' | 'hide' = 'show';

    /**
     * Flag for loading
     * true when table is loading
     */
    @Input() loading: boolean;

    /**
     * Emits action events
     */
    @Output() actionReducer = new EventEmitter();

    /**
     * Paginator event
     */
    @Output() pageEvent = new EventEmitter<any>();

    /**
     * Table sort ref
     */
    @ViewChild(MatSort) private set sortContent(content: MatSort) {
        if (content && this.sort) {
            // initially setter gets called with undefined
            this.source.sort = content;
        }
    }

    /**
     * Table Paginator ref
     */
    @ViewChild(MatPaginator) private set paginatorContent(content: MatPaginator) {
        if (content && this.pagination) {
            // initially setter gets called with undefined
            this.source.paginator = content;
        }
    }

    /**
     * Advanced search flag
     */
    @Input() advancedSearch = false;

    /**
     * Advanced Search Modal
     */
    @ViewChild('advanceSearchModal') advanceSearchModal: TemplateRef<MatDialog>;
    /**
     * Advanced Search Modal Ref
     */
    advanceSearchModalRef: MatDialogRef<any>;
    /**
     * Advanced search form
     */
    advancedSearchForm: Record<string, string> = {};

    /**
     * Date col keys and their relevant inputs
     */
    private dateCols: Record<string, string> = {};

    /**
     * Mat table's data source
     */
    source = new MatTableDataSource([]);

    /**
     * Fuse custom config
     */
    fuseBg$ = this._fuseFacadeService.widgetBgClasses$;

    /**
     * Selected row config
     */
    selected: SelectedPayload = null;

    /**
     * Ref for a custom roe
     */
    @Input() customRow: TemplateRef<any>;

    /**
     * Ref for expanded row which appears under the selected row
     */
    @Input() expandedRow: TemplateRef<any>;

    /**
     * Sort by key
     */
    @Input() sortBy: string;

    /**
     * Direction of the sort
     */
    @Input() sortDirection: SortDirection = 'desc';

    /**
     * Flag for whether row is selectable
     */
    @Input() selectable = false;

    /**
     * Input data
     */
    @Input() data: any[] = [];

    /**
     * Flag to scroll to top on page event
     */
    @Input() scrollToTopOnPageEvent = true;

    /**
     * Table container div ref
     */
    @ViewChild('tableContainer')
    tableContainerRef: ElementRef<HTMLDivElement>;

    constructor(private _matDialog: MatDialog, private _fuseFacadeService: FuseFacadeService) {}

    /**
     * Lifecycle hook OnInit
     */
    ngOnInit(): void {
        this.source = new MatTableDataSource(this.data ? this.data : []);
        if (!this.columns?.length && this.source.data.length) {
            this.columns = Object.keys(this.source.data[0]);
        }
        this.source.filterPredicate = this.filterPredicate;
        this.source.data = this.data;
    }

    /**
     * Escape special characters in Regular Expressions
     */
    regExpEscape = (s) => {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    /**
     * Custom filter method fot Angular Material Datatable
     */
    filterPredicate = (data: any, filterStr: string): boolean => {
        if (filterStr === '{}') {
            return true;
        }
        const filters = JSON.parse(filterStr);

        const valid = Object.entries(filters).every((f) => {
            const [key, value] = f;
            if (!value) {
                return true;
            }
            const dateColKey = this.isFieldDate(key);
            if (dateColKey) {
                return this.compareDates(key, filters[key], data[dateColKey]);
            } else {
                //creating regular expression after escaping special characters in the filter value
                const escapedValue = this.regExpEscape(value as string);
                const re = new RegExp(escapedValue, 'i');
                return data[key]?.match(re);
            }
        });
        return valid;
    };

    /**
     * Checks if fields is date
     * @param {String} key
     */
    private isFieldDate(key: string): string {
        if (key.includes('_Start') || key.includes('_End')) {
            const start = key.replace('_Start', '');
            const end = key.replace('_End', '');
            if (this.config[start]) {
                return start;
            } else if (this.config[end]) {
                return end;
            }
        }
    }

    /**
     * Checks if the date is in given range
     * @param {string} dateKey
     * @param {string} filterDateIn
     * @returns {Boolean} true if date is valid in vice versa
     */
    compareDates(dateKey: string, filterDateIn: string, recordDateIn: string): boolean {
        const filterDate = new Date(filterDateIn);
        const recordDate = new Date(recordDateIn).getTime();
        if (dateKey.includes('_Start')) {
            filterDate.setHours(0, 0, 0, 0);
            return filterDate.getTime() <= recordDate;
        } else {
            filterDate.setHours(23, 59, 59, 9999);
            return filterDate.getTime() >= recordDate;
        }
    }

    /**
     * Opens Advanced Search modal
     */
    showAdvanceSearchModal(): void {
        this.advanceSearchModalRef = this._matDialog.open(this.advanceSearchModal, {
            width: '50%',
            panelClass: 'ad-table-advancedsearch-form'
        });
    }

    /**
     * Does advanced Search over the table
     */
    doAdvancedSearch(): void {
        const filters = this.advancedSearchForm;
        this.source.filter = Object.keys(filters).length ? JSON.stringify(filters) : '';
        this.advanceSearchModalRef?.close();
    }

    /**
     * Triggers action for control buttons
     * @param {string} action
     * @param {any} record
     */
    async triggerAction(action: string, record: any): Promise<void> {
        this.clearSelected();
        record.expanded = true;
        // const payload = { action, record };
        this.selected = await this.formatPayload({ action, record });
        this.emitAction(this.selected);
    }

    async formatPayload(payload: SelectedPayload): Promise<SelectedPayload> {
        return payload;
    }

    emitAction(payload: SelectedPayload): void {
        this.actionReducer.emit(payload);
    }

    /**
     * Returns Column config
     * @param {string} key
     * @param {any} conf
     * @param {any} el
     * @returns
     */
    getColumnConfig(key: string, conf: any, el: any): void {
        return {
            ...conf,
            value: conf.value ? (typeof conf.value === 'function' ? conf.value(el) : conf.value) : el[key],
            icon: typeof conf.icon === 'function' ? conf.icon(el) : conf.icon,
            key: key
        };
    }

    /**
     * Collapses the expanded row
     * @param {any} record
     */
    collapseExpanded(): void {
        const selectedRow = this.source.data.find((x: any) => x.expanded);
        selectedRow.expanded = false;
    }

    /**
     * Emits paginator events
     * @param {any} evt
     */
    emitPageEvent(evt: any): void {
        if (this.scrollToTopOnPageEvent) {
            this.tableContainerRef.nativeElement.scrollTop = 0;
        }
        this.pageEvent?.emit(evt);
    }

    /**
     * Checks if row is expandable
     * @param {any} row
     * @returns
     */
    isExpanded = (_: number, row: any): boolean => {
        return this.expandableRows && row.expanded;
    };

    /**
     * Returns list of controls for row
     * @param ctrls
     * @param el
     * @returns
     */
    getCtrls(ctrls: any[], el: any): any[] {
        return ctrls.filter((c) => (c.visible ? c.visible(el) : true));
    }

    /**
     * Selects row
     * @param {any} row
     */
    selectRow(row: any): void {
        if (this.selectable) {
            this.triggerAction('row-selected', row);
        }
    }

    /**
     * To clear selected
     */
    clearSelected(): void {
        if (this.selected) {
            this.selected = null;
            this.collapseExpanded();
        }
    }
}
