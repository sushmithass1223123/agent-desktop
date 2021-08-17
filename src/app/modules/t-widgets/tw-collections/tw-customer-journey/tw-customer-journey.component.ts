// import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TableComponent } from '@modules/shared/components';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    IGetInteractionHistory,
    InteractionHistory,
    InteractionHistoryEvent,
    InteractionHistoryOnDemandEvent,
    InteractionHistoryReadyEvent,
    InteractionHistoryReLoadEvent,
    SDKClient
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget, ResData } from 'app/interfaces';
import { maticonByExtension, throwADError } from 'app/utils';
import { format, parse } from 'date-fns';
import { groupBy, orderBy, sortBy } from 'lodash';
import { from, of } from 'rxjs';
import { catchError, filter, map, share, takeUntil, tap } from 'rxjs/operators';

type Mode = 'Session History' | 'Comments' | 'Actions' | 'Transcripts' | 'Email Preview' | 'Session Emails' | null;

type IHRecord = {
    InteractionDate: string;
    Channel: string;
    Intent: string;
    AgentName: string;
    CIF: string;
    EmailID: string;
    NRIC: string;
    PhoneNumber: string;
    OverallSentiment: string;
    ItemID: string;
    SubType: string;
    SessionID: string;
    Direction: string;
    ID: string;
    GroupID: string;
    LastID: string;
    InteractionText: string;
    Children: IHRecord[];
    expanded: boolean;
};

/**
 * Customer journey component
 * Shows up during interactions
 * timeline when minimized and Table when maximised
 */
