import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { GamificationService } from '@services/gamification.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { sortBy } from 'lodash';

@Component({
    selector: 'tw-su-gamification',
    templateUrl: './tw-su-gamification.component.html',
    styleUrls: ['./tw-su-gamification.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuGamificationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    maximized = false;
    maximizedTableColumns = ['Position', 'AgentName', 'TotalBadges', 'TeamName', 'TotalPoints'];
    minimizedTableColumns = ['Position', 'AgentName', 'TotalPoints'];
    leaderboardTable = {
        source: new MatTableDataSource([]),
        columns: this.minimizedTableColumns
    };

    badges = [
        {
            BadgeId: 0,
            BadgeName: 'Starter',
            BadgeUrl: 'https://cdn2.iconfinder.com/data/icons/award-and-reward/128/Golden-badges-star-award-winner-512.png'
        },
        { BadgeId: 0, BadgeName: 'Master', BadgeUrl: 'https://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/11/1415490092badge.png' },
        { BadgeId: 0, BadgeName: 'Influencer', BadgeUrl: 'https://devopsinstitute.imgix.net/2017/08/devop-foundation-badge.jpg' },

        {
            BadgeId: 0,
            BadgeName: 'Starter',
            BadgeUrl: 'https://cdn2.iconfinder.com/data/icons/award-and-reward/128/Golden-badges-star-award-winner-512.png'
        },
        { BadgeId: 0, BadgeName: 'Master', BadgeUrl: 'https://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/11/1415490092badge.png' },
        { BadgeId: 0, BadgeName: 'Influencer', BadgeUrl: 'https://devopsinstitute.imgix.net/2017/08/devop-foundation-badge.jpg' },
        {
            BadgeId: 0,
            BadgeName: 'Starter',
            BadgeUrl: 'https://cdn2.iconfinder.com/data/icons/award-and-reward/128/Golden-badges-star-award-winner-512.png'
        },
        { BadgeId: 0, BadgeName: 'Master', BadgeUrl: 'https://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/11/1415490092badge.png' },
        { BadgeId: 0, BadgeName: 'Influencer', BadgeUrl: 'https://devopsinstitute.imgix.net/2017/08/devop-foundation-badge.jpg' },
        {
            BadgeId: 0,
            BadgeName: 'Starter',
            BadgeUrl: 'https://cdn2.iconfinder.com/data/icons/award-and-reward/128/Golden-badges-star-award-winner-512.png'
        },
        { BadgeId: 0, BadgeName: 'Master', BadgeUrl: 'https://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/11/1415490092badge.png' },
        { BadgeId: 0, BadgeName: 'Influencer', BadgeUrl: 'https://devopsinstitute.imgix.net/2017/08/devop-foundation-badge.jpg' },
        {
            BadgeId: 0,
            BadgeName: 'Starter',
            BadgeUrl: 'https://cdn2.iconfinder.com/data/icons/award-and-reward/128/Golden-badges-star-award-winner-512.png'
        },
        { BadgeId: 0, BadgeName: 'Master', BadgeUrl: 'https://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/11/1415490092badge.png' },
        { BadgeId: 0, BadgeName: 'Influencer', BadgeUrl: 'https://devopsinstitute.imgix.net/2017/08/devop-foundation-badge.jpg' }
    ];

    @ViewChild(MatSort) set sortContent(content: MatSort) {
        if (content) {
            // initially setter gets called with undefined
            this.leaderboardTable.source.sort = content;
        }
    }

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        public gamificationService: GamificationService
    ) {
        super();
        this.badges = [...this.badges, ...this.badges, ...this.badges, ...this.badges, ...this.badges];
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
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

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

    setupLeaderBoard(): void {
        this.gamificationService.fetchLeaderBoard(this.data.Data.LeaderBoardUrl).subscribe((leaders) => {
            if (leaders && leaders.length) {
                this.leaderboardTable.source = new MatTableDataSource(sortBy(leaders, 'Position'));
            }
        });
    }

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
