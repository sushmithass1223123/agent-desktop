import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarMonthViewDay } from 'angular-calendar';
import { IWidget } from 'app/interfaces';
import { addDays, addHours, endOfDay, endOfMonth, isSameDay, isSameMonth, startOfDay, subDays } from 'date-fns';
import { Subject } from 'rxjs';

/**
 * Calendar component
 */
@Component({
    selector: 'tw-calendar',
    templateUrl: './tw-calendar.component.html',
    styleUrls: ['./tw-calendar.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwCalendarComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Calendar event actions
     */
    actions: CalendarEventAction[];
    /**
     * Active day is open flag
     */
    activeDayIsOpen: boolean;
    /**
     * Confirmation dialog
     */
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    /**
     * Dialog ref
     */
    dialogRef: any;
    /**
     * Calendar events
     */
    events: CalendarEvent[];
    /**
     * Refresh subject
     */
    refresh: Subject<any> = new Subject();
    /**
     * Selected day ref
     */
    selectedDay: any;
    /**
     * View
     */
    view: string;
    /**
     * View date
     */
    viewDate: Date;

    /**
     * Constructor
     */
    constructor() {
        super();

        // Set the defaults
        this.view = 'month';
        this.viewDate = new Date();
        this.activeDayIsOpen = true;
        this.selectedDay = { date: startOfDay(new Date()) };
        this.actions = [
            {
                label: '<i class="material-icons s-16">edit</i>',
                onClick: ({ event }: {
                    /**
                     * Calendar event
                     */
                    event: CalendarEvent
                }): void => {
                    // this.editEvent('edit', event);
                }
            },
            {
                label: '<i class="material-icons s-16">delete</i>',
                onClick: ({ event }: {
                    /**
                     * Calendar event
                     */
                    event: CalendarEvent
                }): void => {
                    // this.deleteEvent(event);
                }
            }
        ];
        this.events = [
            {
                start: subDays(startOfDay(new Date()), 1),
                end: addDays(new Date(), 1),
                title: 'A 3 day event',
                allDay: true,
                color: {
                    primary: '#F44336',
                    secondary: '#FFCDD2'
                },
                resizable: {
                    beforeStart: true,
                    afterEnd: true
                },
                draggable: false,
                meta: {
                    location: 'Los Angeles',
                    notes: 'Eos eu verear adipiscing, ex ornatus denique iracundia sed, quodsi oportere appellantur an pri.'
                }
            },
            {
                start: startOfDay(new Date()),
                end: endOfDay(new Date()),
                title: 'An event',
                allDay: false,
                color: {
                    primary: '#FF9800',
                    secondary: '#FFE0B2'
                },
                resizable: {
                    beforeStart: true,
                    afterEnd: true
                },
                draggable: false,
                meta: {
                    location: 'Los Angeles',
                    notes: 'Eos eu verear adipiscing, ex ornatus denique iracundia sed, quodsi oportere appellantur an pri.'
                }
            },
            {
                start: subDays(endOfMonth(new Date()), 3),
                end: addDays(endOfMonth(new Date()), 3),
                title: 'A long event that spans 2 months',
                allDay: false,
                color: {
                    primary: '#1E90FF',
                    secondary: '#D1E8FF'
                },
                resizable: {
                    beforeStart: true,
                    afterEnd: true
                },
                draggable: false,
                meta: {
                    location: 'Los Angeles',
                    notes: 'Eos eu verear adipiscing, ex ornatus denique iracundia sed, quodsi oportere appellantur an pri.'
                }
            },
            {
                start: addHours(startOfDay(new Date()), 2),
                end: new Date(),
                title: 'A draggable and resizable event',
                allDay: false,
                color: {
                    primary: '#673AB7',
                    secondary: '#D1C4E9'
                },
                resizable: {
                    beforeStart: true,
                    afterEnd: true
                },
                draggable: false,
                meta: {
                    location: 'Los Angeles',
                    notes: 'Eos eu verear adipiscing, ex ornatus denique iracundia sed, quodsi oportere appellantur an pri.'
                }
            }
        ];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }


    /**
     * Before View Renderer
     *
     * @param {any} header
     * @param {any} body
     */
    beforeMonthViewRender({ header, body }): void {
        /**
         * Get the selected day
         */
        const _selectedDay = body.find((_day) => {
            return _day.date.getTime() === this.selectedDay.date.getTime();
        });

        if (_selectedDay) {
            /**
             * Set selected day style
             * @type {string}
             */
            _selectedDay.cssClass = 'cal-selected';
        }
    }

    /**
     * Day clicked
     *
     * @param {MonthViewDay} day
     */
    dayClicked(day: CalendarMonthViewDay): void {
        const date: Date = day.date;
        const events: CalendarEvent[] = day.events;

        if (isSameMonth(date, this.viewDate)) {
            if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || events.length === 0) {
                this.activeDayIsOpen = false;
            }
            else {
                this.activeDayIsOpen = true;
                this.viewDate = date;
            }
        }
        this.selectedDay = day;
        this.refresh.next();
    }

    /**
     * Event times changed
     * Event dropped or resized
     *
     * @param {CalendarEvent} event
     * @param {Date} newStart
     * @param {Date} newEnd
     */
    eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
        event.start = newStart;
        event.end = newEnd;
        this.refresh.next(true);
    }

    /**
     * Add Event
     */
    addEvent(): void { }

}
