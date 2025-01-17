import { TwDeflectToDigital } from '@ad/types';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TextTemplatesComponent } from '@modules/shared/components';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { ADError, getValueFromEvent, throwADError } from 'app/utils';
import { takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AGENT_FEATURES } from 'app/constants';
import { FormControl } from '@angular/forms';
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
    // @Input() data: IWidget<any, WidgetData>;
    @Input() data: TwDeflectToDigital;
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
     * selected send type
     */
    sendType:FormControl = new FormControl();

    /**
     * customer email id to send a notification 
     */
    emailId:FormControl = new FormControl();


    /**
     * Text template componet ref
     */
    @ViewChild(TextTemplatesComponent)
    textTemplatesRef: TextTemplatesComponent;
    IsDeflectToDigitalEditTextMessageEnabled: boolean = false;

    sendTypeList: {
        name: string;
        value: string;
    }[];
    /**
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService, private _appUIService: AppUiService,
        private translocoService: TranslocoService, private _agentFeaturesService: AgentFeaturesService) {
        super('TwDeflectToDigitalComponent');

        /**
     * Types of sending notification
     */
    this.sendTypeList = [
        {
            name: this.translocoService.translate('widgets.deflectToDigital.typeSMS'),
            value: "sms"
        },
        {
            name: this.translocoService.translate('widgets.deflectToDigital.typeEmail'),
            value: "email"
        }
    ];
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.initWrapper(this.data);

        this.interactionId = this.data.InteractionDetails?.InteractionID;

        // check if number to be taken from TMAC event
        if (!this.data.Data.Number?.toLowerCase().includes('event')) {
            return;
        }
        // setting default value for type is SMS
        this.sendType.setValue(this.sendTypeList[0].value);

        const eventName = this.data.Data.Number?.split('.')?.shift() as any;
        this._agentFeaturesService.features.pipe(takeUntil(this.unsubscribeAll)).subscribe((change: boolean) => {
            if (change) {
                // check agent features
                this.checkAgentFeatures();
            }
        });
        this.checkAgentFeatures();
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
        let snackbarRef;
        try {
            // check if any interaction is present
            if (!this.interactionId) {
                return;
            }

            if(this.sendType.value === 'sms' && !this.toNumber) {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.deflectToDigital.toFieldRequiredMsg'), 'failure');
                    return;
            }

            if(this.sendType.value === 'email' && this.emailId.invalid) {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.deflectToDigital.emailIdNotFound'), 'failure');
                return;
            }

            snackbarRef = this._appUIService.showSnackbar(this.translocoService.translate('widgets.deflectToDigital.deflectLoading'), 'loading');
            const res = await SDKClient.deflectToDigital({
                interactionId: this.interactionId.toString(),
                customerContact: this.getCustomerContact(),
                templateMessage: template,
                comment: this.comment,
                additionalParams: JSON.stringify({
                    sendType: this.sendType.value
                }),
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
            snackbarRef?.dismiss();
            if (res.response.ResultCode < 0) {
                throwADError('SDKClient.deflectToDigital failed', res.response.ResultMessage);
            }
            this.textTemplatesRef.clearAllData();
            this._appUIService.showSnackbar(res.response.ResultMessage);
        } catch (e) {
            snackbarRef?.dismiss();
            console.error(e);
            if (e instanceof ADError) {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.deflectToDigital.deflectError') + e.message, 'failure');
            } else {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.deflectToDigital.deflectFailed'), 'failure');
            }
        }
    }

    /**
     * To get customer contact detail based on the send type selected
     */
    private getCustomerContact() {
        switch(this.sendType.value) {
            case 'email':  
                return this.emailId.value;
            case 'sms':
            default: 
                return this.toNumber
        }
    }

    /**
     * To check agent features for IsDeflectToDigitalEditTextMessageEnabled
     */
    private checkAgentFeatures(): void {
        try {

            const featureDetails = SDKClient.getAgentData().featuresList.filter(
                (f) => 
                f.Feature.toLowerCase() === AGENT_FEATURES.IsDeflectToDigitalEditTextMessageEnabled.toLowerCase()
            );
            console.log("IsDeflectToDigitalEditTextMessageEnabled", featureDetails)
            if(featureDetails.length == 1)
            {
                console.log("IsDeflectToDigitalEditTextMessageEnabled featureDetails.length", featureDetails[0].IsEnabled)
                this.IsDeflectToDigitalEditTextMessageEnabled = featureDetails[0].IsEnabled;
            }
            else
            {
                console.log("IsDeflectToDigitalEditTextMessageEnabled EditAllowed", this.data.Data.EditAllowed)
                this.IsDeflectToDigitalEditTextMessageEnabled = this.data.Data.EditAllowed;
            }
        } catch (error) {}
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