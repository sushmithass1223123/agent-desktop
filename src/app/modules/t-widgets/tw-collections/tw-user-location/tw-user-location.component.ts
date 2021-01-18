import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-user-location',
    templateUrl: './tw-user-location.component.html',
    styleUrls: ['./tw-user-location.component.scss']
})
export class TwUserLocationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    location: string;
    error: string;
    constructor() {
        super();
    }

    ngOnInit() {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.setLocation();
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    setLocation() {
        try {
            const pLocationJson = this.data.InteractionDetails?.RecoveryData?.TextChatData;
            const location = JSON.parse(pLocationJson).pLocation || '';
            if (!location || location.includes('undefined')) {
                this.error = 'Undefined location';
            }
            this.location = location;
        } catch (e) {
            console.error(e);
            this.error = 'Something went wrong';
        }
    }
}
