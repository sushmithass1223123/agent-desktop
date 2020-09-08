import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { GamificationService } from '@services/gamification.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ResData } from 'app/interfaces';
import { BaseChartDirective } from 'ng2-charts';
import { takeUntil } from 'rxjs/operators';
import { GAMIFICATION_METRIC_LABELS } from 'app/constants';
import { SDKClient } from 'tmac-sdk';

const OnLoadMetricsToAgent = {
    SubEventName: 'OnLoadMetricsToAgent',
    JsonData:
        '{"eventdata":"[{\\"GoalId\\":1,\\"GoalType\\":\\"Daily\\",\\"MetricType\\":\\"AHT\\",\\"GoalName\\":\\"Voice_AHT\\",\\"GoalTarget\\":90},{\\"GoalId\\":2,\\"GoalType\\":\\"Daily\\",\\"MetricType\\":\\"TotalChat\\",\\"GoalName\\":\\"TotalChatInteractions\\",\\"GoalTarget\\":10},{\\"GoalId\\":3,\\"GoalType\\":\\"Daily\\",\\"MetricType\\":\\"AHT\\",\\"GoalName\\":\\"Chat_AHT\\",\\"GoalTarget\\":60}]"}',
    EventName: 'GenericTMACEvent',
    InteractionID: 0,
    IsInteractionConstructEvent: false,
    IsInteractionDisposeEvent: false,
    CreatedTime: '0001-01-01T00:00:00',
    EventId: null,
    RecoveryEvent: false,
    QueuedEvent: false,
    ACK: null
};

const OnAssignPointsToAgent = {
    SubEventName: 'OnAssignPointsToAgent',
    JsonData: '{"totalPointsAssigned":"AHT points : 5, TotalChats points : 2"}',
    EventName: 'GenericTMACEvent',
    InteractionID: 0,
    IsInteractionConstructEvent: false,
    IsInteractionDisposeEvent: false,
    CreatedTime: '0001-01-01T00:00:00',
    EventId: null,
    RecoveryEvent: false,
    QueuedEvent: false,
    ACK: null
};

@Component({
    selector: 'tw-ad-performance',
    templateUrl: './tw-ad-performance.component.html',
    styleUrls: ['./tw-ad-performance.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAdPerformanceComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    GAMIFICATION_METRIC_LABELS = GAMIFICATION_METRIC_LABELS;

    performanceChartProgress = {
        badge: {},
        goal: {}
    };

    gamificationReqStatus: ResData<null> = {
        error: false,
        loading: true,
        msg: ''
    };

    private performanceChartRef: BaseChartDirective;
    @ViewChild(BaseChartDirective) set setChartRef(content: any) {
        if (content) {
            this.performanceChartRef = content;
        }
    }

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
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        private gamificationService: GamificationService
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

        this.setChartData();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    setChartData(): void {
        if (!this.data.Data.AgentProgressUrl) {
            this.gamificationReqStatus = { loading: false, error: true, msg: 'AgentProgressUrl is not provided in app config' };
            return;
        }

        let onLoadMetricsToAgent = {
            ...OnLoadMetricsToAgent,
            JsonData: JSON.parse(OnLoadMetricsToAgent.JsonData)
        };

        onLoadMetricsToAgent = {
            ...onLoadMetricsToAgent,
            JsonData: { ...onLoadMetricsToAgent.JsonData, eventdata: JSON.parse(onLoadMetricsToAgent.JsonData.eventdata) }
        };

        const { agentId } = SDKClient.getAgentData();

        this.gamificationService.getAgentProgress(this.data.Data.AgentProgressUrl, agentId).subscribe(
            (metrics) => {
                try {
                    this.gamificationReqStatus = {
                        loading: false,
                        error: false,
                        msg: ''
                    };
                    metrics.forEach((m: any) => {
                        this.performanceChartProgress.badge[m.MetricName] = {
                            max: m.PointsAssigned + m.RequiredPointsForNextBadge,
                            current: m.PointsAssigned
                        };
                        this.performanceChartProgress.goal[m.MetricName] = {
                            max: parseInt(m.MetricMaxValue, 10),
                            current: parseInt(m.MetricCurrentValue, 10)
                        };
                    });
                } catch (e) {
                    this.gamificationReqStatus = { loading: false, error: true, msg: 'Looks like something went wrong' };
                }
            },
            (err) => {
                this.gamificationReqStatus = { loading: false, error: true, msg: 'Something went wrong while fetching progress' };
            }
        );
    }
}

// for more info visit - https://angular.io/api/core