@Component({
    selector: 'tw-customer-journey',
    templateUrl: './tw-customer-journey.component.html',
    styleUrls: ['./tw-customer-journey.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerJourneyComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * Input data from app config json
     */
    @Input() data: IWidget<any, WidgetData>;

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * Default customer name
     */
    defaultCustomerName = 'Customer';

    /**
     * File upload urls
     */
    fileUploadUrl$ = this._appDataService.config.pipe(
        takeUntil(this.unsubscribeAll),
        map((conf: any) => conf.Main.Urls?.FileServerUrl?.MediaProxy)
    );

    /**
     * Wrapper component Ref
     */
    @ViewChild(TwWrapperComponent) wrapperComponent: TwWrapperComponent;

    /**
     * Current interaction Id
     */
    interactionId: number;

    /**
     * History params to fetch data
     */
    historyParams: IGetInteractionHistory;

    /**
     * Widget maximzed event
     */
    @Output() maximizeEvent = new EventEmitter();

    /**
     * Maximized flag
     */
    maximized: boolean;

    /**
     * Expanded row configuration
     */
    expanded: {
        /**
         * Mode of the expanded value
         */
        mode: Mode;
        /**
         * Value of expanded row
         */
        value: SafeResourceUrl | ResData<any>;
    } = null;

    /**
     * Ad-table's mat table for pagination
     */
    @ViewChild(TableComponent) table: TableComponent;

    /**
     *
     * @param _fuseFacadeService
     * @param _tmacEventService
     * @param sanitizer
     * @param _appUIService
     * @param _appDataService
     * @param matDialog
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private _tmacEventService: TMACEventService,
        private sanitizer: DomSanitizer,
        private _appUIService: AppUiService,
        private _appDataService: AppDataService,
        private matDialog: MatDialog
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        this.historyParams = {
            cif: '',
            email: '',
            nric: '',
            phone: '',
            noOfRecords: this.data.Data.NoOfRecords.toString(),
            lastId: '0'
        };

        this._tmacEventService
            .getInteractionEvents(
                ['InteractionHistoryReadyEvent', 'InteractionHistoryEvent', 'InteractionHistoryOnDemandEvent', 'InteractionHistoryReLoadEvent'],
                this.interactionId
            )
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * Lifecycle hook
     */
    ngAfterViewInit(): void {
        this.setupAdTable();
    }

    /**
     * Sets up the new AD table component
     */
    setupAdTable(): void {
        if (this.data.Data.Columns && this.data.Data.Columns.length) {
            this.table.columns = this.data.Data.Columns;
        } else {
            this.table.columns = [
                'InteractionDate',
                'Channel',
                'Direction',
                'InteractionText',
                'Intent',
                'AgentName',
                'CIF',
                'NRIC',
                'PhoneNumber',
                'EmailID',
                'OverallSentiment',
                'Actions'
            ];
        }

        const iconMap = {
            default: 'feed',
            textchat: 'chat',
            audiochat: 'wifi_calling_3',
            voice: 'phone',
            sms: 'sms',
            videochat: 'duo',
            email: 'email',
            fax: 'print',
            chat: 'chat',
            text: 'chat',
            audio: 'wifi_calling_3',
            video: 'duo',
            whatsapp: 'custom-whatsapp',
            we: 'custom-we',
            line: 'custom-line',
            viber: 'custom-viber',
            twitter: 'custom-twitter',
            fb: 'custom-fb',
            telegram: 'custom-telegram',
            store: 'store',
            in: 'south',
            out: 'north'
        };
        const iconKey = ['textchat', 'audiochat', 'videochat', 'services'];
        const noOfRecords = this.data.Data.NoOfRecords;

        this.table.config = {
            Channel: {
                searchable: true,
                tooltip: true,
                icon: (el: any) => {
                    const channel = el.Channel?.toLowerCase();
                    const subChannel = el.SubType?.toLowerCase();
                    return {
                        name: iconMap[iconKey.includes(channel) ? subChannel : channel] || 'feed',
                        only: true
                    };
                }
            },
            InteractionText: {
                title: 'Interaction Text',
                searchable: true,
                truncate: true,
                tooltip: true
            },
            InteractionDate: {
                title: 'Received At',
                searchable: true,
                type: 'date'
            },
            Direction: {
                uppercase: true,
                searchable: true,
                icon: (el: any) => ({ name: iconMap[(el.Direction || '').toLowerCase()] || 'feed', color: 'accent' })
            },
            Intent: {},
            AgentName: {
                title: 'Agent Name',
                searchable: true,
                truncate: true
            },
            CIF: {
                searchable: true
            },
            NRIC: {
                searchable: true
            },
            PhoneNumber: {
                title: 'Phone Number',
                searchable: true
            },
            EmailID: {
                title: 'Email',
                searchable: true,
                truncate: true
            },
            OverallSentiment: {
                title: 'Sentiment'
            },
            Actions: {
                title: '',
                width: '4%',
                type: 'controls',
                value: [
                    {
                        title: 'Session History',
                        icon: 'history'
                    },
                    {
                        title: 'Actions',
                        icon: 'list_alt'
                    },
                    {
                        title: 'Comments',
                        icon: 'notes'
                    },
                    {
                        title: 'Transcripts',
                        icon: 'chat',
                        visible: (element: any) => (element.Channel || '').toLowerCase().includes('chat')
                    },
                    {
                        title: 'Email Preview',
                        icon: 'email',
                        visible: (element: any) => (element.Channel || '').toLowerCase().includes('email')
                    }
                ]
            }
        };

        this.table.pageSizeOptions = [0, 5, 10].map((r) => r + noOfRecords);
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Gets interaction history and sets to table
     */
    private getInteractionHistory(noOfRecords = (this.table.pageSizeOptions[0] || parseInt(this.historyParams.noOfRecords, 10)).toString()): void {
        if (!this.historyParams.lastId) {
            this.table.loading = true;
        }
        SDKClient.getInteractionHistory({ ...this.historyParams, noOfRecords }, null)
            .then((res) => {
                if (!res.response) {
                    throw new Error('Invalid response from server');
                }
                if (res.response.length) {
                    this.processHistoryData(res.response, true);
                }
            })
            .catch((err) => {
                this.table.loading = false;
                console.error(err);
            })
            .finally(() => {
                this.table.loading = false;
            });
    }

    /**
     * To process history data
     *
     * @param {InteractionHistory[]} historyData
     * @param {Boolean} update
     */
    processHistoryData(historyData: InteractionHistory[], update?: boolean): void {
        const tableData: Record<string, IHRecord> = {};
        let sortedTabledata = [];
        sortedTabledata = sortBy(historyData, 'ItemID').reverse();
        sortedTabledata.forEach((data) => {
            if (!(data.InteractionDate instanceof Date)) {
                data.InteractionDate = parse(data.InteractionDate, 'dd/M/yyyy HH:mm:ss', new Date());
            }
            if (!tableData[data.GroupID]) {
                tableData[data.GroupID] = {
                    InteractionDate: data.InteractionDate,
                    Channel: data.Channel,
                    Intent: data.Intent,
                    AgentName: data.AgentName,
                    CIF: data.CIF,
                    EmailID: data.EmailID,
                    NRIC: data.NRIC,
                    PhoneNumber: data.PhoneNumber,
                    OverallSentiment: data.OverallSentiment,
                    ItemID: data.ItemID,
                    SubType: data.SubType,
                    SessionID: data.SessionID,
                    Direction: data.Direction,
                    ID: data.ID,
                    GroupID: data.GroupID,
                    LastID: data.LastID,
                    InteractionText: data.InteractionText,
                    Children: [],
                    expanded: false
                };
            } else {
                const Children = tableData[data.GroupID].Children;
                Children.push({ ...tableData[data.GroupID], Children: null });
                tableData[data.GroupID] = {
                    InteractionDate: data.InteractionDate,
                    Channel: data.Channel,
                    Intent: data.Intent,
                    AgentName: data.AgentName,
                    CIF: data.CIF,
                    EmailID: data.EmailID,
                    NRIC: data.NRIC,
                    PhoneNumber: data.PhoneNumber,
                    OverallSentiment: data.OverallSentiment,
                    ItemID: data.ItemID,
                    SubType: data.SubType,
                    SessionID: data.SessionID,
                    Direction: data.Direction,
                    ID: data.ID,
                    GroupID: data.GroupID,
                    LastID: data.LastID,
                    InteractionText: data.InteractionText,
                    Children,
                    expanded: false
                };
            }
        });
        // order table data by received date
        if (!this.table.source.data) {
            this.table.source.data = [];
        }

        const newRecords = orderBy(Object.values(tableData), ['InteractionDate'], ['desc']);
        this.table.source.data = this.table.source.data.concat(newRecords);
        const lastEl = sortedTabledata.slice(-1) || [];
        this.historyParams.lastId = lastEl[0]?.LastID?.toString();
        this.table.loading = false;
        const pageOffset = this.table.source.data.length % parseInt(this.historyParams.noOfRecords, 10);
        const recordsIncompleteInFirstPage =
            this.table.source.data.length < this.table.pageSizeOptions[0] ? parseInt(this.historyParams.noOfRecords, 10) - pageOffset : 0;
        if (recordsIncompleteInFirstPage) {
            this.getInteractionHistory((recordsIncompleteInFirstPage + 1).toString());
        } else if (pageOffset === 0) {
            this.getInteractionHistory('1');
        }
    }

    /**
     * Handler for InteractionHistoryReadyEvent
     */
    InteractionHistoryReadyEvent(evt: InteractionHistoryReadyEvent): void {
        // check for the interaction
        if (this.interactionId !== evt.InteractionID) {
            return;
        }
        const noOfRecords = this.data.Data.NoOfRecords;
        // assign the history params
        this.historyParams = {
            cif: evt.HistoryParameters.CIF,
            email: evt.HistoryParameters.EmailID,
            nric: evt.HistoryParameters.NRIC,
            phone: evt.HistoryParameters.PhoneNumber,
            noOfRecords: noOfRecords.toString(),
            lastId: '0'
        };
        // get history
        this.getInteractionHistory();
    }

    /**
     * To process InteractionHistoryEvent
     *
     * @param {InteractionHistoryEvent} evt
     */
    InteractionHistoryEvent(evt: InteractionHistoryEvent): void {
        this.processHistoryData(evt.History, false);
    }

    /**
     * To process InteractionHistoryOnDemandEvent
     *
     * @param {InteractionHistoryOnDemandEvent} evt
     */
    InteractionHistoryOnDemandEvent(evt: InteractionHistoryOnDemandEvent): void {}

    /**
     * To process InteractionHistoryReLoadEvent
     *
     * @param {InteractionHistoryReLoadEvent} evt
     */
    InteractionHistoryReLoadEvent(evt: InteractionHistoryReLoadEvent): void {
        this.processHistoryData(evt.History, false);
    }

    /**
     * Material table pagination event
     */
    pageEvent(_evt: any): void {
        if (!this.table.source.paginator.hasNextPage()) {
            this.getInteractionHistory();
        }
    }

    /**
     * Get actions of selected sessionId
     * @param {String} sessionId selected Session Id
     */
    async getSessionActions(sessionId: string): Promise<void> {
        try {
            this.expanded.value = { loading: true, error: false };
            const res = await SDKClient.getInteractionActions(sessionId);
            this.expanded.value = {
                loading: false,
                error: false,
                data: res.response.map((x) => ({ ...x, ActionTime: new Date(parseInt(x.ActionTime.toString().split('(')[1].split(')')[0], 10)) }))
            };
        } catch (e) {
            this.expanded.value = { loading: false, error: true, msg: 'Unable to fetch session actions' };
            console.error(e);
        }
    }

    /**
     * To open sentiment dashboard for a session
     *
     * @param sessionId
     */
    openSentimentDashboard(sessionId: string): void {
        let url = this.data.Data.SentimentDashboardUrl;

        // verify the url
        if (!url) {
            this._appUIService.showSnackbar('Sentiment Dashboard Url is not configured!', 'failure');
            return;
        }

        url += `?/sessionid=${sessionId}&agentid=${SDKClient.getAgentData().agentId}`;

        window.open(
            url,
            'sentimentDashboard',
            `menubar=no,resizable=yes,location=no,scrollbars=no,
            width=${screen.width},
            height=${screen.height}`
        );
    }

    /**
     * On widget maximized
     */
    onMaximized(max: boolean): void {
        this.maximized = max;
        this.maximizeEvent.emit(max);
        if (max) {
            setTimeout(() => {
                this.table.source?.sort?.sort({ id: 'InteractionDate', start: 'desc', disableClear: true });
            }, 0);
        }
    }

    /**
     * Fetches interaction data and assings to this.interactionNotesReq.data
     * @param {InteractionHistory} record
     */
    async showInteractionData(record: IHRecord): Promise<void> {
        this.expanded.value = {
            loading: true,
            error: false,
            data: from(
                SDKClient.getInteractionData({
                    count: 10,
                    fromDate: '',
                    interactionId: '',
                    sessionId: record.SessionID,
                    toDate: '',
                    agentId: ''
                })
            ).pipe(
                map((res) =>
                    res.response
                        .filter((ih) => ih.AgentComment)
                        .map((ihF) => {
                            let message = `
                        <div class='twd-whitespace-pre-line'>
                        ${ihF.AgentComment}
                        </div>
                        `;
                            try {
                                const jsonMessage = JSON.parse(ihF.AgentComment);
                                message = '';
                                jsonMessage.forEach((item: any, index: number, array: []) => {
                                    message += `
                             <div class="text-primary mat-body-2">${item.Comment.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                             <span class="time muted-text mat-body-1">${item.User}</span>,
                             <span class="time muted-text mat-body-1">${format(new Date(item.Time), 'dd/MM/yyyy hh:mm:ss a')}</span>
                             `;
                                    // add space if there are multiple items
                                    if (index !== array.length - 1) {
                                        message += `
                                    <br />
                                    <br />
                                    `;
                                    }
                                });
                            } catch (error) {}
                            return message;
                        })
                ),
                tap(() => ((this.expanded.value as any).loading = false)),
                catchError((err) => {
                    console.error(err);
                    (this.expanded.value as any).error = true;
                    return of([]);
                }),
                share()
            )
        };
    }

    /**
     * Shows email thread for the session
     * @param record
     */
    async showEmailThread(interaction?: IHRecord): Promise<void> {
        if (!interaction) {
            interaction = this.table.source.data.find((x) => x.expanded);
        }
        this.expanded.value = {
            error: false,
            data: null,
            loading: true
        };

        const fetchFromOutbox = interaction.Direction === 'Out';

        const onSuccess = (res: any) => {
            if (!res.response) {
                this._appUIService.showSnackbar('Unable to fetch email', 'failure');
                throwADError('Error in TwCustomerJourneyComponent.showEmailThread', 'Unable to load Email');
                return;
            }
            // check if attachements are there
            if (res.response.Attachments && res.response.Attachments.length) {
                res.response.Files = res.response.Attachments.map((item: any) => {
                    // get the file name from URL
                    let name = item.URL.split('/').pop();
                    name = name.replace(item.SessionID, '');
                    item.Name = name;
                    item.Ext = name.split('.').pop();
                    item.Icon = maticonByExtension(item.Ext);
                    return item;
                });
            }
            delete res.response.Attachments;

            if (res.response.Body) {
                res.response.Body = this._appUIService.sanitizeEmailBody(res.response.Body)['changingThisBreaksApplicationSecurity'];
            }

            this.expanded.value = {
                data: res.response,
                loading: false,
                error: false
            };
        };

        const onFailure = (err: any) => {
            console.error(err);
            this.expanded.value = {
                msg: err,
                loading: false,
                error: true
            };
        };

        if (fetchFromOutbox) {
            SDKClient.getOutboxEmail(interaction.SessionID)
                .then((res) => onSuccess(res))
                .catch((err) => onFailure(err));
        } else {
            SDKClient.getInboxEmail(interaction.SessionID)
                .then((res) => onSuccess(res))
                .catch((err) => onFailure(err));
        }
    }

    /**
     * Switches Maximized View
     * @param {Mode} mode
     */
    switchMaximizedViewMode(mode: Mode, row: IHRecord): void {
        if (!this.maximized) {
            this.maximized = true;
            this.wrapperComponent.maximize();
        }
        if (this.expanded && (this.expanded.value as any)?.ID === row.ID && mode === this.expanded?.mode) {
            return;
        }
        this.expanded = { mode, value: row };
        switch (mode) {
            case 'Session History': {
                this.expanded.value = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.data.Data.IframeBaseUrl}${row.SessionID}`);
                break;
            }
            case 'Actions': {
                this.getSessionActions(row.SessionID);
                break;
            }
            case 'Transcripts': {
                this.expanded.value = row.Children.map(this.formatTranscript).concat(this.formatTranscript(row)).reverse();
                break;
            }
            case 'Comments': {
                this.showInteractionData(row);
                break;
            }
            case 'Email Preview': {
                this.showEmailThread(row);
                break;
            }
            case 'Session Emails': {
                break;
            }
        }
    }

    /**
     * To format transcript
     *
     * @param {IHRecord} data
     * @returns
     */
    private formatTranscript = (data: IHRecord) => {
        let msg: any = data.InteractionText.replace(/^T\[.*?]:/, '');
        try {
            msg = JSON.parse(msg);
        } catch (e) {
            msg = {
                type: 'text',
                message: msg
            };
        }
        return {
            who: data.Direction === 'Out' ? data.AgentName : this.defaultCustomerName,
            isAgent: data.Direction === 'Out',
            message: msg,
            time: data.InteractionDate,
            type: data.SubType,
            messageId: data.ItemID
        };
    };

    /**
     * Groups table data
     * @param tableData
     * @param row
     * @param groupId
     */
    groupTable(response: any[], groupId: string, sortId: string, groupChildrenBy?: string, sortChildrenBy?: string): any[] {
        const records = response.map((data) => ({
            InteractionDate: data.InteractionDate,
            Channel: data.Channel,
            Intent: data.Intent,
            AgentName: data.AgentName,
            CIF: data.CIF,
            EmailID: data.EmailID,
            NRIC: data.NRIC,
            PhoneNumber: data.PhoneNumber,
            OverallSentiment: data.OverallSentiment,
            ItemID: data.ItemID,
            SubType: data.SubType,
            SessionID: data.SessionID,
            Direction: data.Direction,
            ID: data.ID,
            GroupID: data.GroupID,
            LastID: data.LastID,
            InteractionText: data.InteractionText,
            Children: [],
            expanded: false
        }));
        const groupedRecordsById = groupBy(records, groupId);
        return sortBy(
            Object.entries(groupedRecordsById).reduce((firstRow, curr) => {
                let [, val] = curr;
                const tableRow = val.shift();
                if (groupChildrenBy) {
                    val = this.groupTable(val, groupChildrenBy, sortChildrenBy, '', 'messageId');
                }
                if (sortChildrenBy) {
                    val = sortBy(val, sortChildrenBy);
                }
                (tableRow as any).Children = val;
                firstRow.push(tableRow);
                return firstRow;
            }, []),
            sortId
        );
    }

    /**
     * Handles actions from ad-table
     * @param {any} evt
     */
    handleActions(evt: any): void {
        this.switchMaximizedViewMode(evt.action, evt.record);
        // this.selected = evt;
    }
}

interface WidgetData {
    /**
     * Customer session journey url
     */
    IframeBaseUrl: string;
    /**
     * No of records to load
     */
    NoOfRecords: number;
    /**
     * Sentiment dashboard url
     */
    SentimentDashboardUrl: string;
    /**
     * Columns to show
     */
    Columns: string[];
}
