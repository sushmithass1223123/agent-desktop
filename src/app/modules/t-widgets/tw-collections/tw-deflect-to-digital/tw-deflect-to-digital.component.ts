import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TextTemplatesComponent } from '@modules/shared/components';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { ADError, getValueFromEvent, throwADError } from 'app/utils';
import { takeUntil } from 'rxjs/operators';
import { TwDeflectToDigital } from '@ad/types';

@Component({
    selector: 'tw-deflect-to-digital',
    templateUrl: './tw-deflect-to-digital.component.html',
    styleUrls: ['./tw-deflect-to-digital.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwDeflectToDigitalComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget<any, WidgetData>;

    /**
     * Application state
     */
    loading = false;

    /**
     * Interaction Id
     */
    interactionId: number;

    /**
     * Number to be sent to
     */
    toNumber = '';

    /**
     * Agents comment
     */
    comment = '';

    /**
     * Text template componet ref
     */
    @ViewChild(TextTemplatesComponent)
    textTemplatesRef: TextTemplatesComponent;

    /**
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService, private _appUIService: AppUiService) {
        super();
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.initWrapper(this.data);

        this.interactionId = this.data.InteractionDetails.InteractionID;

        // check if number to be taken from TMAC event
        if (!this.data.Data.Number?.toLowerCase().includes('event')) {
            return;
        }

        const eventName = this.data.Data.Number?.split('.')?.shift() as any;

        // register to tmac events
        if (eventName) {
            this._tmacEventService
                .getInteractionEvents([eventName], this.data.InteractionDetails.InteractionID)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) =>
                    evts.forEach((evt) => {
                        this.toNumber = getValueFromEvent(
                            {
                                DefaultValue: '',
                                Title: '',
                                ValueSource: this.data.Data.Number,
                                MaskData: null
                            },
                            evt
                        );
                    })
                );
        }
    }

    /**
     * Lifecycle hook
     */
    ngAfterViewInit(): void {
        const clearData = this.textTemplatesRef.clearAllData;

        this.textTemplatesRef.clearAllData = () => {
            this.comment = '';
            this.toNumber = '';
            clearData();
        };
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
     * Send selected template
     * @param {sendTemplate} template
     */
    async sendTemplate(template: string): Promise<void> {
        try {
            // check if any interaction is present
            if (!this.interactionId) {
                return;
            }

            this._appUIService.showSnackbar('Deflecting', 'loading');
            const res = await SDKClient.deflectToDigital({
                interactionId: this.interactionId.toString(),
                customerContact: this.toNumber,
                templateMessage: template,
                comment: this.comment,
                additionalParams: JSON.stringify({}),
                deflectExpiry: this.data.Data.DeflectExpiry,
                deflectIntent: this.data.Data.DeflectIntent,
                destChannel: this.data.Data.DestChannel,
                destSubChannel: this.data.Data.DestSubChannel,
                disconnectTimeout: this.data.Data.DisconnectTimeout,
                fallbackSkillId: this.data.Data.FallbackSkillId,
                nextStatusName: this.data.Data.NextStatusName,
                statusLockTimeout: this.data.Data.StatusLockTimeout,
                reservedStatusCode: this.data.Data.ReservedStatusCode
            });

            if (res.response.ResultCode !== 0) {
                throwADError('SDKClient.deflectToDigital failed', res.response);
            }
            this.textTemplatesRef.clearAllData();
            this._appUIService.showSnackbar('Deflected Successfully');
        } catch (e) {
            console.error(e);
            if (e instanceof ADError) {
                this._appUIService.showSnackbar('Unable to Deflect', 'failure');
            } else {
                this._appUIService.showSnackbar('Deflecting failed', 'failure');
            }
        }
    }
}

interface WidgetData {
    DeflectExpiry: number;
    DeflectIntent: string;
    DestChannel: string;
    DestSubChannel: string;
    DisconnectTimeout: number;
    FallbackSkillId: string;
    NextStatusName: string;
    StatusLockTimeout: number;
    ReservedStatusCode: string;
    Number: string;
}

// for more info visit - https://angular.io/api/core
