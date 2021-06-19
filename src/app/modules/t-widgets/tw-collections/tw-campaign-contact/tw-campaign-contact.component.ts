import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { GenericInteractionEvent, IncomingCallEvent, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { IWidget } from 'app/interfaces';
import { getValueFromJson } from 'app/utils';
import { firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Campaign Contact Component
 */
@Component({
    selector: 'tw-campaign-contact',
    templateUrl: './tw-campaign-contact.component.html',
    styleUrls: ['./tw-campaign-contact.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCampaignContactComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * To store entire app config and get update
     */
    appConfig: any;

    /**
     * ID of interaction
     */
    interaction: IncomingCallEvent | GenericInteractionEvent;

    /**
     * Campaign contact data
     */
    contactData = {
        data: null,
        loading: true,
        errorMessage: ''
    };

    /**
     * Customer infor t
     */
    customerInfo: CustomerInfo[];

    constructor(private _appDataService: AppDataService, private _appUIService: AppUiService, private _tmacEventService: TMACEventService) {
        super();
    }

    /**
     * On Init
     */
    async ngOnInit(): Promise<void> {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get interaction id
        this.interaction = this.data.InteractionDetails;

        // get the customer info config
        this.customerInfo = this.data.Data.CustomerInfo ?? [];

        // check if its an interaction
        if (this.interaction) {
            // create event names to subscribe
            const eventNames = [];

            this.customerInfo.forEach((c) => {
                try {
                    // get the event name
                    const eventName = c.ValueSource?.split('.')?.shift();
                    // push to eventNames
                    if (eventName && !eventNames.includes(eventName)) {
                        eventNames.push(eventName);
                    }
                } catch (error) {
                    TUtils.Logger.console('error', 'Error in TwCustomerDetailsComponent', null, error);
                }
            });

            // register to tmac events
            this._tmacEventService
                .getInteractionEvents(eventNames, this.interaction.InteractionID)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) =>
                    evts.forEach((evt) => {
                        this.processCustomerDetails(evt);
                    })
                );
        }

        // get TCM client web service url from config
        const appConfig = await firstValueFrom(
            this._appDataService.getConfig({ tcmUrl: 'Main.Urls.TCMClient' }).pipe(takeUntil(this.unsubscribeAll))
        );

        // get the url
        const tcmClientUrl = appConfig?.tcmUrl;

        // check if we got the url
        if (!tcmClientUrl) {
            return;
        }

        let phone = '7012765814';
        let fromAddr = '';
        let ucid = '';
        let skill = '';
        let contactId = '';

        let urlPath = '';

        // check the interaction whether its voice or generic
        if (this.interaction as IncomingCallEvent) {
            const interaction = this.interaction as IncomingCallEvent;
            if (interaction.SubType.toLowerCase() === 'camp') {
                // get the subtype data
                const subTypeData = typeof interaction.SubTypeData === 'object' ? JSON.parse(interaction.SubTypeData) : interaction.SubTypeData;

                fromAddr = subTypeData.fromAddress ?? subTypeData;
                ucid = interaction.UCID;
                skill = interaction.Queue;
            }
        } else if (this.interaction as GenericInteractionEvent) {
            const interaction = this.interaction as GenericInteractionEvent;

            phone = interaction.Item.PhoneNumber;
            skill = interaction.Item.Skill;
            contactId = interaction.Item.ID;
        }

        const { agentId, deviceId } = SDKClient.getAgentData();

        let requestArgs = {
            agentID: agentId,
            extension: deviceId,
            ucid: ucid,
            skill: skill
        } as any;

        if (contactId) {
            // to get customer contact data by contact id
            urlPath = '/GetCustomerContactDataByContactId';
            requestArgs = {
                ...requestArgs,
                contactId
            };
        } else if (phone) {
            // to get customer contact data by phone number
            urlPath = '/GetCustomerContactDataByPhoneNumber';
            requestArgs = {
                ...requestArgs,
                phone
            };
        } else if (fromAddr && this.interaction.InteractionID) {
            // to get customer contact data by fromAddr and interaction id
            urlPath = '/GetCustomerContactInteractionData';
            requestArgs = {
                ...requestArgs,
                fromAddr: fromAddr,
                interactionid: this.interaction.InteractionID
            };
        } else if (fromAddr) {
            // to get customer contact data by fromAddr
            urlPath = '/GetCustomerContactData';
            requestArgs = {
                ...requestArgs,
                fromAddr: fromAddr
            };
        }

        const result: IResponse = await TUtils.HttpClient.sendRequest({
            urls: [tcmClientUrl + urlPath],
            requestArgs,
            header: {
                'Content-Type': 'application/json'
            },
            responseType: 'json',
            method: 'POST',
            log: true
        });

        this.contactData.loading = false;

        // check for valid response from server
        if (!result || !result.response) {
            this._appUIService.showSnackbar('Unable to reach fetch contact information', 'failure');
            this.contactData.errorMessage = 'Unable to reach fetch contact information';
        }

        // store the data
        this.contactData.data = result.response.d ? JSON.parse(result.response.d) : null;

        this.processCustomerDetails({
            EventName: 'ContactData',
            ...this.contactData.data
        });
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To do rest call to TCM
     */
    restCall(): void {}

    /**
     * IUIEvent Handelr
     * @param {Any} data
     */
    private processCustomerDetails = (evt: any) => {
        // check if customer info map is available in this event
        this.customerInfo.forEach((item: CustomerInfo) => {
            // check if value is added, then ignore
            if (item.Value) {
                return;
            }
            // get the value source
            const valueSource = item.ValueSource;
            let valueSourceSplit = [];
            // check if we need to parse the json
            if (valueSource.toLowerCase().includes('jsonparse')) {
                // expected value = jsonparse(EventName.{...path}).getValue
                // get the path by taking string between ()
                const path = valueSource.substring(valueSource.lastIndexOf('(') + 1, valueSource.lastIndexOf(')'));

                if (path) {
                    // split the value source
                    valueSourceSplit = path.split('.');
                    // check if the value source event name matches with the current event
                    if (valueSourceSplit[0] !== evt.EventName) {
                        return;
                    }

                    // get the value from path
                    const jsonStr = getValueFromJson(valueSourceSplit, evt, '');

                    if (jsonStr) {
                        // get the property by taking string between ) and last
                        const prop = valueSource.substring(valueSource.lastIndexOf(')') + 2, valueSource.length);

                        item.Value = JSON.parse(jsonStr)[prop] ?? '';
                    }
                }
            } else {
                valueSourceSplit = item.ValueSource.split('.');
                // check if the value source event name matches with the current event
                if (valueSourceSplit[0] !== evt.EventName) {
                    return;
                }

                // get the value from path or default value
                item.Value = getValueFromJson(valueSourceSplit, evt, item.DefaultValue);
            }
        });
    };
}

/**
 * Customer info Model
 */
interface CustomerInfo {
    /**
     * Title
     */
    Title: string;
    /**
     * Value Source
     */
    ValueSource: string;
    /**
     * Value
     */
    Value?: string;
    /**
     * Unit
     */
    Unit: string;
    /**
     * Default Value
     */
    DefaultValue: string;
}
