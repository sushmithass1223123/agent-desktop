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

    displayedColumns: string[] = ['Channel', 'SubChannel', 'CreatedTime', 'ClosedTime'];
    dataSource = new MatTableDataSource([]);

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

    private AgentInteractionDetailsEvent = (evt: any[]) => {
        if (evt.length > 1) {
            this.dataSource = new MatTableDataSource(evt);
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
        }
    }

    maximizeEvent(state: boolean): void {
        this.maximized = state;
    }
}
