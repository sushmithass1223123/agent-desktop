import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, WallboardRefreshEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-wallboard',
    templateUrl: './tw-wallboard.component.html',
    styleUrls: ['./tw-wallboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwWallboardComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    @ViewChild(MatSort, { static: true }) sort: MatSort;

    displayedColumns: string[] = ['SkillName', 'AgentsStaffed', 'AgentAvailable', 'CallsInQueue'];
    dataSource = new MatTableDataSource([]);

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // listen to the WallboardRefreshEvent
        SDKClient.events.on('WallboardRefreshEvent', (evt: WallboardRefreshEvent) => {
            this.dataSource = new MatTableDataSource(evt.Skills);
            this.dataSource.sort = this.sort;
        });
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
