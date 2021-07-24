import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TableComponent } from '@modules/shared/components';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { CustomSDKEvent, IWidget, TwChartConfig } from 'app/interfaces';
import { format } from 'date-fns';
import { takeUntil } from 'rxjs/operators';

/**
 * Colors for chart
 */
const multiColors: any = {
    backgroundColor: CHART_COLORS.map((c) => c.backgroundColor),
    hoverBackgroundColor: CHART_COLORS.map((c) => c.hoverBackgroundColor)
};

/**
 * AHT / TC Widget component
 */
@Component({
    selector: 'tw-aht-tc',
    templateUrl: './tw-aht-tc.component.html',
    styleUrls: ['./tw-aht-tc.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAhtTcComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * App config json data
     */
    @Input() data: IWidget<any, WidgetData>;

    /**
     * Widget Maximized status
     */
    maximized = false;

    /**
     * Interactino list
     */
    interactionList: any[] = [];

    /**
     * AHT chart config
     */
    ahtChart: TwChartConfig = {
        datasets: [{ data: [] }],
        options: {
            showLines: false,
            tooltips: {
                callbacks: {
                    title: (item, data) => {
                        return data.datasets[item[0].datasetIndex].label;
                    }
                }
            }
        },
        colors: [multiColors, multiColors],
        labels: [],
        legend: false
    };

    /**
     * Ad table's component ref
     */
    @ViewChild(TableComponent) table: TableComponent;

    constructor(private _tmacEventService: TMACEventService) {
        super();
        this.ahtChart.options.plugins = { outlabels: { display: this.ahtChart.legend } };
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        let eventName: any;
        if (this.data.Data?.Role === 'agent') {
            eventName = 'AgentChannelListEvent';
        } else if (this.data.Data?.Role === 'supervisor') {
            eventName = 'TeamChannelListEvent';
        } else {
            this.logger.warn(`Unable to get event name to regiser, Role=${this.data.Data?.Role}`);
        }

        if (eventName) {
            // subecribe to the event
            this._tmacEventService
                .getNonInteractionEvents([eventName])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
        }
    }

    /**
     * Life cycle hook
     */
    ngAfterViewInit(): void {
        if (this.data.Data?.Type === 'grid') {
            this.setupADTable();
        }
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Sets up table data
     */
    setupADTable(): void {
        const iconMap = {
            voice: 'phone',
            textchat: 'chat',
            audiochat: 'wifi_calling_3',
            videochat: 'duo',
            sms: 'sms',
            email: 'email',
            emc: 'email'
        };
        this.table.config = {
            Channel: {
                tooltip: true,
                icon: (el: any) => ({
                    name: iconMap[el.Channel?.toLowerCase()] || 'feed',
                    only: true
                })
            },
            AverageHandleTime: {
                title: 'AHT',
                value: (element: any) => format((element.AverageActiveTime + element.AverageHoldTime) * 1000, 'hh:mm:ss') || '00:00:00'
            },
            Transfer: {},
            Conference: {}
        };
        this.table.columns = ['Channel', 'AverageHandleTime', 'Transfer', 'Conference'];
        this.table.sort = true;
        this.table.footer = 'disabled';
    }

    /**
     * AgentChannelListEvent handler
     * @param {CustomSDKEvent} evt
     */
    AgentChannelListEvent(evt: CustomSDKEvent): void {
        this.interactionList = evt.Data.Channels;
        this.table.source.data = this.interactionList;
    }

    /**
     * TeamChannelListEvent handler
     * @param {CustomSDKEvent} evt
     */
    TeamChannelListEvent(evt: CustomSDKEvent): void {
        const datasets = { AHT: [], 'Transfer / Conference': [] };
        const labels = [];
        evt.Data.Channels.forEach((c: any) => {
            if (c.AverageActiveTime + c.AverageHoldTime) {
                datasets.AHT.push(c.AverageActiveTime + c.AverageHoldTime);
            }

            if (c.Transfer + c.Conference) {
                datasets['Transfer / Conference'].push(c.Transfer + c.Conference);
            }

            labels.push(c.Channel);
        });

        this.ahtChart.datasets = Object.entries(datasets).reduce((acc, curr) => {
            const [key, val] = curr;
            /**
             * Add dataset only if data exists
             */
            if (val.length) {
                acc.push({ data: val, label: key });
            }
            return acc;
        }, []);
        this.ahtChart.labels = labels;
    }
}

interface WidgetData {
    /**
     * Available Roles for this reusable component
     */
    Role: 'agent' | 'supervisor';
    /**
     * Available types for this reusable component
     */
    Type: 'chart' | 'grid';
}
