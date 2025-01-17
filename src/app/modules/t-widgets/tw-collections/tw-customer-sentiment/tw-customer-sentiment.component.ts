import { TwCustomerSentiment } from '@ad/types';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { GenericEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS, CUSTOMER_SENTIMENT_PLOT_RECORDS } from 'app/constants';
import { TwChartConfig } from 'app/interfaces';
import { Chart, ChartConfiguration, ChartType, Plugin } from 'chart.js';
import { takeUntil } from 'rxjs/operators';

/**
 * Neutral image
 */
const neutral = new Image();
neutral.src = 'assets/images/vectors/neutral-score.svg';
neutral.width = 20;
neutral.height = 20;

/**
 * Positive image
 */
const positive = new Image();
positive.src = 'assets/images/vectors/positive-score.svg';
positive.width = 20;
positive.height = 20;

/**
 * Negative image
 */
const negative = new Image();
negative.src = 'assets/images/vectors/negative-score.svg';
negative.width = 20;
negative.height = 20;

/**
 * Sendtiment constant datapoints in Graph
 */
const sentimentDataPoints = {
    /**
     * Slightly above zero
     */
    Negative: 8,
    /**
     * Median
     */
    Neutral: 50,
    /**
     * Slightly below 100
     */
    Positive: 93
};


/**
 * Customer sentiment chart component
 */
@Component({
    selector: 'tw-customer-sentiment',
    templateUrl: './tw-customer-sentiment.component.html',
    styleUrls: ['./tw-customer-sentiment.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerSentimentComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwCustomerSentiment;

    /**
     * customerSentimentChart data
     */
    customerSentimentChart: TwChartConfig = {
        datasets: [
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
            datasets: {
                line: {
                    showLine: false,
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => {
                            const value:any = tooltipItem.raw;
                            // tslint:disable-next-line: radix
                            const sentimentIndex = Object.values(sentimentDataPoints).indexOf(parseInt(value));
                            return Object.keys(sentimentDataPoints)[sentimentIndex];
                        }
                    }
                }
            },
            
            
            scales: {
                x:
                {
                    type: 'time' ,
                    // time:  { unitStepSize: 5 },
                    // distribution: 'series'
                } ,
                y: 
                {
                        ticks: {
                            display: false,
                            stepSize: 50,
                            //suggestedMax: 100,
                            //suggestedMin: 0
                        }
                }
                
            },
            setFeedbackEmoji: true
        }
    };

    /**
     * Current Interaction id
     */
    interactionId: number;

    /**
     * current nlp data
     */
    nlpCurrentData: any = null;

    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
    chart!: Chart;

    /**
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService) {
        super('TwCustomerSentimentComponent');
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

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        if (this.interactionId) {
            // listen to TMAC events
            this._tmacEventService
                // NLPDataEvent is an interaction event but it does not have InteractionID so we get from 'getNonInteractionEvents'
                // TODO:: Need server side changes to get from 'getInteractionEvents'
                .getNonInteractionEvents(['OnNLPDataEvent'])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
        }

        this.chart.options.onClick = (event) => {
            console.log('Chart clicked', event);
        };
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        if (this.chart) {
            this.chart.destroy();
        }
    }

    ngAfterViewInit(): void {
        const customPlugin: Plugin = {
            id: 'customPlugin',
            beforeDraw(chart) {
              console.log('Before drawing the chart');
            },
            afterDraw(chart) {
              console.log('After drawing the chart');
            },
            afterUpdate: (chart) => {
                if (chart.config.options['setFeedbackEmoji']) {
                    const dataset: any = chart.config.data.datasets[0];
                    (Object.values(dataset._meta)[0] as any).data.forEach((d: any, i: any) => {
                        const val = dataset.data[i].y;
                        if (val === sentimentDataPoints.Negative) {
                            d._model.pointStyle = negative;
                        } else if (val === sentimentDataPoints.Neutral) {
                            d._model.pointStyle = neutral;
                        } else {
                            d._model.pointStyle = positive;
                        }
                    });
                }
            }
          };
      
        Chart.register(customPlugin); // Register globally
        this.initializeChart();
    }

    initializeChart(): void {
        const chartConfig: ChartConfiguration = {
          type: 'line' as ChartType,
          data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
              {
                label: 'Sales',
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: '#42A5F5',
                backgroundColor: 'rgba(66, 165, 245, 0.2)',
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              tooltip: { enabled: true },
            }
          }
        };
    
        this.chart = new Chart(this.chartCanvas.nativeElement, chartConfig);
    }
    

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * OnNLPDataEvent handler
     * @param {GenericEvent} evt
     */
    OnNLPDataEvent(evt: GenericEvent): void {
        const receivedData = evt;
        if (receivedData) {
            const parsedJson = JSON.parse(receivedData.JsonData);

            // check for the interaction
            if (this.interactionId.toString() !== parsedJson.interactionID) {
                return;
            }

            if (parsedJson.messageSource === 'agent') {
                return;
            }

            parsedJson.sentimentResult = sentimentDataPoints[parsedJson.sentimentResult];

            if (this.customerSentimentChart.datasets[0].data.length === CUSTOMER_SENTIMENT_PLOT_RECORDS) {
                this.customerSentimentChart.datasets[0].data = this.customerSentimentChart.datasets[0].data.slice(1);
            }

            this.customerSentimentChart.datasets[0].data.push({
                t: Date.now(),
                y: parsedJson.sentimentResult
            } as any);
        }
    }

    updateChartData(newData: number[]): void { // apply on OnNLPDataEvent
        this.chart.data.datasets[0].data = newData;
        this.chart.update();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}
