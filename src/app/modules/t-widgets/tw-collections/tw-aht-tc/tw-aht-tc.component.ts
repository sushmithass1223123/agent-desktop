import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { TwChartConfig } from 'app/interfaces';
import { AgentChannelDataList, SDKClient } from 'tmac-sdk';

type Sources = 'dashboard' | 'supervisor';

const multiColors: any = {
    backgroundColor: CHART_COLORS.map((c) => c.backgroundColor),
    hoverBackgroundColor: CHART_COLORS.map((c) => c.hoverBackgroundColor)
};

@Component({
    selector: 'tw-aht-tc',
    templateUrl: './tw-aht-tc.component.html',
    styleUrls: ['./tw-aht-tc.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAhtTcComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    @Input() data: any;

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    maximized = false;
    interactionList: any[] = [];

    dataConfig: {
        Source: Sources;
    };

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

    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: ['Channel', 'AverageHoldTime', 'Transfer', 'Conference']
    };

    constructor() {
        super();
        this.ahtChart.options.plugins = { outlabels: { display: this.ahtChart.legend } };
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.dataConfig = this.data.Data;
        if (this.dataConfig.Source === 'dashboard') {
            SDKClient.events.on('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);
        } else if (this.dataConfig.Source === 'supervisor') {
            SDKClient.events.on('SupervisorTeamChannelListEvent', this.SupervisorTeamChannelListEvent);
        }
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        SDKClient.events.off('SupervisorTeamChannelListEvent', this.SupervisorTeamChannelListEvent);
        SDKClient.events.off('AgentChannelDetailsEvent', this.AgentChannelDetailsEvent);
    }

    // Methods for Source === 'dashboard' ::: Start

    private AgentChannelDetailsEvent = (data: AgentChannelDataList) => {
        this.interactionList = data.Channels;
        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
    }

    // Methods for Source === 'dashboard' ::: End

    // Methods for Source === 'supervisor' ::: Start

    private SupervisorTeamChannelListEvent = (interactionsData: AgentChannelDetailsEventRes) => {
        const datasets = { AHT: [], 'Transfer / Conference': [] };
        const labels = [];
        interactionsData.Channels.forEach((c) => {
            datasets.AHT.push(c.AverageActiveTime + c.AverageHoldTime);
            datasets['Transfer / Conference'].push(c.Transfer + c.Conference);
            labels.push(c.Channel);
        });
        this.ahtChart.datasets = Object.keys(datasets).map((d) => ({
            data: datasets[d],
            label: d
        }));
        this.ahtChart.labels = labels;
    }

    // Methods for Source === 'supervisor' ::: End
}
