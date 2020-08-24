import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, WallboardRefreshEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-wallboard',
    templateUrl: './tw-wallboard.component.html',
    styleUrls: ['./tw-wallboard.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWallboardComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    @ViewChild(MatSort, { static: true }) sort: MatSort;

    source: string;

    displayedColumns: string[] = ['SkillName', 'AgentsStaffed', 'AgentAvailable', 'CallsInQueue'];
    dataSource = new MatTableDataSource([]);

    constructor() {
        super();
        this.source = '';
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get source from config
        this.source = this.data.Data.Source;

        // register to events
        SDKClient.events.on(this.source === 'supervisor' ?
            'TeamWallboardRefreshEvent' :
            'WallboardRefreshEvent',
            this.wallboardRefreshEvent);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // deregister from tmac events
        SDKClient.events.off(this.source === 'supervisor' ?
            'TeamWallboardRefreshEvent' :
            'WallboardRefreshEvent',
            this.wallboardRefreshEvent);
    }

    private wallboardRefreshEvent = (evt: WallboardRefreshEvent) => {
        this.dataSource = new MatTableDataSource(evt.Skills);
        this.dataSource.sort = this.sort;
    }
}
