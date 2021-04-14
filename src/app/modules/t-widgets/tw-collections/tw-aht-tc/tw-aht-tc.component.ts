import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { CustomSDKEvent, TwChartConfig } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';

type Sources = 'dashboard' | 'supervisor';

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
    dataConfig: {
        /**
         * Available sources for this reusable compnent
         */
        Source: Sources;
    };

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
        this.dataConfig = this.data.Data;

        if (this.dataConfig.Source === 'dashboard') {
            // SDKClient.events.on('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);

            this._tmacEventService
                .getEvents(['AgentChannelDetailsEvent'])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.AgentChannelDetailsEvent(evts[0]));
        } else if (this.dataConfig.Source === 'supervisor') {
            // SDKClient.events.on('TeamChannelListEvent', this.TeamChannelListEvent);

            this._tmacEventService
                .getEvents(['TeamChannelListEvent'])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.TeamChannelListEvent(evts[0]));
        }
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // if (this.dataConfig.Source === 'dashboard') {
        //     SDKClient.events.off('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);
        // } else if (this.dataConfig.Source === 'supervisor') {
        //     SDKClient.events.off('TeamChannelListEvent', this.TeamChannelListEvent);
        // }
    }

    // Methods for Source === 'dashboard' ::: Start

    /**
     * AgentChannelDetailsEvent handler
     * @param {CustomSDKEvent} evt
     */
    private AgentChannelDetailsEvent = (evt: CustomSDKEvent) => {
        this.interactionList = evt.Data.Channels;
        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
    };

    // Methods for Source === 'dashboard' ::: End

    // Methods for Source === 'supervisor' ::: Start

    /**
     * TeamChannelListEvent handler
     * @param {CustomSDKEvent} evt
     */
    private TeamChannelListEvent = (evt: CustomSDKEvent) => {
        const datasets = { AHT: [], 'Transfer / Conference': [] };
        const labels = [];
        evt.Data.Channels.forEach((c: any) => {
            /**
             * Add only if data exists
             */
            if (c.AverageActiveTime + c.AverageHoldTime) {
                datasets.AHT.push(c.AverageActiveTime + c.AverageHoldTime);
            }
            /**
             * Add only if data exists
             */
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
    };

    // Methods for Source === 'supervisor' ::: End
}
