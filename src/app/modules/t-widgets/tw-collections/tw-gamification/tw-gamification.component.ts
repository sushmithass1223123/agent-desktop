import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChildren, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ResData, ResGamification, ResGamificationBadge } from 'app/interfaces';
import { sortBy } from 'lodash';
import { interval } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

type Coin = {
    order: number;
    value: number;
    image: string;
    name: string;
    static?: boolean;
};

/**
 * Sample Component for T-widgets
 */
@Component({
    selector: 'tw-gamification', // make sure you set the selector starts with tw-<widget-name>
    templateUrl: './tw-gamification.component.html',
    styleUrls: ['./tw-gamification.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwGamificationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    leaderBoardRes: ResData<ResGamification[]> = {
        error: false,
        loading: false,
        data: []
    };

    getAgentProgressRes: ResData<any[]> = {
        error: false,
        loading: false,
        data: []
    };

    getAgentLevelsRes: ResData<any> = {
        error: false,
        loading: false,
        data: []
    };

    getQuizInfoRes: ResData<null> = {
        error: false,
        loading: false
    };

    defaultHighestScore = 3000;
    scoreBgs = ['bg-info', 'bg-alt-success', 'bg-alt-warning', 'bg-alt-danger'];

    dashboardState = {
        loading: true,
        error: false,
        msg: COMMON_ERR_MESSAGE
    };

    currentUser: {
        agentId: string;
        name: string;
        coins: Coin[];
        badges: ResGamificationBadge[];
        totalPoints: number;
        level: number;
    };

    coinsImages = {
        Bronze: 'assets/images/vectors/silver-coins-chest.svg',
        Gold: 'assets/images/vectors/gold-coins-chest.svg',
        Silver: 'assets/images/vectors/silver-coins-chest.svg',
        GeneralQuiz: 'assets/images/vectors/general-quiz.svg',
        SingtelGeneralQuiz: 'assets/images/vectors/product-quiz.svg'
    };

    polling = interval(10000);

    @ViewChildren('points') points: TemplateRef<any>;
    @ViewChildren('racecar') racecars: TemplateRef<any>;

    /**
     * --------------------------------------------------
     *  @ [OPTIONAL] to store the fuse config for theme
     * --------------------------------------------------
     */
    fuseConfig: FuseConfig;

    /**
     * --------------------------------------------------
     *  @ [OPTIONAL] to store entire app config and get update
     * --------------------------------------------------
     */
    appConfig: any;

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
        private http: HttpClient,
        private appUiService: AppUiService
    ) {
        super();
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

        const { agentId } = SDKClient.getAgentData();

        this.currentUser = {
            agentId,
            name: '',
            badges: [],
            coins: [],
            totalPoints: 0,
            level: 0
        };

        this.setupDashboard();

        this.polling.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
            // this.fetchLeaderBoard();
            // this.getAgentProgress();
            // this.getQuizInfo();
        });

        SDKClient.events.on('OnLoadMetricsToAgent', this.OnLoadMetricsToAgent);
        SDKClient.events.on('OnAssignPointsToAgent', this.OnAssignPointsToAgent);

        // setTimeout(() => {
        //     this.OnAssignPointsToAgent({
        //         SubEventName: 'OnAssignPointsToAgent',
        //         JsonData: '{"totalPointsAssigned":"AHT points : 5, TotalChats points : 2"}',
        //         EventName: 'GenericTMACEvent',
        //         InteractionID: 0,
        //         IsInteractionConstructEvent: false,
        //         IsInteractionDisposeEvent: false,
        //         CreatedTime: '0001-01-01T00:00:00',
        //         EventId: null,
        //         RecoveryEvent: false,
        //         QueuedEvent: false,
        //         ACK: null
        //     });
        // }, 5000);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        SDKClient.events.off('OnLoadMetricsToAgent', this.OnLoadMetricsToAgent);
        SDKClient.events.off('OnAssignPointsToAgent', this.OnAssignPointsToAgent);
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
     * Makes all api requests
     */
    setupDashboard(): void {
        try {
            this.leaderBoardRes = { loading: true, error: false };
            this.getAgentProgressRes.loading = true;
            this.getAgentProgressRes.error = false;
            this.getAgentLevelsRes = { loading: true, error: false, data: [] };
            this.getQuizInfoRes.loading = true;
            this.getQuizInfoRes.error = false;
            this.fetchLeaderBoard();
            this.getAgentProgress();
            this.getAgentLevels();
            this.getQuizInfo();
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * FetchLeaderboard Data
     * @param url
     */
    fetchLeaderBoard(): void {
        this.http
            .post<{ d: string }>(this.data.Data.LeaderBoardUrl, {})
            .pipe(
                map((x) => JSON.parse(x.d)),
                takeUntil(this.unsubscribeAll)
            )
            .subscribe(
                (leaderBoardRes) => {
                    this.leaderBoardRes = { loading: false, error: false, data: sortBy(leaderBoardRes || [], 'Position') };
                    try {
                        this.leaderBoardRes.data.forEach((user) => {
                            if (user.AgentId === this.currentUser.agentId) {
                                this.currentUser.badges.unshift(...user.TotalBadges);
                                const coins: Coin[] = [
                                    { image: this.coinsImages['Gold'], name: 'Gold', order: 0, value: user.GoldCoins, static: true },
                                    { image: this.coinsImages['Bronze'], name: 'Bronze', order: 2, value: user.BronzeCoins, static: true },
                                    { image: this.coinsImages['Silver'], name: 'Silver', order: 1, value: user.SilverCoins, static: true }
                                ];

                                // if (this.currentUser.coins[0] && this.currentUser.coins[0].name === 'Gold') {
                                this.currentUser.coins = this.currentUser.coins.filter((x) => !x.static) || [];
                                //     console.log(this.currentUser.coins);
                                // }
                                this.currentUser.coins.unshift(...sortBy(coins, 'order'));
                            }
                        });
                    } catch (e) {
                        console.error(e);
                        this.leaderBoardRes = { loading: false, error: true };
                        this.dashboardState.msg = COMMON_ERR_MESSAGE;
                    }
                },
                (err) => {
                    console.error(err);
                    this.leaderBoardRes = { loading: false, error: true };
                    this.dashboardState.msg = COMMON_ERR_MESSAGE;
                }
            );
    }

    /**
     * Gets Agent Progress
     * @param url
     * @param agentId
     */
    getAgentProgress(): void {
        this.http
            .post<{ d: string }>(this.data.Data.AgentProgressUrl, { agentId: this.currentUser.agentId })
            .pipe(
                map((x) => JSON.parse(x.d)),
                takeUntil(this.unsubscribeAll)
            )
            .subscribe(
                (progressRes) => {
                    try {
                        this.getAgentProgressRes = {
                            loading: false,
                            error: false,
                            data: sortBy(progressRes || [], 'RequiredPointsForNextBadge').map((x) => ({
                                ...x,
                                MetricMaxValue: x.MetricMaxValue ? parseInt(x.MetricMaxValue, 10) : 0,
                                MetricAverageValue: x.MetricAverageValue ? parseInt(x.MetricAverageValue, 10) : 0
                            }))
                        };
                        this.currentUser.totalPoints = 0;
                        this.getAgentProgressRes.data.forEach((p) => {
                            this.currentUser.totalPoints += p.PointsAssigned;
                            // this.currentUser.badges.push({
                            //     BadgeId: (p.PointsAssigned * 100) / (p.PointsAssigned + p.RequiredPointsForNextBadge),
                            //     BadgeName: 'Locked',
                            //     BadgeUrl: 'assets/images/vectors/achievement-locked.svg'
                            // });
                        });
                        this.setCurrenAgentLevel();
                    } catch (e) {
                        this.getAgentProgressRes = { loading: false, error: true };
                        this.dashboardState.msg = COMMON_ERR_MESSAGE;
                    }
                },
                (err) => {
                    console.error(err);
                    this.getAgentProgressRes = { loading: false, error: true };
                    this.dashboardState.msg = COMMON_ERR_MESSAGE;
                }
            );
    }

    /**
     * Get agent levels
     */
    getAgentLevels(): void {
        this.http
            .post<any>('https://dice.tetherfi.cloud/GamificationProxy/Proxy.asmx/GetAgentLevels', { agentId: this.currentUser.agentId })
            // .pipe(map((x) => ({ ...x.d, data: JSON.parse(x.d.data) })))
            .pipe(
                takeUntil(this.unsubscribeAll),
                map((x) => ({ ...x.d, data: JSON.parse(x.d.data) }))
            )
            .subscribe(
                (agentLevelRes) => {
                    try {
                        // agentLevelRes.d.data = {
                        //     Levels: [
                        //         { LevelID: 1, Name: 'Level1', Points: 1000 },
                        //         { LevelID: 2, Name: 'Level2', Points: 1500 },
                        //         { LevelID: 3, Name: 'Level3', Points: 2000 },
                        //         { LevelID: 4, Name: 'Level4', Points: 2500 }
                        //     ]
                        // };
                        this.getAgentLevelsRes = { error: false, loading: false, data: sortBy(agentLevelRes.data.Levels, 'Points') };
                        this.setCurrenAgentLevel();
                    } catch (e) {
                        console.error(e);
                        this.getAgentLevelsRes = { loading: false, error: true };
                        this.dashboardState.msg = COMMON_ERR_MESSAGE;
                    }
                },
                (err) => {
                    console.error(err);
                    this.getAgentLevelsRes = { loading: false, error: true };
                    this.dashboardState.msg = COMMON_ERR_MESSAGE;
                }
            );
    }

    /**
     * Get quiz Information
     */
    getQuizInfo(): void {
        const coins = [];
        this.http
            .post<any>('https://dice.tetherfi.cloud/GamificationProxy/Proxy.asmx/GetQuizInformation', { agentId: this.currentUser.agentId })
            .pipe(
                takeUntil(this.unsubscribeAll),
                map((x) => ({ ...x.d, data: JSON.parse(x.d.data) }))
            )
            .subscribe(
                (quizInfoRes) => {
                    try {
                        quizInfoRes.data.forEach((d, i) => {
                            coins.push({ image: this.coinsImages[d.Intent], value: d.Result, name: d.Intent, order: i + 2 });
                        });
                        this.currentUser.coins.push(...sortBy(coins, 'order'));
                        this.getQuizInfoRes = { loading: false, error: false };
                    } catch (e) {
                        console.error(e);
                        this.getQuizInfoRes = { loading: false, error: true };
                        this.dashboardState.msg = COMMON_ERR_MESSAGE;
                    }
                },
                (err) => {
                    console.error(err);
                    this.getQuizInfoRes = { loading: false, error: true };
                    this.dashboardState.msg = COMMON_ERR_MESSAGE;
                }
            );
    }

    /**
     * load metrics on login
     * @param evt
     */
    OnLoadMetricsToAgent = (evt: any): void => {
        const JsonData = JSON.parse(evt.JsonData);
        // console.log({ ...evt, JsonData: { ...JsonData, eventdata: JSON.parse(JsonData.eventdata) } });
    };

    /**
     * Assign points events
     * @param evt
     */
    OnAssignPointsToAgent = (evt: any): void => {
        const JsonData = JSON.parse(evt.JsonData);
        this.appUiService.addNotification({ message: JsonData.totalPointsAssigned, status: 'success' });
        // this.appUiService.showSnackbar(JsonData.totalPointsAssigned, 'success');
    };

    /**
     * Set current agent level
     */
    setCurrenAgentLevel(): void {
        this.currentUser.level = 0;
        this.getAgentLevelsRes.data.forEach((l, i) => {
            if (this.currentUser.totalPoints > l.Points) {
                this.currentUser.level = i + 1;
            }
        });
    }

    /**
     * Track by func for coins and points
     * @param index
     * @param field
     */
    valueField(_: number, field: any): any {
        return field.value;
    }

    /**
     * track func for earned badges
     * @param _
     * @param field
     */
    badgeName(_: number, field: any): void {
        return field.BadgeName;
    }

    /**
     * track by fun for My Performance
     * @param _
     * @param field
     */
    pointsAssigned(_: number, field: any): any {
        return field.PointsAssigned;
    }
}

// for more info visit - https://angular.io/api/core
