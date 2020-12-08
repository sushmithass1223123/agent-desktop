import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { WallboardRefreshEvent } from 'tmac-sdk';

/**
 * Wallboard componet
 * To check the skill etc of agents
 */
@Component({
    selector: 'tw-wallboard',
    templateUrl: './tw-wallboard.component.html',
    styleUrls: ['./tw-wallboard.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWallboardComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: any;

    /**
     * Table sort Ref
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    /**
     * Source used , since reusable component
     * To resuse pass a different source in app config and handle in oninit
     */
    source: string;

    /**
     * Columns displayed in table
     */
    displayedColumns: string[] = ['SkillName', 'AgentsStaffed', 'AgentAvailable', 'CallsInQueue'];

    /**
     * Table Data source
     */
    dataSource = new MatTableDataSource([]);

    /**
     * @constructor
     */
    constructor(
        private _tmacEventService: TMACEventService
    ) {
        super();
        this.source = '';
    }

    /**
     * Lifecycle Hooks
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get source from config
        this.source = this.data.Data.Source;

        const eventName = this.source === 'supervisor' ?
            'TeamWallboardRefreshEvent' :
            'WallboardRefreshEvent';

        this._tmacEventService.getEvents([eventName])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(this.wallboardRefreshEvent);
    }


    /**
     * Lifecycle Hooks
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }


    /**
     * Wallboard Refresh event handler
     * Updates table data on event
     */
    private wallboardRefreshEvent = (evt: WallboardRefreshEvent) => {
        this.dataSource = new MatTableDataSource(evt.Skills);
        this.dataSource.sort = this.sort;
    }
}
