import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import * as _ from 'lodash';
import { join } from 'lodash';
import { IUIEvent, SDKClient, TextChatRemoteUserConnectedEvent, CallerIntentEvent, IncomingCallEvent, IVRDataEvent, UUIDataEvent, CCLDataEvent, OutgoingCallEvent } from 'tmac-sdk';

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

    constructor(private _tmacEventService: TMACEventService) {
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
        const eventBag = this._tmacEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        // register to tmac events
        SDKClient.events.on('IncomingCallEvent', this.IncomingCallEvent);
        SDKClient.events.on('OutgoingCallEvent', this.OutgoingCallEvent);
        SDKClient.events.on('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.on('IVRDataEvent', this.IVRDataEvent);
        SDKClient.events.on('UUIDataEvent', this.UUIDataEvent);
        SDKClient.events.on('CCLDataEvent', this.CCLDataEvent);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // deregister from tmac events
        SDKClient.events.off('IncomingCallEvent', this.IncomingCallEvent);
        SDKClient.events.off('OutgoingCallEvent', this.OutgoingCallEvent);
        SDKClient.events.off('TextChatRemoteUserConnectedEvent', this.TextChatRemoteUserConnectedEvent);
        SDKClient.events.off('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.off('IVRDataEvent', this.IVRDataEvent);
        SDKClient.events.off('UUIDataEvent', this.UUIDataEvent);
        SDKClient.events.off('CCLDataEvent', this.CCLDataEvent);
    }

    private IncomingCallEvent = (evt: IncomingCallEvent) => {
        this.processCustomerDetails(evt);
    }

    private OutgoingCallEvent = (evt: OutgoingCallEvent) => {
        this.processCustomerDetails(evt);
    }

    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        this.processCustomerDetails(evt);
    }

    private CallerIntentEvent = (evt: CallerIntentEvent) => {
        this.processCustomerDetails(evt);
    }

    private IVRDataEvent = (evt: IVRDataEvent) => {
        this.processCustomerDetails(evt);
    }

    private UUIDataEvent = (evt: UUIDataEvent) => {
        this.processCustomerDetails(evt);
    }

    private CCLDataEvent = (evt: CCLDataEvent) => {
        this.processCustomerDetails(evt);
    }

    private processCustomerDetails = (evt: IUIEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

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
