import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FuseFacadeService } from '@services/fuse-facade.service';

type GenericLabel<T, K> = K | ((el: T) => K);

type Icon = { name?: string; only?: boolean; color?: 'warn' | 'primary' | 'accent'; prefixed?: boolean };

export type TableConfig<T = any> =
    | {
          /**
           * Json key of the record
           */
          title?: string;
          type?: 'string';
          value?: (el: T) => string;
          icon?: GenericLabel<T, Icon>;
          tooltip?: boolean;
          truncate?: boolean;
          uppercase?: boolean;
          searchable?: boolean;
          width?: string;
          custom?: TemplateRef<any>;
      }
    | {
          /**
           * Json key of the record
           */
          title?: string;
          /**
           * Type of the cell
           */
          type: 'date';
          value?: (el: T) => string;
          tooltip?: boolean;
          width?: string;
          truncate?: boolean;
          searchable?: boolean;
      }
    | {
          /**
           * Json key of the record
           */
          title?: string;
          /**
           * Type of the cell
           */
          type: 'controls';
          width?: string;
          value?: GenericLabel<T, { title: string; icon: string }[]>;
          tooltip?: boolean;
          truncate?: boolean;
      };

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
     * Page size when pagination enabled
     */
    @Input() pageSizeOptions = [15, 20, 30];

    /**
     * Footer flag
     * This disables, shhows or hides the footer ie advanced search button and pagination controls
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
    @ViewChild(MatSort) set sortContent(content: MatSort) {
        if (content && !this.source.sort && this.sort) {
            // initially setter gets called with undefined
            this.source.sort = content;
        }
    }

    /**
     * Table Paginator ref
     */
    @ViewChild(MatPaginator) set paginatorContent(content: MatPaginator) {
        if (content && !this.source.paginator && this.pagination) {
            // initially setter gets called with undefined
            this.source.paginator = content;
        }
    }

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
    selected: {
        /**
         * Action selected of the row
         */
        action: string;
        /**
         * Selected record
         */
        record: any;
    } = null;

    @Input() customRow: TemplateRef<any>;
    @Input() expandedRow: TemplateRef<any>;

    constructor(private _matDialog: MatDialog, private _fuseFacadeService: FuseFacadeService) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.source = new MatTableDataSource([]);
        this.source.filterPredicate = this.filterPredicate;
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
            const dateColKey = this.dateCols[key];
            if (dateColKey) {
                return this.compareDates(key, filters[key], data[dateColKey]);
            } else {
                return data[key] && (data[key].toString().toLowerCase() as string).includes((value as string).toLowerCase());
            }
        });
        return valid;
    };

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
    triggerAction(action: string, record: any): void {
        if (this.selected) {
            this.selected = null;
            // this.collapseExpanded();
        }
        record.expanded = true;
        const payload = { action, record };
        this.actionReducer.emit(payload);
        this.selected = payload;
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
        this.pageEvent?.emit(evt);
    }

    /**
     * Checks if row is expandable
     * @param {any} row
     * @returns
     */
    isExpanded = (_: number, row: any): boolean => {
        console.log(_, row);
        return this.expandableRows && row.expanded;
    };
}
