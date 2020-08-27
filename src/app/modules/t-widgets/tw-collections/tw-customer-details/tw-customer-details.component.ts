import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { SDKClient, TextChatRemoteUserConnectedEvent, IUIEvent, IncomingCallEvent } from 'tmac-sdk';
import { InteractionEventService } from '@services/interaction-event.service';
import { join } from 'lodash';
import * as _ from 'lodash';

@Component({
    selector: 'tw-customer-details',
    templateUrl: './tw-customer-details.component.html',
    styleUrls: ['./tw-customer-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    interactionId: number;
    customerInfo: CustomerInfo[] = [];
    valueSource: string[] = [];

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    constructor(
        private _interactionEventService: InteractionEventService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        // get the customer info config
        this.customerInfo = this.data.Data.CustomerInfo || [];

        // get the event from event bag to make sure no events are missed
        const eventBag = this._interactionEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        // register to tmac events
        SDKClient.events.on('TextChatRemoteUserConnectedEvent', this.CustomerDetailsEvent);
        SDKClient.events.on('IncomingCallEvent', this.CustomerDetailsEvent);
        SDKClient.events.on('CallerIntentEvent', this.CustomerDetailsEvent);
        SDKClient.events.on('IVRDataEvent', this.CustomerDetailsEvent);
        SDKClient.events.on('UUIDataEvent', this.CustomerDetailsEvent);
        SDKClient.events.on('CCLDataEvent', this.CustomerDetailsEvent);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // deregister from tmac events
        SDKClient.events.off('TextChatRemoteUserConnectedEvent', this.CustomerDetailsEvent);
        SDKClient.events.off('IncomingCallEvent', this.CustomerDetailsEvent);
        SDKClient.events.off('CallerIntentEvent', this.CustomerDetailsEvent);
        SDKClient.events.off('IVRDataEvent', this.CustomerDetailsEvent);
        SDKClient.events.off('UUIDataEvent', this.CustomerDetailsEvent);
        SDKClient.events.off('CCLDataEvent', this.CustomerDetailsEvent);
    }

    private CustomerDetailsEvent = (evt: IUIEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
        // check for this event customer info map is there
        this.checkForCustomerInfo(evt);
    }

    checkForCustomerInfo(evt: any): void {
        // check if customer info map is available in this event
        this.customerInfo.forEach((item: CustomerInfo) => {
            // split the value source
            const valueSourceSplit = item.ValueSource.split('.');
            // check if the value source event name matches with the current event
            if (valueSourceSplit[0] !== evt.EventName) {
                return;
            }
            // remove the event name from the array
            valueSourceSplit.shift();
            // map the property and get the value from event property
            const valueMap = join(valueSourceSplit, '.');

            // get the value from path or default value
            item.Value = _.get(evt, valueMap, item.DefaultValue);
        });
    }
}

export interface CustomerInfo {
    Title: string;
    ValueSource: string;
    Value?: string;
    Unit: string;
    DefaultValue: string;
}
