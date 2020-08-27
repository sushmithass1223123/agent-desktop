import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { fromEvent, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { SDKClient, WallboardRefreshEvent } from 'tmac-sdk';
import { fuseAnimations } from '@fuse/animations';

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

    displayedColumns: string[] = ['Channel', 'Status', 'Created Time', 'Active Time'];
    dataSource = new MatTableDataSource([]);

    eventListener: Observable<any>;
    test: any;

    availableChannels = ['phone', 'chat', 'email'];
    availableStatuses = ['Active', 'OnHold', 'Closed'];

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.eventListener = fromEvent(SDKClient.events, 'WallboardRefreshEvent').pipe(distinctUntilChanged());
        this.eventListener.subscribe((dt: WallboardRefreshEvent) => {
            this.test = dt;
            // this.dataSource = new MatTableDataSource(this.getDummyData());
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
        });

        this.dataSource = new MatTableDataSource(this.getDummyData());
    }

    getDummyData(): any[] {
        return Array(50)
            .fill(1)
            .map(() => ({
                Channel: this.availableChannels[Math.floor(Math.random() * this.availableChannels.length)],
                Status: this.availableStatuses[Math.floor(Math.random() * this.availableStatuses.length)],
                CreatedTime: Date.now(),
                ActiveTime: '02:16:33'
            }));
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    maximizeEvent(state: boolean): void {
        this.maximized = state;
    }
}
