import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-ad-interaction-details',
    templateUrl: './tw-ad-interaction-details.component.html',
    styleUrls: ['./tw-ad-interaction-details.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAdInteractionDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    maximized = false;
    interactionList: any[] = [];

    mindisplayedColumns: string[] = ['Channel', 'Direction', 'User', 'CreatedTime'];
    maxdisplayedColumns: string[] = ['Channel', 'SubChannel', 'Direction', 'User', 'Dnis', 'Intent', 'CreatedTime', 'ClosedTime', 'ActiveTime'];

    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: this.mindisplayedColumns
    };

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        SDKClient.events.on('AgentInteractionDetailsEvent', this.AgentInteractionDetailsEvent);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('AgentInteractionDetailsEvent', this.AgentInteractionDetailsEvent);
    }

    private AgentInteractionDetailsEvent = (data: any[]) => {
        this.interactionList = [...this.interactionList, ...data];

        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;

    }

    maximizeEvent(state: boolean): void {
        this.maximized = state;
        if (state) {
            this.interactionDetailsTable.columns = this.maxdisplayedColumns;
        } else {
            this.interactionDetailsTable.columns = this.mindisplayedColumns;
        }
    }
}
