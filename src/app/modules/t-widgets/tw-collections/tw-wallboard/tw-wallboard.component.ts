import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, WallboardRefreshEvent, WallboardSkillModel } from 'tmac-sdk';


@Component({
    selector: 'tw-wallboard',
    templateUrl: './tw-wallboard.component.html',
    styleUrls: ['./tw-wallboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwWallboardComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    wallboardSkills: WallboardSkillModel[] = [];
    sortedData: WallboardSkillModel[];

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        SDKClient.events.on('WallboardRefreshEvent', (dt: WallboardRefreshEvent) => {
            this.wallboardSkills = dt.Skills;
            this.sortedData = this.wallboardSkills.slice();
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
                case 'name': return this.compare(a.SkillName, b.SkillName, isAsc);
                case 'staffed': return this.compare(a.AgentsStaffed, b.AgentsStaffed, isAsc);
                case 'available': return this.compare(a.AgentAvailable, b.AgentAvailable, isAsc);
                case 'ciq': return this.compare(a.CallsInQueue, b.CallsInQueue, isAsc);
                default: return 0;
            }
        });
    }

    compare(a: number | string, b: number | string, isAsc: boolean): any {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }
}

