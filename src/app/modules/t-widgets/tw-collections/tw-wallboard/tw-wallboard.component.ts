import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, WallboardRefreshEvent } from 'tmac-sdk';

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

        // get the stock event
        const event = this._tmacEventService.tmacEvents(eventName);
        // if event
        if (event) {
            // process the event
            this.wallboardRefreshEvent(event);
        }

        // register to events
        SDKClient.events.on(eventName, this.wallboardRefreshEvent);
    }


    /**
     * Lifecycle Hooks
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // deregister from tmac events
        SDKClient.events.off(this.source === 'supervisor' ?
            'TeamWallboardRefreshEvent' :
            'WallboardRefreshEvent',
            this.wallboardRefreshEvent);
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
