import { TwAdInteractionDetails } from '@ad/types';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TableComponent } from '@modules/shared/components';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomSDKEvent } from 'app/interfaces';
import { format } from 'date-fns';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';

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
    @Input() data: TwAdInteractionDetails;

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
     * Fuse custom config
     */
    customFuse: any;

    /**
     * Table component ref
     */
    @ViewChild(TableComponent) table: TableComponent;

    /**
     * Agent comment ref
     */
    @ViewChild('agentCommentRef')
    agentCommentRef: TemplateRef<any>;

    constructor(
        private _tmacEventService: TMACEventService,
        private translocoService: TranslocoService,
        private _appUIService: AppUiService,
        private _fuseFacadeService: FuseFacadeService
    ) {
        super('TwAdInteractionDetailsComponent');
        this.customFuse = {
            anchor$: this._fuseFacadeService.anchorBgClasses$().pipe(filter(() => this.data?.Config?.Anchor)),
            widget$: this._fuseFacadeService.widgetBgClasses$()
        };
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
            whatsapp_infomedia: 'custom-whatsapp_infomedia',
            whatsapp_meta: 'custom-whatsapp_meta',
            instagram: 'custom-instagram',
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
                langCode: 'tableFields_common.InteractionDetails.Channel',
                searchable: true,
                tooltip: true,
                width: '120px',
                icon: (el: any) => ({ name: iconMap[(el.Channel || '').toLowerCase()] || 'feed', only: true })
            },
            SubChannel: {
                langCode: 'tableFields_common.InteractionDetails.SubChannel',
                searchable: true,
                tooltip: true,
                icon: (el: any) => ({ name: iconMap[(el.SubChannel || '').toLowerCase()] || 'feed', only: true })
            },
            Direction: {
                langCode: 'tableFields_common.InteractionDetails.Direction',
                searchable: true,
                uppercase: true,
                icon: (el: any) => ({ name: iconMap[(el.Direction || '').toLowerCase()] || 'feed', color: 'accent' })
            },
            CreatedDateTime: {
                langCode: 'tableFields_common.InteractionDetails.CreatedDateTime',
                searchable: true,
                title: this.translocoService.translate('widgets.adInteractionDetails.CreatedDateTime'),
                type: 'date'
            },
            ClosedDateTime: {
                langCode: 'tableFields_common.InteractionDetails.ClosedDateTime',
                searchable: true,
                title: this.translocoService.translate('widgets.adInteractionDetails.ClosedDateTime'),
                type: 'date'
            },
            AgentComment: {
                langCode: 'tableFields_common.InteractionDetails.AgentComment',
                title: 'Comments',
                searchable: true,
                custom: this.agentCommentRef
            },
            User: {
                langCode: 'tableFields_common.InteractionDetails.User',
                searchable: true,
                truncate: true,
                tooltip: true
            },
            Dnis: {
                langCode: 'tableFields_common.InteractionDetails.Dnis',
                searchable: true,
                truncate: true,
                tooltip: true
            },
            Intent: {
                langCode: 'tableFields_common.InteractionDetails.Intent',
                searchable: true
            },
            ActiveTime: {
                langCode: 'tableFields_common.InteractionDetails.ActiveTime',
                value: (el: any) => el.ActiveTime
            }
        };
        this.table.sort = true;
        this.table.pagination = true;
        this.table.pageSizeOptions = [0, 5, 10].map((r) => r + 10);
        this.table.advancedSearch = true;
        this.table.sortBy = 'CreatedDateTime';
        this.table.sortDirection = 'desc';
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
        let interactionDetails = [];
        // check if empty array then reset
        if (evt.Data.length) {
            interactionDetails = this.table.source.data.concat(evt.Data);
        }
        this.table.source.data = interactionDetails;
    }

    /**
     * Maximize event
     * @param {Boolean} state
     */
    maximizeEvent(state: boolean): void {
        if (!state) {
            this.table.doAdvancedSearch();
            this.table.source.paginator.firstPage();
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

    /**
     * Control events from table
     * @param {any} evt
     */
    tableEvents(evt: any): void {
        this.showNotes(evt.record.AgentComment);
    }
}
