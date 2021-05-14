import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ResData } from 'app/interfaces';
import { interval, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SDKClient } from '@tmac/sdk';

/**
 * Agent dashboard gamification widget
 */
@Component({
    selector: 'tw-ad-gamification',
    templateUrl: './tw-ad-gamification.component.html',
    styleUrls: ['./tw-ad-gamification.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdGamificationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    gamificationReqStatus: ResData<{ TotalBadges: any[]; GoldCoins: number; SilverCoins: number; BronzeCoins: number }> = {
        error: false,
        loading: true,
        msg: '',
        data: {
            BronzeCoins: 0,
            GoldCoins: 0,
            SilverCoins: 0,
            TotalBadges: []
        }
    };

    maximized = false;

    /**
     * Polling Subscription
     */
    pollingSubscription: Subscription;

    /**
     * Constructor
     * @param {gamificationService} GamificationService
     */
    constructor(private _http: HttpClient) {
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

        this.setBadges();
        // SDKClient.events.on('InteractionClosedEvent', this.startPolling);
        this.startPolling();
        // this.setupBadgeListeners();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // this.pollingSubscription.unsubscribe();
        // SDKClient.events.off('InteractionClosedEvent', this.setBadges);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Starts polling for gAmification data
     */
    startPolling = (): void => {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
        this.pollingSubscription = interval(10000).pipe(takeUntil(this.unsubscribeAll)).subscribe(this.setBadges);
    }

    /**
     * Set Badges
     */
    setBadges = (): void => {
        if (!this.data.Data.LeaderBoardUrl || !this.data.Data.AgentProgressUrl) {
            this.gamificationReqStatus = { loading: false, error: true, msg: 'LeaderBoardUrl / AgentProgressUrl not provided in app config' };
            return;
        }
        const { agentId } = SDKClient.getAgentData();
        // const agentId = '50005';
        this._http
            .post<{
                /**
                 * server response
                 */
                d: string;
            }>(this.data.Data.LeaderBoardUrl, {})
            .pipe(
                map((x) => JSON.parse(x.d)),
                takeUntil(this.unsubscribeAll)
            )
            .subscribe(
                (res) => {
                    const currentAgentData = (res || []).find((x) => x.AgentId === agentId);
                    this.gamificationReqStatus = {
                        loading: false,
                        error: false,
                        data: currentAgentData
                            ? {
                                ...currentAgentData,
                                TotalBadges: [
                                    {
                                        BadgeName: 'Novice',
                                        BadgeId: 0,
                                        BadgeUrl: currentAgentData.NoviceBadgeUrl,
                                        BadgePoints: currentAgentData.NoviceBadges
                                    },
                                    {
                                        BadgeName: 'Influencer',
                                        BadgeId: 1,
                                        BadgeUrl: currentAgentData.InfluencerBadgeUrl,
                                        BadgePoints: currentAgentData.InfluencerBadges
                                    },
                                    {
                                        BadgeName: 'Master',
                                        BadgeId: 2,
                                        BadgeUrl: currentAgentData.MasterBadgeUrl,
                                        BadgePoints: currentAgentData.MasterBadges
                                    }
                                ]
                            }
                            : { GoldCoins: 0, SilverCoins: 0, BronzeCoins: 0, TotalBadges: [] }
                    };
                },
                (err) => {
                    console.error(err);
                    this.gamificationReqStatus = { msg: 'Something went wrong', error: true, loading: false };
                }
            );
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public maximizeEvent(state: boolean): void {
        this.maximized = state;
    }
}

// for more info visit - https://angular.io/api/core
