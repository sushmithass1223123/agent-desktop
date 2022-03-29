import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomerInfo } from 'app/interfaces';
import { processCustomerDetails, throwADError } from 'app/utils';
import { uniq } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { TwCustomerDetails } from '@ad/types';

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
    @Input() data: TwCustomerDetails<any>;

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
        this.customerInfo = this.data.Data.CustomerInfo ?? [];
        try {
            // create event names to subscribe
            const eventNames: any = uniq(this.customerInfo.map((c) => c.ValueSource?.split('.')?.shift()) ?? []);
            const processInfo = processCustomerDetails(this.customerInfo);
            // register to tmac events
            this._tmacEventService
                .getInteractionEvents(eventNames, this.interactionId)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) =>
                    evts.forEach((evt) => {
                        // processCustomerDetails(this.customerInfo, evt);
                        processInfo.exec(evt);
                    })
                );
        } catch (error) {
            throwADError('Error in TwCampaignContactComponent', error);
        }
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
