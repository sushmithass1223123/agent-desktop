import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, InteractionData } from 'tmac-sdk';

/**
 * Agent Interactions details Table widget
 */
@Component({
    selector: 'tw-ad-interaction-details',
    templateUrl: './tw-ad-interaction-details.component.html',
    styleUrls: ['./tw-ad-interaction-details.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAdInteractionDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * app config data
     */
    @Input() data: any;

    /**
     * Table sort ref 
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    
    /**
     * Table Paginator ref
     */
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    /**
     * Maximized state
     */
    maximized = false;
    /**
     * Interaction List
     */
    interactionList: any[] = [];

    /**
     * Minimized displayed columns
     */
    mindisplayedColumns: string[] = ['Channel', 'Direction', 'User', 'CreatedTime'];

    /**
     * Maximized displayed columns
     */
    maxdisplayedColumns: string[] = ['Channel', 'SubChannel', 'Direction', 'User', 'Dnis', 'Intent', 'CreatedTime', 'ClosedTime', 'ActiveTime'];

    /**
     * Interaction Details table data
     */
    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: this.mindisplayedColumns
    };

    constructor() {
        super();
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        SDKClient.events.on('AgentInteractionDetailsEvent', this.AgentInteractionDetailsEvent);
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('AgentInteractionDetailsEvent', this.AgentInteractionDetailsEvent);
    }

    /**
     * AgentInteractionDetailsEvent hanlder
     * @param {InteractionData} data 
     */
    private AgentInteractionDetailsEvent = (data: InteractionData[]) => {
        this.interactionList = [...this.interactionList, ...data];

        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;

    }

    /**
     * Maximize event
     * @param {Boolean} state 
     */
    maximizeEvent(state: boolean): void {
        this.maximized = state;
        if (state) {
            this.interactionDetailsTable.columns = this.maxdisplayedColumns;
        } else {
            this.interactionDetailsTable.columns = this.mindisplayedColumns;
        }
    }
}
