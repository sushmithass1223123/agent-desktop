import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TMACEventService } from '@services/tmac-event.service';
import { TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { CustomSDKEvent, TwChartConfig } from 'app/interfaces';
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
export class TwAhtTcComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: any;

    /**
     * Table Sort ref
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    /**
     * Table Paginator ref
     */
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    /**
     * Widget Maximized status
     */
    maximized = false;
    /**
     * Interactino list
     */
    interactionList: any[] = [];

    /**
     * App data config
     */
    widgetData: WidgetData;

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
     * Interaction Details table data
     */
    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: ['Channel', 'AverageHandleTime', 'Transfer', 'Conference']
    };

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
        
        this.widgetData = this.data.Data || new Object();

        let eventName: any;
        if (this.widgetData.Role === 'agent') {
            eventName = 'AgentChannelListEvent';
        }
        else if (this.widgetData.Role === 'supervisor') {
            eventName = 'TeamChannelListEvent';
        }
        else {
            TUtils.Logger.warn(`TwAhtTcComponent: unable to get event name to regiser, Role=${this.widgetData.Role}`);
        }

        if (eventName) {
            // subecribe to the event
            this._tmacEventService
                .getEvents([eventName])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe(evts => evts.forEach(evt => this[evt.EventName](evt)));
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
     * AgentChannelListEvent handler
     * @param {CustomSDKEvent} evt
     */
    private AgentChannelListEvent(evt: CustomSDKEvent): void {
        this.interactionList = evt.Data.Channels;
        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
    }

    /**
     * TeamChannelListEvent handler
     * @param {CustomSDKEvent} evt
     */
    private TeamChannelListEvent(evt: CustomSDKEvent): void {
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
