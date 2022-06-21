import { InteractionWidget } from '../core';

/**
 * User location widget is used to display the customer location during an interaction
 */
export type TwUserLocation = InteractionWidget<TwUserLocationData>;

/**
 * Data config for the user location widget
 */
export interface TwUserLocationData {
    /**
     * Source of the widget
     */
    Source?: 'dashboard' | 'interaction';
    /**
     * Location data
     */
    Location?: Location;
}

interface Location {
    /**
     * Location latitude
     */
    Latitude: number;
    /**
     * Location longitude
     */
    Longitude: number;
}
