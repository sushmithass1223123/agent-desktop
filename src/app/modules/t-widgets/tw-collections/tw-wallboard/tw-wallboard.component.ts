import { TwWallboard, TwWallboardData } from '@ad/types';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { TableComponent } from '@modules/shared/components';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { DashboardColorCodeModel, SDKClient, WallboardRefreshEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomTMACEventTypes } from 'app/interfaces';
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
export class TwWallboardComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * App config json data
     */
    @Input() data: TwWallboard;

    /**
     * To store dashboard color codes
     */
    dashboardColors: DashboardColorCodeModel[];

    /**
     * Table Component's Ref
     */
    @ViewChild(TableComponent) table: TableComponent;

    /**
     * Custom cell ref for 'CustomerServiceLevel'
     */
    @ViewChild('customServiceLevelCell') customServiceLevelCell: TemplateRef<HTMLDivElement>;
    @ViewChild('customAgentStaffedCountCell') customAgentStaffedCountCell: TemplateRef<HTMLDivElement>;
    @ViewChild('customSAgentAvailableCountCell') customSAgentAvailableCountCell: TemplateRef<HTMLDivElement>;
    @ViewChild('customCallsInQueueCountCell') customCallsInQueueCountCell: TemplateRef<HTMLDivElement>;

    /**
     * @constructor
     */
    constructor(private _tmacEventService: TMACEventService, private _appUIService: AppUiService) {
        super('TwWallboardComponent');
    }

    /**
     * Lifecycle Hooks
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data, new TwWallboardData());

        // get the dashboard color codes for wallboard
        SDKClient.getDashboardColorCodes().then((x) => {
            if (x.response) {
                this.dashboardColors = x.response.filter((n) => n.DashboardName === 'TmacWallboard');
            }
        });

        let eventName: CustomTMACEventTypes;
        if (this.data.Data.Role === 'agent') {
            eventName = 'WallboardRefreshEvent';
        } else if (this.data.Data.Role === 'supervisor') {
            eventName = 'TeamWallboardRefreshEvent';
        } else {
            this.logger.warn(`Unable to get event name to regiser, Role=${this.data.Data.Role}`);
        }

        // register if only eventname is there
        if (eventName) {
            this._tmacEventService
                .getNonInteractionEvents([eventName])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => evts.forEach((evt) => this.wallboardRefreshEvent(evt)));
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
     * Lifecycle hook
     */
    ngAfterViewInit(): void {
        this.setupAdTable();
    }

    /**
     * Sets up the new AD table component
     */
    setupAdTable(): void {
        this.table.config = {
            SkillName: { title: 'Skill Name', width: '40%' },
            AgentsStaffed: { title: 'Stf', custom: this.customAgentStaffedCountCell },
            AgentAvailable: { title: 'Avl', custom: this.customSAgentAvailableCountCell },
            CallsInQueue: { title: 'CIQ', custom: this.customCallsInQueueCountCell },
            ServiceLevel: { title: 'SL %', custom: this.customServiceLevelCell }
        };
        this.table.sort = true;
        this.table.footer = 'disabled';
        this.table.columns = ['SkillName', 'AgentsStaffed', 'AgentAvailable', 'CallsInQueue'];
        this.table.sortBy = 'CallsInQueue';

        if (this.data.Data.SLEnabled) {
            // add service level to column
            // this.displayedColumns.push('ServiceLevel');
            this.table.columns.push('ServiceLevel');
        }
    }

    /**
     * Wallboard Refresh event handler
     * Updates table data on event
     */
    private wallboardRefreshEvent = (evt: WallboardRefreshEvent) => {
        try {
            // get skills to show
            let skillsToShow = evt.Skills;

            const hideSkillFilter = this.data.Data.HideSkillFilter;
            if (hideSkillFilter?.Value.length) {
                skillsToShow = skillsToShow.filter((s) => {
                    return !hideSkillFilter.Value.some((a) => {
                        try {
                            let filterType = 'includes';
                            if (hideSkillFilter.Type.toLowerCase() === 'startswith') {
                                filterType = 'startsWith';
                            } else if (hideSkillFilter.Type.toLowerCase() === 'endswith') {
                                filterType = 'endsWith';
                            }

                            return s.SkillName.toLowerCase()[filterType](a.toLocaleLowerCase());
                        } catch {}

                        return s;
                    });
                });
            }

            // for team wallboard event filter staffed agents
            if (evt.EventName === 'TeamWallboardRefreshEvent') {
                skillsToShow = skillsToShow.filter((s) => s.AgentsStaffed > 0 || s.CallsInQueue > 0);
            } else if (evt.EventName === 'WallboardRefreshEvent') {
                // check for skill update
                if (this.table.source.data.length && this.table.source.data.length !== skillsToShow.length) {
                    this._appUIService.showAppSnackbar({
                        message: 'Agent skills has been updated!',
                        state: 'success',
                        duration: 10000
                    });
                }
            }

            // assign the data
            // this.dataSource = new MatTableDataSource(skillsToShow);
            this.table.source = new MatTableDataSource(skillsToShow);
            // sorting data accessor for nested object sorting
            // check if the SL is enabled, since we need custom sort for Service Level only!
            if (this.data.Data.SLEnabled) {
                this.table.source.sortingDataAccessor = (item, property) => {
                    switch (property) {
                        case 'ServiceLevel':
                            return item.BCMSData.SLPercentage;
                        default:
                            return item[property];
                    }
                };
            }
            // add the sort
            // this.dataSource.sort = this.sort;
        } catch (error) {
            this.logger.error('Error in wallboardRefreshEvent', error);
        }
    };

    /**
     * To get dashboard bg color
     *
     * @param {Number} value
     * @param {String} type
     */
    getDashboardBgColor(value: number, type: string): string {
        // get the color code for the value
        const filterData = this.dashboardColors?.filter(
            (data) => data.ColumnName === type && Number(data.EndRange) >= value && Number(data.StartRange) <= value
        )?.[0];
        // if the data found
        if (filterData) {
            return filterData.BackgroundColor;
        }
        return '';
    }

    /**
     * To get dashboard font color
     * @param {Number} value
     * @param {String} type
     */
    getDashboardFontColor(value: number, type: string): string {
        // get the color code for the value
        const filterData = this.dashboardColors?.filter(
            (data) => data.ColumnName === type && Number(data.EndRange) >= value && Number(data.StartRange) <= value
        )?.[0];
        // if the data found
        if (filterData) {
            return filterData.FontColor;
        }
        return '';
    }
}
