import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, AgentChannelDataList } from 'tmac-sdk';

@Component({
    selector: 'tw-aht-tc',
    templateUrl: './tw-aht-tc.component.html',
    styleUrls: ['./tw-aht-tc.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAhtTcComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    maximized = false;
    interactionList: any[] = [];

    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: ['Channel', 'AverageHoldTime', 'Transfer', 'Conference']
    };

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        SDKClient.events.on('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);
    }

    private AgentChannelDetailsEvent = (data: AgentChannelDataList) => {
        this.interactionList = data.Channels;
        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
    }
}
