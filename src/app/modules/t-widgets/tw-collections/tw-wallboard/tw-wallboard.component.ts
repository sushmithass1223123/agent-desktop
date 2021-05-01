import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { DashboardColorCodeModel, SDKClient, TUtils, WallboardRefreshEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomTMACEventTypes, IWidget } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';

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
    @Input() data: IWidget;

    /**
     * Table sort Ref
     */
    @ViewChild(MatSort) sort: MatSort;

    /**
     * Widget data
     */
    widgetData: WidgetData;

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
    }

    /**
     * Lifecycle Hooks
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the widget data
        this.widgetData = this.data.Data;

        if (this.widgetData.SLEnabled) {
            // add service level to column
            this.displayedColumns.push('ServiceLevel');
            // get the dashboard color codes for wallboard
            SDKClient.getDashboardColorCodes().then((x) => {
                if (x.response) {
                    this.dashboardColors = x.response.filter((n) => n.DashboardName === 'TmacWallboard');
                }
            });
        }

        let eventName: CustomTMACEventTypes;
        if (this.widgetData.Role === 'agent') {
            eventName = 'WallboardRefreshEvent';
        }
        else if (this.widgetData.Role === 'supervisor') {
            eventName = 'TeamWallboardRefreshEvent';
        }
        else {
            TUtils.Logger.warn(`TwWallboardComponent: unable to get event name to regiser, Role=${this.widgetData.Role}`);
        }

        // register if only eventname is there
        if (eventName) {
            this._tmacEventService
                .getEvents([eventName])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe(evts => evts.forEach(evt => this.wallboardRefreshEvent(evt)));
        }
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
        if (this.widgetData.SLEnabled) {
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
    }

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
}

interface WidgetData {
    /**
     * Available Roles for this reusable component
     */
    Role: 'agent' | 'supervisor';
    /**
     * SL enabled flag
     */
    SLEnabled: boolean;
}

