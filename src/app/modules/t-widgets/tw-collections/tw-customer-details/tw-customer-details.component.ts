import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import {
    IUIEvent, TUtils
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { get, join } from 'lodash';
import { takeUntil } from 'rxjs/operators';

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

        // create event names to subscribe
        const eventNames = [];

        this.customerInfo.forEach(c => {
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
            .getInteractionEvents(eventNames, this.interactionId)
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
                const path = valueSource.substring(
                    valueSource.lastIndexOf('(') + 1,
                    valueSource.lastIndexOf(')')
                );

                if (path) {
                    // split the value source
                    valueSourceSplit = path.split('.');
                    // check if the value source event name matches with the current event
                    if (valueSourceSplit[0] !== evt.EventName) {
                        return;
                    }

                    // get the value from path
                    const jsonStr = this.GetValueFromJson(valueSourceSplit, evt, '');

                    if (jsonStr) {
                        // get the property by taking string between ) and last
                        const prop = valueSource.substring(
                            valueSource.lastIndexOf(')') + 2,
                            valueSource.length);

                        item.Value = JSON.parse(jsonStr)[prop] ?? '';
                    }
                }
            }
            else {
                valueSourceSplit = item.ValueSource.split('.');
                // check if the value source event name matches with the current event
                if (valueSourceSplit[0] !== evt.EventName) {
                    return;
                }

                // get the value from path or default value
                item.Value = this.GetValueFromJson(valueSourceSplit, evt, item.DefaultValue);
            }
        });
    }

    /**
     * To get property value from json
     * 
     * @param {String[]} valueSourceSplit 
     * @param {IUIEvent} evt 
     * @param {String} defaultValue 
     */
    private GetValueFromJson(valueSourceSplit: string[], evt: IUIEvent, defaultValue: string): string {
        // remove the event name from the array
        valueSourceSplit.shift();
        // map the property and get the value from event property
        const valueMap = join(valueSourceSplit, '.');
        // get the value from path or default value
        return get(evt, valueMap, defaultValue);
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
