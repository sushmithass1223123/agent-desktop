import { AfterViewInit, Component, Input, OnChanges, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FuseFacadeService } from '@services/fuse-facade.service';

type Generic = string | number;

export type TableCellConfig =
    | Generic
    | {
          /**
           * Json key of the record
           */
          key: Generic;
          /**
           * Type of the cell
           */
          type: 'string' | 'date' | 'icon' | 'html';

          /**
           * Display name of the cell header
           */
          displayName?: Generic;

          /**
           * Icon applied to the row (not header) cell
           */
          icon?: string;
          /**
           * When enabled, only the icon is shown in the mat row cell's (not header)  content
           */
          iconOnly?: boolean;
          /**
           * Shows full text in the child row's cell (not header)
           */
          doNotTruncate?: boolean;
          /**
           * When enabled, doesnt render the tooltip for the Mat row cell (not header)
           */
          hideTooltip?: boolean;
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
export class TableComponent implements OnInit, OnChanges, AfterViewInit {
    /**
     * list of Columns allowed in the table
     */
    @Input() columns = [];
    /**
     * The record list for the table
     */
    @Input() data = [];
    /**
     * List of displayed columns
     */
    @Input() displayedColumns = [];
    /**
     * Icons to be used by this table instance.
     * This is normally optional, unless a column with icon type cells need to be rendered
     */
    @Input() icons = {};
    /**
     * This is used to generate a dynamic advanced search. This is optional.
     * To disable, pass an empty list or dont pass it at all
     */
    @Input() searchable = [];
    /**
     * Paginator flag
     * Allowed 'disabled' | 'show' | 'hide
     */
    @Input() paginator: 'disabled' | 'show' | 'hide' = 'disabled';
    /**
     * Sort flag
     * Allowed  'disabled' | 'enabled'
     */
    @Input() sort: 'disabled' | 'enabled' = 'disabled';

    /**
     * Table sort ref
     */
    @ViewChild(MatSort, { static: true }) sortRef: MatSort;

    /**
     * Table Paginator ref
     */
    @ViewChild(MatPaginator) paginationRef: MatPaginator;

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
    advancedSearchForm: FormGroup;

    /**
     * Date col keys and their relevant inputs
     */
    dateCols: Record<string, string> = {};

    /**
     * Mat table's data source
     */
    dataSource = new MatTableDataSource([]);

    /**
     * Fuse custom config
     */
    fuseBg$ = this._fuseFacadeService.widgetBgClasses$;

    constructor(private _fb: FormBuilder, private _matDialog: MatDialog, private _fuseFacadeService: FuseFacadeService) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.dataSource = new MatTableDataSource(this.data);
        this.advancedSearchForm = this._fb.group(
            this.searchable.reduce((acc, curr) => {
                if (curr.type === 'date') {
                    acc[`${curr.key}_Start`] = this._fb.control('');
                    this.dateCols[`${curr.key}_Start`] = '';
                    acc[`${curr.key}_End`] = this._fb.control('');
                    this.dateCols[`${curr.key}_End`] = '';
                } else {
                    acc[curr] = this._fb.control('');
                }
                return acc;
            }, {})
        );
        this.dataSource.filterPredicate = this.filterPredicate;
    }

    /**
     * Lifecycle hook
     */
    ngAfterViewInit(): void {
        if (this.paginator !== 'disabled') {
            this.dataSource.paginator = this.paginationRef;
        }
        if (this.sort === 'enabled') {
            this.dataSource.sort = this.sortRef;
        }
    }

    /**
     * Lifecycle hook
     */
    ngOnChanges(changes): void {
        if (changes.data) {
            this.dataSource.data = changes.data.currentValue;
        }
    }

    /**
     * Checks if the table cell is simlpe text or a complex one like date or icon
     * @param {TableCellConfig} c
     * @returns
     */
    isSimpleCell(c: TableCellConfig): boolean {
        return ['string', 'number'].includes(typeof c);
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
        const filters = this.advancedSearchForm.value || {};
        this.dataSource.filter = JSON.stringify(filters);
        this.advanceSearchModalRef?.close();
    }
}
