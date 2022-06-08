import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ResData } from 'app/interfaces';
import { sortBy } from 'lodash';
import { map, takeUntil } from 'rxjs/operators';
import { TwSuGamification } from '@ad/types';

/**
 * Supervisor Gamification Component
 */
@Component({
    selector: 'tw-su-gamification',
    templateUrl: './tw-su-gamification.component.html',
    styleUrls: ['./tw-su-gamification.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuGamificationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwSuGamification;

    /**
     * Gamificartion Request status
     */
    gamificationReqStatus: ResData<null> = {
        error: false,
        loading: true,
        msg: ''
    };
    /***
     * Maximized Status
     */
    maximized = false;
    /**
     * Maximized Table Columns
     */
    maximizedTableColumns = ['Position', 'AgentName', 'TotalBadges', 'TeamName', 'TotalPoints'];
    /**
     * Minimized table columns
     */
    minimizedTableColumns = ['Position', 'AgentName', 'TotalPoints'];
    /**
     * Leaderboard table
     */
    leaderboardTable = {
        source: new MatTableDataSource([]),
        columns: this.minimizedTableColumns
    };

    /**
     * Mat table sort ref
     */
    @ViewChild(MatSort) set sortContent(content: MatSort) {
        if (content) {
            // initially setter gets called with undefined
            this.leaderboardTable.source.sort = content;
        }
    }

    /**
     * Constructor
     */
    constructor(private _http: HttpClient) {
        super('TwSuGamificationComponent');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.setupLeaderBoard();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setup Leaderboard
     * @method setupLeaderBoard
     */
    setupLeaderBoard(): void {
        if (!this.data.Data.GamificationProxyUrl) {
            this.gamificationReqStatus = { msg: 'GamificationProxyUrl missing in app config', error: true, loading: false };
            return;
        }
        this._http
            .post<Record<'d', string>>(`${this.data.Data.GamificationProxyUrl}/GetLeaderBoard`, {})
            .pipe(
                map((x) => JSON.parse(x.d)),
                takeUntil(this.unsubscribeAll)
            )
            .subscribe(
                (leaders) => {
                    if (leaders && leaders.length) {
                        this.leaderboardTable.source = new MatTableDataSource(sortBy(leaders, 'Position'));
                    }
                    this.gamificationReqStatus = { msg: '', error: false, loading: false };
                },
                () => {
                    this.gamificationReqStatus = { msg: 'Unable to fetch leaderboard details', error: true, loading: false };
                }
            );
    }

    /**
     * Maximize event
     * @method maximizeEvent
     * @param {bBoolean} state
     */
    maximizeEvent(state: boolean): void {
        this.maximized = state;
        if (state) {
            this.leaderboardTable.columns = this.maximizedTableColumns;
        } else {
            this.leaderboardTable.columns = this.minimizedTableColumns;
        }
    }
}

// for more info visit - https://angular.io/api/core
