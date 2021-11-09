import { CalendarEventAction } from 'angular-calendar';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Calender event model
 */
export class CalendarEventModel {
    /**
     * ID of the event
     */
    id: string;
    /**
     * Start date
     */
    start: Date;
    /**
     * Start time
     */
    startTime: Date;
    /**
     * End date
     */
    end?: Date;
    /**
     * End date
     */
    endTime?: Date;
    /**
     * Type of event
     */
    type: string;
    /**
     * Status of event
     */
    status: string;
    /**
     * Extra data
     */
    data?: any;
    /**
     * Event title
     */
    title: string;
    /**
     * Event color
     */
    color: {
        /**
         * Primary color
         */
        primary: string;
        /**
         * Secondary color
         */
        secondary: string;
    };
    /**
     * Calender event action
     */
    actions?: CalendarEventAction[];
    /**
     * All day flag
     */
    allDay?: boolean;
    /**
     * Css class
     */
    cssClass?: string;
    /**
     * Resizable
     */
    resizable?: {
        /**
         * Before start
         */
        beforeStart?: boolean;
        /**
         * After end
         */
        afterEnd?: boolean;
    };
    /**
     * Deagable
     */
    draggable?: boolean;
    /**
     * Meta data
     */
    meta?: {
        /**
         * Location
         */
        location: string;
        /**
         * Notes
         */
        notes: string;
    };

    /**
     * Constructor
     *
     * @param data
     */
    constructor(data?) {
        data = data || {};
        this.id = data.id;
        this.start = new Date(data.start) || startOfDay(new Date());
        this.end = new Date(data.end) || endOfDay(new Date());
        this.type = data.type || 'event';
        this.status = data.status || '';
        this.title = data.title || '';
        this.color = {
            primary: (data.color && data.color.primary) || '#1e90ff',
            secondary: (data.color && data.color.secondary) || '#D1E8FF'
        };
        this.draggable = data.draggable || false;
        this.resizable = {
            beforeStart: (data.resizable && data.resizable.beforeStart) || false,
            afterEnd: (data.resizable && data.resizable.afterEnd) || false
        };
        this.actions = data.actions || [];
        this.allDay = data.allDay || false;
        this.cssClass = data.cssClass || '';
        this.meta = {
            location: (data.meta && data.meta.location) || '',
            notes: (data.meta && data.meta.notes) || ''
        };
    }
}
