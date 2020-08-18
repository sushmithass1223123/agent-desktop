import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { fromEvent, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { SDKClient, WallboardRefreshEvent, WallboardSkillModel } from 'tmac-sdk';
import * as _ from 'lodash';
import { MatPaginator } from '@angular/material/paginator';

@Component({
    selector: 'tw-ad-interaction-details',
    templateUrl: './tw-ad-interaction-details.component.html',
    styleUrls: ['./tw-ad-interaction-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdInteractionDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    maximised = false;
    wallboardSkills: WallboardSkillModel[] = [];
    sortedData: WallboardSkillModel[];

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
            this.dataSource = new MatTableDataSource(this.getDummyData());
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
        });
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

    sortData(sort: Sort): any {
        const data = this.wallboardSkills.slice();
        if (!sort.active || sort.direction === '') {
            this.sortedData = data;
            return;
        }

        this.sortedData = data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'name':
                    return this.compare(a.SkillName, b.SkillName, isAsc);
                case 'staffed':
                    return this.compare(a.AgentsStaffed, b.AgentsStaffed, isAsc);
                case 'available':
                    return this.compare(a.AgentAvailable, b.AgentAvailable, isAsc);
                case 'ciq':
                    return this.compare(a.CallsInQueue, b.CallsInQueue, isAsc);
                default:
                    return 0;
            }
        });
    }

    compare(a: number | string, b: number | string, isAsc: boolean): any {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    maximizeEvent(state: boolean): void {
        this.maximised = state;
    }
}
