import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TableComponent } from '@modules/shared/components';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomSDKEvent } from 'app/interfaces';
import { format } from 'date-fns';
import { orderBy } from 'lodash';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Agent Interactions details Table widget
 */
@Component({
    selector: 'tw-ad-interaction-details',
    templateUrl: './tw-ad-interaction-details.component.html',
    styleUrls: ['./tw-ad-interaction-details.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAdInteractionDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * app config data
     */
    @Input() data: any;

    /**
     * Minimized displayed columns
     */
    minDisplayedColumns: string[] = ['Channel', 'Direction', 'User', 'CreatedDateTime'];

    /**
     * Maximized displayed columns
     */
    maxDisplayedColumns: string[] = [
        'Channel',
        'SubChannel',
        'Direction',
        'User',
        'Dnis',
        'Intent',
        'CreatedDateTime',
        'ClosedDateTime',
        'ActiveTime',
        'AgentComment'
    ];

    /**
     * Maximized state
     */
    maximized = false;

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * Table component ref
     */
    @ViewChild(TableComponent) table: TableComponent;

    constructor(private _tmacEventService: TMACEventService, private _appUIService: AppUiService, private _fuseFacadeService: FuseFacadeService) {
        super();
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this._tmacEventService
            .getNonInteractionEvents(['AgentInteractionDetailsEvent'])
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
        this.table.config = {
            Channel: {
                searchable: true,
                tooltip: true,
                icon: (el: any) => ({ name: iconMap[(el.Channel || '').toLowerCase()] || 'feed', only: true })
            },
            SubChannel: {
                searchable: true,
                tooltip: true,
                icon: (el: any) => ({ name: iconMap[(el.SubChannel || '').toLowerCase()] || 'feed', only: true })
            },
            Direction: {
                searchable: true,
                uppercase: true,
                icon: (el: any) => ({ name: iconMap[(el.Direction || '').toLowerCase()] || 'feed', color: 'accent' })
            },
            CreatedDateTime: {
                searchable: true,
                title: 'Created On',
                type: 'date'
            },
            ClosedDateTime: {
                searchable: true,
                title: 'Closed On',
                type: 'date'
            },
            AgentComment: {
                title: '',
                type: 'controls',
                value: (el: any) =>
                    el.AgentComment?.trim()
                        ? [
                              {
                                  title: 'View Comments',
                                  icon: 'notes'
                              }
                          ]
                        : []
            },
            User: {
                searchable: true,
                truncate: true,
                tooltip: true
            },
            Dnis: {
                title: 'DNIS',
                searchable: true,
                truncate: true,
                tooltip: true
            },
            Intent: {},
            ActiveTime: {
                value: (el: any) => el.ActiveTime
            }
        };
        this.table.sort = true;
        this.table.pagination = true;
        this.table.pageSizeOptions = [0, 5, 10].map((r) => r + 10);
    }

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * AgentInteractionDetailsEvent hanlder
     * @param {CustomSDKEvent} data
     */
    private AgentInteractionDetailsEvent(evt: CustomSDKEvent): void {
        let interactionList = [];
        // check if empty array then reset
        if (evt.Data.length) {
            interactionList = this.table.source.data.concat(evt.Data);
        }
        interactionList = orderBy(interactionList, 'CreatedDateTime', ['desc']);

        this.table.source.data = interactionList;
    }

    /**
     * Maximize event
     * @param {Boolean} state
     */
    maximizeEvent(state: boolean): void {
        this.maximized = state;

        if (state) {
            // this.table.columns = this.maxDisplayedColumns;
            this.setupAdTable();
        } else {
            this.table.advancedSearchForm = {};
            this.table.doAdvancedSearch();
            // this.table.columns = this.minDisplayedColumns;
            // this.table.source.paginator.pageSize = 20;
            // this.table.source.paginator.firstPage();
        }
    }

    /**
     * To show agent notes
     *
     * @param notes
     */
    showNotes(notes: string): void {
        let message = notes;
        let otherData = {
            messageClasses: 'twd-whitespace-pre-line'
        };
        try {
            const jsonMessage = JSON.parse(notes);
            message = '';
            otherData = null;
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
        } catch (error) {
            message = notes;
        }
        this._appUIService.showCustomDialog('alert', message, 'Interaction Comments', otherData, {
            minWidth: '30%',
            maxWidth: '30%'
        });
    }

    handleActions(evt: any): void {
        console.log(evt);
    }
}
