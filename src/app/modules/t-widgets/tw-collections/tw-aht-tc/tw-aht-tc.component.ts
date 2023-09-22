import { TwAhtTc } from '@ad/types';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TableComponent } from '@modules/shared/components';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentChannelDataModel } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CHART_COLORS } from 'app/constants';
import { ChannelListEvent, CustomSDKEvent } from 'app/interfaces';
import { intervalToDuration } from 'date-fns';
import { formatDuration } from 'app/utils/';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
type Dataset = { category: string; value: number };

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
    @Input() data: TwAhtTc;

    /**
     * Widget Maximized status
     */
    maximized = false;

    multiColors = multiColors;

    /**
     * Interaction list
     */
    interactionList: AgentChannelDataModel[] = [];

    allData$: BehaviorSubject<{ name: string; data: Dataset[] }[]> = new BehaviorSubject([]);

    /**
     * Stores chart data
     */
    chartData$: Observable<{ name: string; data: Dataset[] }[]>;

    /**
     * Ad table's component ref
     */
    @ViewChild(TableComponent) table: TableComponent;
    
    constructor(private _tmacEventService: TMACEventService,
        private translocoService: TranslocoService) {
        super('TwAhtTcComponent');
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.data.Data.Label = this.data.Data.Label ?? true;

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
                langCode: 'tableFields_common.AHTTransferConference.Channel',
                tooltip: true,
                icon: (el: any) => ({
                    name: iconMap[el.Channel?.toLowerCase()] || 'feed',
                    only: true
                })
            },
            AverageHandleTime: { 
                langCode: 'tableFields_common.AHTTransferConference.AHT',
                title: 'AHT' 
            },
            Transfer: {
                langCode: 'tableFields_common.AHTTransferConference.Transfer'
            },
            Conference: {
                langCode: 'tableFields_common.AHTTransferConference.Conference'
            }
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
        this.interactionList = evt.Data?.Channels || [];
        // format the incoming evt data
        this.table.source.data = this.interactionList.map(({ AverageActiveTime, AverageHoldTime, Channel, Transfer, Conference }) => {
            return {
                Channel,
                Transfer,
                Conference,
                AverageHandleTime: formatDuration(intervalToDuration({ start: 0, end: (AverageActiveTime + AverageHoldTime) * 1000 }))
            };
        });
    }

    /**
     * TeamChannelListEvent handler
     * @param {CustomSDKEvent} evt
     */
    TeamChannelListEvent(evt: CustomSDKEvent<ChannelListEvent>): void {
        const dataset = evt.Data.Channels.reduce((acc, curr) => {
            const ahtValue = (curr.AverageActiveTime || 0) + (curr.AverageHoldTime || 0);
            const ahtStat = {
                category: `${curr.Channel} [${formatDuration(intervalToDuration({ start: 0, end: ahtValue * 1000 }))}] (AHT)`,
                value: ahtValue
            };
            const transferStat = {
                category: `${curr.Channel} (Transfer / Conference)`,
                value: (curr.Transfer || 0) + (curr.Conference || 0)
            };

            // add aht value only if the value is above zero
            if (ahtStat.value) {
                if (!acc['AHT']) {
                    acc['AHT'] = [];
                }
                acc['AHT'].push(ahtStat);
            }

            // add transfer value only if the value is above zero
            if (transferStat.value) {
                if (!acc['Transfer / Conference']) {
                    acc['Transfer / Conference'] = [];
                }
                acc['Transfer / Conference'].push(transferStat);
            }
            return acc;
        }, {});

        const allData = Object.entries(dataset)
            // convert list to valid chart json
            .reduce((acc, curr) => {
                const [name, data] = curr;
                acc.push({ name, data });
                return acc;
            }, [])
            // sort data based on the length of the data in dataset so that the dataset with most varied data is in the
            // outermost part of the chart, so that most of the labels are visible
            .sort((prev, next) => {
                return prev.data.length - next.data.length;
            });

        this.allData$.next(allData);

        if (!this.chartData$) {
            this.chartData$ = this.allData$.pipe(
                takeUntil(this.unsubscribeAll),
                map((ds) => (this.maximized ? ds : ds.map((d) => ({ name: d.name, data: d.data.slice(0, this.data.Data.Limit || 5) }))))
            );
        }
    }

    labelContent = (e: { category: string }): string => {
        // remove (AHT) and (Transfer / Conference) from the labels
        return e.category.replace(/\(AHT\)|\(Transfer \/ Conference\)/, '');
    };
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
