import { TwUserLocation } from '@ad/types';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { TMACEventService } from '@services/tmac-event.service';
import { TextChatRemoteUserConnectedEvent, TextChatMessageReceivedEvent } from '@tmac/sdk';
import * as L from 'leaflet';
import { takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
/**
 * User location widget
 */
@Component({
    selector: 'tw-user-location',
    templateUrl: './tw-user-location.component.html',
    styleUrls: ['./tw-user-location.component.scss']
})
export class TwUserLocationComponent extends TWidgetWrapper implements OnInit, AfterViewInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwUserLocation;
    /**
     * Error flag
     */
    error: string;
    /**
     * Map reference
     */
    map: L.Map;
    /**
     * Loading
     */
    loading: boolean;
    /**
     * Loading ref
     */
    loadingRef: NodeJS.Timeout;
    /**
     * Map container
     */
    @ViewChild('mapContainer')
    mapContainerRef: ElementRef<HTMLDivElement>;

    constructor(private _tmacEventService: TMACEventService, private translocoService: TranslocoService) {
        super('TwUserLocationComponent');
    }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.loading = true;
        this.loadingRef = setTimeout(() => {
            this.error = this.translocoService.translate('widgets.userLocation.locationNotFound');
            this.loading = false;
        }, 5000);

        // location found in data, do not register for event
        if (this.data.Data.Source === 'dashboard') {
            return;
        }

        const interactionId = this.data?.InteractionDetails?.InteractionID;
        if (!interactionId) {
            this.logger.error('Interaction details not found!', null);
            this.error = this.translocoService.translate('widgets.userLocation.unableToSetLocation');
        }
        this._tmacEventService
            .getInteractionEvents(['TextChatRemoteUserConnectedEvent', 'TextChatMessageReceivedEvent'], interactionId)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * Lifecycle hook
     */
    ngAfterViewInit(): void {
        const { Latitude, Longitude } = this.data.Data?.Location ?? {};
        if (Latitude && Longitude) {
            this.setLocation(Latitude, Longitude);
        }
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To process TextChatMessageReceivedEvent
     * @param evt TextChatMessageReceivedEvent evt
     */
    TextChatMessageReceivedEvent(evt: TextChatMessageReceivedEvent): void {
        // // check if app message
        if (evt.IsAppMessage) {
            const msg = JSON.parse(evt.Message);
            const mType = msg.type ? msg.type : msg.msg ? msg.msg.type : 'unknown';
            switch (mType?.toLowerCase()) {
                case 'location': {
                    let lat = parseFloat(msg.latitude ? msg.latitude : msg?.msg?.content?.latitude ? msg?.msg?.content?.latitude : '0');
                    let long = parseFloat(msg.longitude ? msg.longitude : msg?.msg?.content?.longitude ? msg?.msg?.content?.longitude : '0');
                    this.setLocation(lat, long);
                    break;
                }
            }
            return;
        }
    }

    /**
     * To process TextChatRemoteUserConnectedEvent
     *
     * @param {TextChatRemoteUserConnectedEvent} event
     * @returns
     */
    TextChatRemoteUserConnectedEvent(event: TextChatRemoteUserConnectedEvent) {
        try {
            const pLocationJson = event.JsonData;
            const location = (JSON.parse(pLocationJson).pLocation || '').replaceAll(' ', '');

            if (!location || location.includes('undefined')) {
                this.error = this.translocoService.translate('widgets.userLocation.locationUndefined');
                this.clearLoading();
                return;
            } else {
                const [lat, long] = location.split(',');
                this.setLocation(lat, long);
            }
        } catch (e) {
            this.logger.error('Unable to set location', e);
            this.error = this.translocoService.translate('widgets.userLocation.unableToSetLocation');
        }
    }

    /**
     * To set location
     * @param {Number} lat
     * @param {Number} long
     */
    setLocation(lat: number, long: number): void {
        try {
            this.error = '';
            this.map = L.map(this.mapContainerRef.nativeElement).setView([lat, long], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png').addTo(this.map);
            const icon = L.icon({
                iconUrl: 'assets/images/leaflet/marker-icon.png',
                shadowUrl: 'assets/images/leaflet/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [13, 41]
            });
            L.marker([lat, long], { icon }).addTo(this.map).openPopup();
            this.clearLoading();
            setTimeout(() => {
                this.map.invalidateSize();
            }, 1000);
        } catch (ex) {
            this.logger.error('Unable to set location', ex);
            this.error = this.translocoService.translate('widgets.userLocation.unableToSetLocation');
        }
    }

    /**
     * To clear loading
     */
    clearLoading(): void {
        this.loading = false;
        clearTimeout(this.loadingRef);
    }

    // /**
    //  * Sets location of the customer
    //  */
    // setLocation(): void {
    //     try {
    //         const pLocationJson = this.data.InteractionDetails?.JsonData;
    //         const location = (JSON.parse(pLocationJson).pLocation || '').replaceAll(' ', '');
    //         if (!location || location.includes('undefined')) {
    //             this.error = 'Undefined location';
    //             return;
    //         }

    //         const [lat, long] = location.split(',');
    //         // const [lat, long] = [44.36551363472203, 142.43999423723125];
    //         this.map = L.map(this.mapContainerRef.nativeElement).setView([lat, long], 13);
    //         // const latlng = new L.LatLng(lat, long);
    //         // let center = this.map.project(latlng);
    //         // center = L.point(center.x - 150, center.y - 100);
    //         // const target = this.map.unproject(center);
    //         // this.map.panTo(target);
    //         L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png').addTo(this.map);
    //         const icon = L.icon({
    //             iconUrl: 'assets/images/leaflet/marker-icon.png',
    //             shadowUrl: 'assets/images/leaflet/marker-shadow.png',
    //             iconSize: [25, 41],
    //             iconAnchor: [13, 41]
    //         });
    //         L.marker([lat, long], { icon }).addTo(this.map).openPopup();
    //         // this.map.
    //         // (L as any).setLocale('en-US');
    //     } catch (e) {
    //         this.logger.error('Unable to set location', e);
    //         this.error = 'Unable to set location';
    //     }
    // }

    onMaximize(isMax: boolean): void {
        setTimeout(() => {
            this.map.invalidateSize();
        }, 1000);
    }
}
