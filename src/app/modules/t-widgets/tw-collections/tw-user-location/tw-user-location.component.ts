import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { icon, latLng, marker, tileLayer } from 'leaflet';
import { TwUserLocation } from '@ad/types';

/**
 * User location widget
 */
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
    // @ViewChild('map') mapRef : ElementRef<Leafl>;

    /**
     * USer location
     */
    location: any;
    /**
     * Flag to render map
     */
    loadMap: boolean;

    /**
     * Error flag
     */
    error: string;
    constructor() {
        super();
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.setLocation();
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Sets location of the customer
     */
    setLocation(): void {
        try {
            const pLocationJson = this.data.InteractionDetails?.RecoveryData?.TextChatData;
            const location = JSON.parse(pLocationJson).pLocation || '';
            if (!location || location.includes('undefined')) {
                this.error = 'Undefined location';
                return;
            }
            const [lat, long] = location.split(',');
            this.location = {
                layers: [
                    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }),
                    marker([lat, long], {
                        icon: icon({
                            iconSize: [25, 41],
                            iconAnchor: [13, 41],
                            iconUrl: 'assets/images/leaflet/marker-icon.png',
                            shadowUrl: 'assets/images/leaflet/marker-shadow.png'
                        })
                    })
                ],
                zoom: 15,
                center: latLng(lat, long)
            };
            setTimeout(() => {
                this.loadMap = true;
            }, 1000);
        } catch (e) {
            console.error(e);
            this.error = 'Unable to set location';
        }
    }
}
