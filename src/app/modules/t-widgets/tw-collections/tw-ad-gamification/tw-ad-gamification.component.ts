import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ResData } from 'app/interfaces';
import { GamificationService } from 'app/services/gamification.service';
import { forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-ad-gamification',
    templateUrl: './tw-ad-gamification.component.html',
    styleUrls: ['./tw-ad-gamification.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdGamificationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    gamificationReqStatus: ResData<{ badges: any[]; goldCoins: number; silverCoins: number; bronzeCoins: number }> = {
        error: false,
        loading: true,
        msg: '',
        data: {
            bronzeCoins: 0,
            goldCoins: 0,
            silverCoins: 0,
            badges: []
        }
    };

    maximized = false;
    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     * @param {gamificationService} GamificationService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        private _gamificationService: GamificationService
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

        this.setBadges();
        this.setupBadgeListeners();
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

    private setupBadgeListeners(): void {
        SDKClient.events.on('InteractionClosedEvent', this.setBadges);
    }

    setBadges = (): void => {
        if (!this.data.Data.LeaderBoardUrl || !this.data.Data.AgentProgressUrl) {
            this.gamificationReqStatus = { loading: false, error: true, msg: 'LeaderBoardUrl / AgentProgressUrl not provided in app config' };
            return;
        }
        const { agentId } = SDKClient.getAgentData();
        forkJoin([
            this._gamificationService.fetchLeaderBoard(this.data.Data.LeaderBoardUrl),
            this._gamificationService.getAgentProgress(this.data.Data.AgentProgressUrl, agentId)
        ]).subscribe(
            (res) => {
                const [leaders, metrics] = res;
                let goldCoins = 0;
                let silverCoins = 0;
                let bronzeCoins = 0;

                metrics.forEach((m: any) => {
                    goldCoins += m.GoldCoins;
                    silverCoins += m.SilverCoins;
                    bronzeCoins += m.BronzeCoins;
                });

                this.gamificationReqStatus = {
                    loading: false,
                    error: false,
                    msg: '',
                    data: {
                        goldCoins,
                        silverCoins,
                        bronzeCoins,
                        badges: leaders && leaders.length ? leaders[0].TotalBadges : []
                    }
                };
            },
            (err) => {
                console.error(err);
                this.gamificationReqStatus = { msg: 'Something went wrong', error: true, loading: false };
            }
        );
    };

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public maximizeEvent(state: boolean): void {
        this.maximized = state;
    }
}

// for more info visit - https://angular.io/api/core
