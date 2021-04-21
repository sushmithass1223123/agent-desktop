import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { DashboardColorCodeModel, SDKClient, WallboardRefreshEvent } from '@tmac/sdk';

/**
 * Wallboard componet
 * To check the skill etc of agents
 */
@Component({
    selector: 'tw-wallboard',
    templateUrl: './tw-wallboard.component.html',
    styleUrls: ['./tw-wallboard.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWallboardComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: any;

    /**
     * Table sort Ref
     */
    @ViewChild(MatSort) sort: MatSort;

    /**
     * Source used , since reusable component
     * To resuse pass a different source in app config and handle in oninit
     */
    source: string;

    /**
     * Service level flag
     */
    slEnabled: boolean;

    /**
     * Columns displayed in table
     */
    displayedColumns: string[] = ['SkillName', 'AgentsStaffed', 'AgentAvailable', 'CallsInQueue'];

    /**
     * Table Data source
     */
    dataSource = new MatTableDataSource([]);

    /**
     * To store dashboard color codes
     */
    dashboardColors: DashboardColorCodeModel[];

    /**
     * @constructor
     */
    constructor(private _tmacEventService: TMACEventService, private _appUIService: AppUiService) {
        super();
        this.source = '';
    }

    /**
     * Lifecycle Hooks
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get source and slEnabled from config
        this.source = this.data.Data.Source;
        this.slEnabled = this.data.Data.SLEnabled;

        if (this.slEnabled) {
            // add service level to column
            this.displayedColumns.push('ServiceLevel');
            // get the dashboard color codes for wallboard
            SDKClient.getDashboardColorCodes().then((x) => {
                if (x.response) {
                    this.dashboardColors = x.response.filter((n) => n.DashboardName === 'TmacWallboard');
                }
            });
        }

        const eventName = this.source === 'supervisor' ? 'TeamWallboardRefreshEvent' : 'WallboardRefreshEvent';
        this._tmacEventService
            .getEvents([eventName])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => this.wallboardRefreshEvent(evts[0]));
    }

    /**
     * Lifecycle Hooks
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Wallboard Refresh event handler
     * Updates table data on event
     */
    private wallboardRefreshEvent = (evt: WallboardRefreshEvent) => {
        // check for skill update
        if (this.dataSource.data.length && this.dataSource.data.length !== evt.Skills.length) {
            this._appUIService.showAppSnackbar({
                message: 'Agent skills has been updated!',
                state: 'success',
                duration: 10000
            });
        }
        // assign the data
        this.dataSource = new MatTableDataSource(evt.Skills);
        // sorting data accessor for nested object sorting
        // check if the SL is enabled, since we need custom sort for Service Level only!
        if (this.slEnabled) {
            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case 'ServiceLevel':
                        return item.BCMSData.SLPercentage;
                    default:
                        return item[property];
                }
            };
        }
        // add the sort
        this.dataSource.sort = this.sort;
    };

    /**
     * To get SL bg color
     *
     * @param {Number} value
     */
    getSLBgColor(value: number): string {
        // get the color code for the value
        const filterData = this.dashboardColors.filter((data) => Number(data.EndRange) >= value && Number(data.StartRange) <= value)?.[0];
        // if the data found
        if (filterData) {
            return filterData.BackgroundColor;
        }
        return '';
    }

    /**
     * To get SL font color
     * @param {Number} value
     */
    getSLFontColor(value: number): string {
        // get the color code for the value
        const filterData = this.dashboardColors.filter((data) => Number(data.EndRange) >= value && Number(data.StartRange) <= value)?.[0];
        // if the data found
        if (filterData) {
            return filterData.FontColor;
        }
        return '';
    }

    /**
     * sets up the demo for interaction history
     */
    getInteractionHistoryDemo(): Array<{ type: 'chat' | 'voice'; date: Date; name: string; icon: string; steps: Array<any> }> {
        const getExtendate = (x) => {
            const date = new Date();
            date.setDate(18 + x);
            return date;
        };
        return new Array(20).fill(1).map((x) => ({
            date: getExtendate(x),
            icon: '',
            type: x % 2 ? 'chat' : 'voice',
            name: 'John Wick',
            steps: []
        }));
    }
}
