import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { fromEvent, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { SDKClient, WallboardRefreshEvent, WallboardSkillModel } from 'tmac-sdk';
import * as _ from 'lodash';

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

    wallboardSkills: WallboardSkillModel[] = [];
    sortedData: WallboardSkillModel[];

    displayedColumns: string[] = ['SkillName', 'AgentsStaffed', 'AgentAvailable', 'CallsInQueue'];
    dataSource = new MatTableDataSource([]);

    eventListener: Observable<any>;
    test: any;

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.eventListener = fromEvent(SDKClient.events, 'WallboardRefreshEvent').pipe(distinctUntilChanged());
        this.eventListener.subscribe((dt: WallboardRefreshEvent) => {
            this.test = dt;
            this.dataSource = new MatTableDataSource(dt.Skills);
            this.dataSource.sort = this.sort;
        });
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
}
