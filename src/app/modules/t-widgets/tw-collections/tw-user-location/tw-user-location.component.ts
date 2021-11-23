import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import * as L from 'leaflet';

/**
 * User location widget
 */
@Component({
    selector: 'tw-user-location',
    templateUrl: './tw-user-location.component.html',
    styleUrls: ['./tw-user-location.component.scss']
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwUserLocationComponent extends TWidgetWrapper implements OnInit, AfterViewInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Error flag
     */
    error: string;

    map: L.Map;

    @ViewChild('mapContainer')
    mapContainerRef: ElementRef<HTMLDivElement>;
    constructor() {
        super();
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.setLocation();
        }, 3000);
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
            const pLocationJson = this.data.InteractionDetails?.JsonData;
            const location = (JSON.parse(pLocationJson).pLocation || '').replaceAll(' ', '');
            if (!location || location.includes('undefined')) {
                this.error = 'Undefined location';
                return;
            }

            const [lat, long] = location.split(',');
            this.map = L.map(this.mapContainerRef.nativeElement).setView([lat, long], 8);
            // const latlng = new L.LatLng(lat, long);
            // let center = this.map.project(latlng);
            // center = L.point(center.x - 150, center.y - 100);
            // const target = this.map.unproject(center);
            // this.map.panTo(target);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
            const icon = L.icon({
                iconUrl: 'assets/images/leaflet/marker-icon.png',
                shadowUrl: 'assets/images/leaflet/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [13, 41]
            });
            L.marker([lat, long], { icon }).addTo(this.map).openPopup();
        } catch (e) {
            console.error(e);
            this.error = 'Unable to set location';
        }
    }

    onMaximize(isMaximized: boolean): void {
        setTimeout(() => {
            this.map.invalidateSize();
        }, 2000);
    }
}
