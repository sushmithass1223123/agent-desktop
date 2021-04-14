import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { get, join } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import {
    IUIEvent
} from 'tmac-sdk';

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
        this.customerInfo = this.data.Data.CustomerInfo;

        // register to tmac events
        this._tmacEventService.getInteractionEvents([
            'IncomingCallEvent',
            'OutgoingCallEvent',
            'TextChatRemoteUserConnectedEvent',
            'CallerIntentEvent',
            'UUIDataEvent',
            'CCLDataEvent'
        ], this.interactionId)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(evts => evts.forEach(evt => {
                this.processCustomerDetails(evt);
            }
            ));
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
     * IUIEvent Handelr
     * @param {IUIEvent} evt
     */
    private processCustomerDetails = (evt: IUIEvent) => {
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
