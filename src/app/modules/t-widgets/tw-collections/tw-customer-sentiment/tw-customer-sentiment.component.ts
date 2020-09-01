import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS, CUSTOMER_SENTIMENT_PLOT_RECORDS } from 'app/constants';
import { TwChartConfig } from 'app/interfaces';
import * as Chart from 'chart.js';
import { random } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

const average = new Image();
average.src = '/assets/images/vectors/average-score.svg';
average.width = 20;
average.height = 20;

const positive = new Image();
positive.src = '/assets/images/vectors/positive-score.svg';
positive.width = 20;
positive.height = 20;

const negative = new Image();
negative.src = '/assets/images/vectors/negative-score.svg';
negative.width = 20;
negative.height = 20;

const sentimentDataPoints = {
    Negative: 8,
    Average: 50,
    Positive: 93
};

Chart.pluginService.register({
    afterUpdate: (chart) => {
        if (chart.config.options['setFeedbackEmoji']) {
            const dataset: any = chart.config.data.datasets[0];
            (Object.values(dataset._meta)[0] as any).data.forEach((d, i) => {
                const val = dataset.data[i].y;
                if (val === sentimentDataPoints.Negative) {
                    d._model.pointStyle = negative;
                } else if (val === sentimentDataPoints.Average) {
                    d._model.pointStyle = average;
                } else {
                    d._model.pointStyle = positive;
                }
            });
        }
    }
});

@Component({
    selector: 'tw-customer-sentiment',
    templateUrl: './tw-customer-sentiment.component.html',
    styleUrls: ['./tw-customer-sentiment.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerSentimentComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    customerSentimentChart: TwChartConfig = {
        data: [
            {
                data: [],
                label: 'Sentiment',
                showLine: true,
                borderWidth: 0,
                pointBackgroundColor: CHART_COLORS[0].backgroundColor,
                pointBorderColor: CHART_COLORS[0].hoverBackgroundColor,
                borderColor: CHART_COLORS[0].hoverBackgroundColor,
                backgroundColor: CHART_COLORS[0].hoverBackgroundColor
            }
        ],
        options: {
            showLines: false,
            legend: { display: false },
            tooltips: {
                callbacks: {
                    label: (tooltipItem) => {
                        const value = tooltipItem.value;
                        // tslint:disable-next-line: radix
                        const sentimentIndex = Object.values(sentimentDataPoints).indexOf(parseInt(value));
                        return Object.keys(sentimentDataPoints)[sentimentIndex];
                    }
                }
            },
            scales: {
                xAxes: [{ type: 'time', time: { stepSize: 5 } }],
                yAxes: [
                    {
                        ticks: {
                            display: false,
                            stepSize: 50,
                            suggestedMax: 100,
                            suggestedMin: 0
                        }
                    }
                ]
            },
            setFeedbackEmoji: true
        }
    };

    eventData = {
        SubEventName: 'OnNLPDataEvent',
        JsonData:
            '{"eventName":"OnNLPDataEvent","speechResult":"","nluResult":"{\\"intent\\":{\\"name\\":\\"Complaint\\",\\"confidence\\":0.3467572524},\\"entities\\":[],\\"intent_ranking\\":[{\\"name\\":\\"Complaint\\",\\"confidence\\":0.3467572524},{\\"name\\":\\"Clarification\\",\\"confidence\\":0.3072097413},{\\"name\\":\\"mood_unhappy\\",\\"confidence\\":0.0942083595},{\\"name\\":\\"New_Connection\\",\\"confidence\\":0.0808563845},{\\"name\\":\\"goodbye\\",\\"confidence\\":0.0785963859},{\\"name\\":\\"mood_great\\",\\"confidence\\":0.0378756104},{\\"name\\":\\"affirm\\",\\"confidence\\":0.0241965965},{\\"name\\":\\"deny\\",\\"confidence\\":0.0213421076},{\\"name\\":\\"greet\\",\\"confidence\\":0.008957562}],\\"text\\":\\"hey i have a prolem with my internet and it is keep on disconncting. How many time i should approach you guys to check this issue ?\\"}","sentimentResult":"Negative","resonseType":0,"errorMessage":null,"ucid":"Livechat200827180940_1348","agentID":"1014"}',
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

    nlpCurrentData: any = null;

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
        private _appDataService: AppDataService
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
        this.setupOnNLPDataEventListener();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    handleOnNLPDataEvent = (evt?: any): void => {
        const receivedData = evt || this.eventData;
        if (receivedData) {
            const parsedJson = {
                ...JSON.parse(receivedData.JsonData),
                sentimentResult: Object.values(sentimentDataPoints)[random(2, false)]
            };

            if (this.customerSentimentChart.data[0].data.length === CUSTOMER_SENTIMENT_PLOT_RECORDS) {
                this.customerSentimentChart.data[0].data = this.customerSentimentChart.data[0].data.slice(1);
            }

            this.customerSentimentChart.data[0].data.push({
                t: Date.now(),
                y: parsedJson.sentimentResult
            } as any);
        }
    }

    setupOnNLPDataEventListener(): void {
        setInterval(this.handleOnNLPDataEvent, 5000);
        SDKClient.events.on('OnNLPDataEvent', this.handleOnNLPDataEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}
