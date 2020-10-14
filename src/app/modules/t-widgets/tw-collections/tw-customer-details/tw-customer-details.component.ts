import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { join, get } from 'lodash';
import { IUIEvent, SDKClient, TextChatRemoteUserConnectedEvent, CallerIntentEvent, IncomingCallEvent, IVRDataEvent, UUIDataEvent, CCLDataEvent, OutgoingCallEvent } from 'tmac-sdk';

/**
 * Custommer details widget
 */
@Component({
    selector: 'tw-customer-details',
    templateUrl: './tw-customer-details.component.html',
    styleUrls: ['./tw-customer-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomerDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config data
     */
    @Input() data: any;

    /**
     * Current interaction data
     */
    interactionId: number;
    /**
     * Customer info
     */
    customerInfo: CustomerInfo[] = [];
    /**
     * Value source
     */
    valueSource: string[] = [];

    /**
     * Maximised event emitter
     */
    @Output() maximizeEvent = new EventEmitter();
    /**
     * Float event emitter
     */
    @Output() floatEvent = new EventEmitter();
    /**
     * Collapsed event emitter
     */
    @Output() collapseEvent = new EventEmitter();

    constructor(private _tmacEventService: TMACEventService) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        // get the customer info config
        this.customerInfo = [...this.data.Data.CustomerInfo] || [];

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


    /**
     * Lifecycle hook
     * @method
     */
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


    /**
     * IncomingCallEvent handler
     * @param {IncomingCallEvent} evt 
     */
    private IncomingCallEvent = (evt: IncomingCallEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * OutgoingCallEvent handelr
     * @param {OutgoingCallEvent} evt 
     */
    private OutgoingCallEvent = (evt: OutgoingCallEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * TextChatRemoteUserConnectedEvent Handler
     * @param {TextChatRemoteUserConnectedEvent} evt 
     */
    private TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * CallerIntentEvent handler
     * @param {CallerIntentEvent} evt 
     */
    private CallerIntentEvent = (evt: CallerIntentEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * IVRDataEvent Handler
     * @param {IVRDataEvent} evt 
     */
    private IVRDataEvent = (evt: IVRDataEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * UUIDataEvent Handelr
     * @param {UUIDataEvent} evt 
     */
    private UUIDataEvent = (evt: UUIDataEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * CCLDataEvent Handler
     * @param {CCLDataEvent} evt 
     */
    private CCLDataEvent = (evt: CCLDataEvent) => {
        this.processCustomerDetails(evt);
    }

    /**
     * IUIEvent Handelr
     * @param {IUIEvent} evt 
     */
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
            item.Value = get(evt, valueMap, item.DefaultValue);
        });
    }
}

/**
 * Customer info Model
 */
export interface CustomerInfo {
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
