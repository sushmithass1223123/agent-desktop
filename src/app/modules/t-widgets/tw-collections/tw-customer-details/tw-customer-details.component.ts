import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomerInfo } from 'app/interfaces';
import { processCustomerDetails, throwADError } from 'app/utils';
import { uniq } from 'lodash';
import { filter, takeUntil } from 'rxjs/operators';
import { TwCustomerDetails } from '@ad/types';
import { QueueColorCodesModel, SDKClient } from '@tmac/sdk';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { anchorWidgets } from 'app/constants/fuse-config';

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
    /**
     * Background color codes for Queue time
     */
    queueTimeColorCodes: QueueColorCodesModel[] = [];

    /**
     * Fuse custom config
     */
    customFuse: any;


    constructor(private _tmacEventService: TMACEventService,
        private _fuseFacadeService: FuseFacadeService
    ) {
        super('TwCustomerDetailsComponent');
        this.customFuse = {
                    anchor$: this._fuseFacadeService.anchorBgClasses$().pipe(filter(() => anchorWidgets.includes('tw-customer-details'))),
                    widget$: this._fuseFacadeService.widgetBgClasses$()
                };
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
        this.getQueueTimeColorCodes();
        this.sortCustomerInfo();
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
     * Get colorcodes for queue time based for various ranges
     */
    getQueueTimeColorCodes() {
        try{
            SDKClient.getQueueTimeColorCodes(this.data).then(data => {
                this.queueTimeColorCodes = data.response;
            });
        } catch(e) {
            this.logger.error('Error on fetching Queue time color codes', e, false);
        }
    }

    getCustomStyles(item) {
        if(item.Unit !== '') {
            return {
                'color': this.getColorCode(item)
            };
        } else {
            return '';
        }
    }

    getColorCode(item) {
        let colorCode = 'none';
        try {
            const type = item.ValueSource.split('.').pop();
            switch(type) {
                case 'QueueTime': colorCode = this.queueTimeColorCodes.filter(
                    (data) => {
                        if(Number(data.endTime) >= Number(item.Value) && Number(data.startTime) <= Number(item.Value))
                        {
                            return data;
                        }
                        return '';
                    }
                )?.[0]?.colorCode;
                return colorCode; 
            }
            return '';
        } catch(e) {
            this.logger.error('Error occured on displaying customer info bg color', e, false);
            return colorCode; 
        }
    }

    /**
     * Method to sort customer info and place name on top
     */
    sortCustomerInfo() {
       const nameDetail = this.customerInfo.find((c) => c.Title?.toLowerCase() === 'name');
       const otherDetails = this.customerInfo.filter((c) => c.Title?.toLowerCase() !== 'name');
       this.customerInfo = nameDetail ? [nameDetail, ...otherDetails] : this.customerInfo;
    }
}
