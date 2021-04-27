import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IAction, IWidget, ResData, ResGamification, ResGamificationBadge } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { sortBy } from 'lodash';
import { interval, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

type Coin = {
    /**
     * Number  of coins
     */
    value: number;
    /**
     * coin image
     */
    image: string;
    /**
     * coin name
     */
    name: string;
    /**
     * whether coins are statically placed
     */
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

    /**
     * stateful leaderBoardrequest
     */
    leaderBoardRes: ResData<ResGamification[]> = {
        error: false,
        loading: false,
        data: []
    };

    /**
     * stateful getAgentProgress request
     */
    getAgentProgressRes: ResData<any[]> = {
        error: false,
        loading: false,
        data: []
    };

    /**
     * stateful getAgentLevels request
     */
    getAgentLevelsRes: ResData<any> = {
        error: false,
        loading: false,
        data: []
    };

    /**
     * stateful getQuizInfo Request
     */
    getQuizInfoRes: ResData<null> = {
        error: false,
        loading: false
    };

    /**
     * Score Backgrounds
     */
    scoreBgs = ['bg-info', 'bg-alt-success', 'bg-alt-warning', 'bg-alt-danger'];

    /**
     * Current global dashboard state
     */
    dashboardState = {
        loading: false,
        error: false,
        msg: COMMON_ERR_MESSAGE
    };

    /**
     * Current user details
     */
    currentUser: {
        /**
         * agent Id
         */
        agentId: string;
        /**
         * Agent name
         */
        name: string;
        /**
         * Coins for agent
         */
        coins: Coin[];
        /**
         * agentt's badges
         */
        badges: ResGamificationBadge[];
        /**
         * Total user points
         */
        totalPoints: number;
        /**
         * current user level
         */
        level: number;
    };

    /**
     * Coins Images
     */
    coinsImages = {
        Bronze: 'assets/images/vectors/silver-coins-chest.svg',
        Gold: 'assets/images/vectors/gold-coins-chest.svg',
        Silver: 'assets/images/vectors/silver-coins-chest.svg',
        GeneralQuiz: 'assets/images/vectors/general-quiz.svg',
        SingtelGeneralQuiz: 'assets/images/vectors/product-quiz.svg'
    };

    /**
     * polling interval in milliseconds
     */
    pollingInterval = 10000;

    /**
     * Polling subscriptoin
     */
    polling: Subscription;

    /**
     * Constructor
     */
    constructor(private http: HttpClient, private appUiService: AppUiService, private _aotWidgetService: AOTWidgetService) {
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
            // const missingConfigs = this.getMissingConfigs();
            if (!this.data.Data.GamificationProxy) {
                this.dashboardState = { loading: false, error: true, msg: 'GamificationProxy missing in app config' };
            } else {
                if (this.polling) {
                    this.polling.unsubscribe();
                }
                const pollingPulse = interval(this.pollingInterval);
                this.polling = pollingPulse.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
                    this.fetchLeaderBoard();
                    this.getAgentProgress();
                    this.getQuizInfo();
                });
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
            }
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
            .post<Record<'d', string>>(`${this.data.Data.GamificationProxy}/GetLeaderBoard`, {})
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
                                // this.currentUser.badges.unshift(...this.sortBadges(user.TotalBadges));
                                this.currentUser.totalPoints = user.TotalPoints;
                                this.currentUser.badges = [
                                    { BadgeName: 'Novice', BadgeId: 0, BadgeUrl: user.NoviceBadgeUrl, BadgePoints: user.NoviceBadges },
                                    { BadgeName: 'Influencer', BadgeId: 1, BadgeUrl: user.InfluencerBadgeUrl, BadgePoints: user.InfluencerBadges },
                                    { BadgeName: 'Master', BadgeId: 2, BadgeUrl: user.MasterBadgeUrl, BadgePoints: user.MasterBadges }
                                ];
                                const coins: Coin[] = [
                                    { image: this.coinsImages['Gold'], name: 'Gold', value: user.GoldCoins, static: true },
                                    { image: this.coinsImages['Silver'], name: 'Silver', value: user.SilverCoins, static: true },
                                    { image: this.coinsImages['Bronze'], name: 'Bronze', value: user.BronzeCoins, static: true }
                                ];

                                // if (this.currentUser.coins[0] && this.currentUser.coins[0].name === 'Gold') {
                                this.currentUser.coins = this.currentUser.coins.filter((x) => !x.static) || [];

                                this.currentUser.coins.unshift(...sortBy(coins, 'order'));
                                this.setCurrenAgentLevel();
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
            .post<Record<'d', string>>(`${this.data.Data.GamificationProxy}/GetProgress`, {
                agentId: this.currentUser.agentId
            })
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
                        // this.currentUser.totalPoints = 0;
                        // this.getAgentProgressRes.data.forEach((p) => {
                        //     this.currentUser.totalPoints += p.PointsAssigned;
                        // });
                        // this.setCurrenAgentLevel();
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
            .post<any>(`${this.data.Data.GamificationProxy}/GetAgentLevels`, { agentId: this.currentUser.agentId })
            // .pipe(map((x) => ({ ...x.d, data: JSON.parse(x.d.data) })))
            .pipe(
                takeUntil(this.unsubscribeAll),
                map((x) => ({ ...x.d, data: x.d ? JSON.parse(x.d.data) : [] }))
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
            .post<any>(`${this.data.Data.GamificationProxy}/GetQuizInformation`, { agentId: this.currentUser.agentId })
            .pipe(
                takeUntil(this.unsubscribeAll),
                map((x) => ({ ...x.d, data: x.d ? JSON.parse(x.d.data) : [] }))
            )
            .subscribe(
                (quizInfoRes) => {
                    try {
                        quizInfoRes.data.forEach((d, i) => {
                            coins.push({ image: this.coinsImages[d.Intent], value: d.Result, name: d.Intent, order: i + 2 });
                        });
                        this.currentUser.coins = this.currentUser.coins.filter((x) => x.static) || [];
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
        // const JsonData = JSON.parse(evt.JsonData);
        // console.log({ ...evt, JsonData: { ...JsonData, eventdata: JSON.parse(JsonData.eventdata) } });
    };

    /**
     * Assign points events
     * @param evt
     */
    OnAssignPointsToAgent = (evt: any): void => {
        const JsonData = JSON.parse(evt.JsonData);
        this.appUiService.addNotification({ message: JsonData.totalPointsAssigned, status: 'new' });
    };

    /**
     * Set current agent level
     */
    setCurrenAgentLevel(): void {
        this.currentUser.level = 1;
        sortBy(this.getAgentLevelsRes.data, 'Points').forEach((l: any, i: any) => {
            if (this.currentUser.totalPoints >= l.Points) {
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

    /**
     * Method to redeem points
     */
    redeem(): void {
        if (!this.data.Data.TVirtualStoreUrl) {
            this.appUiService.showSnackbar('Missing TVirtualStore in app config', 'failure');
            return;
        }
        const title = `TVirtualStore`;
        const icon = '';
        const width = 1000;
        const height = 700;
        const actions: IAction[] = ['destroy', 'maximize'];
        const viewState = 'restore';

        // create a widget model
        const widget = new TwWidgetModel(title, 'tw-custom', icon);
        widget.Config.Position.W = width;
        widget.Config.Position.H = height;
        widget.Config.Actions = actions;
        widget.Config.ViewState = viewState;

        const url = new URL(this.data.Data.TVirtualStoreUrl);

        const { agentId } = SDKClient.getAgentData();
        url.searchParams.append('agentid', agentId);

        widget.Data.Url = url.toString();

        this._aotWidgetService.addWidget(widget);
    }
}

// for more info visit - https://angular.io/api/core
