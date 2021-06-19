import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import { AppConfirmDialogComponent } from '@modules/shared/components';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppUiService } from '@services/app-ui.service';
import { AgentReminder, SDKClient } from '@tmac/sdk';
import { CalendarEventTimesChangedEvent, CalendarMonthViewDay } from 'angular-calendar';
import { IWidget } from 'app/interfaces';
import { format, isBefore, isSameDay, isSameMonth } from 'date-fns';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { CustomCalendarEvent, CustomEventAction } from './calendar.interface';
import { CalendarEventModel } from './calendar.model';
import { CalendarEventFormDialogComponent } from './event-form/event-form.component';

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
    actions: CustomEventAction[];
    /**
     * Active day is open flag
     */
    activeDayIsOpen: boolean;
    /**
     * Confirmation dialog
     */
    confirmDialogRef: MatDialogRef<AppConfirmDialogComponent>;
    /**
     * Dialog ref
     */
    dialogRef: any;
    /**
     * Calendar events
     */
    events: CustomCalendarEvent[];
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
    constructor(private _matDialog: MatDialog, private _appUIService: AppUiService) {
        super();

        // Set the defaults
        this.view = 'month';
        this.viewDate = new Date();
        this.activeDayIsOpen = true;
        // startOfDay(new Date()) removed this so that the initial value is a valid one
        this.selectedDay = { date: new Date() };
        this.actions = [
            {
                label: '<i class="material-icons s-16">edit</i>',
                onClick: ({
                    event
                }: {
                    /**
                     * Calendar event
                     */
                    event: CustomCalendarEvent;
                }): void => {
                    this.editEvent('edit', event);
                }
            },
            {
                label: '<i class="material-icons s-16">delete</i>',
                onClick: ({
                    event
                }: {
                    /**
                     * Calendar event
                     */
                    event: CustomCalendarEvent;
                }): void => {
                    this.deleteEvent(event);
                }
            }
        ];
        this.events = [];

        /**
         * Get events from service/server
         */
        this.setEvents();
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
        const events = day.events;

        if (isSameMonth(date, this.viewDate)) {
            if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || events.length === 0) {
                this.activeDayIsOpen = false;
            } else {
                this.activeDayIsOpen = true;
                this.viewDate = date;
            }
        }
        this.selectedDay = day;
        this.refresh.next(null);
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
     * Set events
     */
    async setEvents(update?: boolean): Promise<void> {
        try {
            if (update) {
                this._appUIService.showSnackbar('Reloading the events, please wait', 'loading');
            }

            // get all the reminders
            const { response } = await SDKClient.getAgentReminders({
                message: '',
                status: '',
                startDateTime: '',
                endDateTime: ''
            });

            if (update) {
                this.events = [];
            }

            response.forEach((element: AgentReminder) => {
                const item = new CalendarEventModel({});
                item.id = element.ID;
                item.start = moment(element.RemindDate + ' ' + element.RemindTime, 'MM/DD/YYYY HH:mm').toDate();
                item.end = moment(element.RemindDate + ' ' + element.RemindTime, 'MM/DD/YYYY HH:mm').toDate();
                item.status = element.Status;
                item.actions = this.actions;
                item.meta = {
                    location: '',
                    notes: ''
                };

                // get the type
                const type = (item.type = element.Type ? element.Type : 'text');

                // check if this is a task
                if (type.toLowerCase() === 'executetask') {
                    const task = (item.data = JSON.parse(element.Message));
                    item.title = this.generateTitle(task);
                    item.meta.notes = task.Comment;
                } else if (type.toLowerCase() === 'event') {
                    const event = (item.data = JSON.parse(element.Message));
                    item.title = event.Title;
                    item.color.primary = event.Color.Primary;
                    item.color.secondary = event.Color.Secondary;
                    item.meta.location = event.Meta.Location;
                    item.meta.notes = event.Meta.Notes;
                } else {
                    item.title = element.Message;
                }

                // push to the list
                this.events.push(item);
            });

            // refresh
            this.refresh.next(null);

            if (update) {
                this._appUIService.showSnackbar('Events reloaded suuccessfully');
            }

            // this.events = this._calendarService.events.map(item => {
            //     item.actions = this.actions;
            //     return new CalendarEventModel(item);
            // });
        } catch (error) { }
    }

    /**
     * Delete Event
     *
     * @param event
     */
    deleteEvent(event: CustomCalendarEvent): void {
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Delete', 'Are you sure you want to delete?');
        this.confirmDialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this._appUIService.showSnackbar('Deleting event, please wait', 'loading');
                // delete the remider from server
                SDKClient.updateAgentReminder({
                    id: event.id.toString(),
                    message: '',
                    reminderDate: '',
                    reminderTime: '',
                    status: 'delete'
                })
                    .then((x) => {
                        if (x.response > 0) {
                            this._appUIService.showSnackbar('Event deleted successfully');
                            const eventIndex = this.events.indexOf(event);
                            this.events.splice(eventIndex, 1);
                            this.refresh.next(true);
                        } else {
                            this._appUIService.showSnackbar('Deleting event failed', 'failure');
                        }
                    })
                    .catch(() => {
                        this._appUIService.showSnackbar('Error in deleting event', 'failure');
                    });
            }
            this.confirmDialogRef = null;
        });
    }

    /**
     * Edit Event
     *
     * @param {string} action
     * @param {CalendarEvent} event
     */
    editEvent(action: string, event: CustomCalendarEvent): void {
        const eventIndex = this.events.indexOf(event);

        this.dialogRef = this._matDialog.open(CalendarEventFormDialogComponent, {
            panelClass: 'event-form-dialog',
            data: {
                event: event,
                action: action,
                data: this.data.Data
            }
        });

        this.dialogRef.afterClosed().subscribe((response: any) => {
            if (!response) {
                return;
            }
            const actionType: string = response[0];
            const formData: FormGroup = response[1];
            const formValue = formData.getRawValue();

            const reminderDateTime: any = new Date(formValue.start);
            reminderDateTime.setHours(formValue.startTime.split(':')[0]);
            reminderDateTime.setMinutes(formValue.startTime.split(':')[1]);
            reminderDateTime.setSeconds(0);

            formValue.end = formValue.start = reminderDateTime;

            switch (actionType) {
                /**
                 * Save
                 */
                case 'save':
                    // validate the date
                    if (isBefore(formValue.start, new Date())) {
                        this._appUIService.showSnackbar('Event date time should be greater than now!', 'failure');
                        return;
                    }

                    this._appUIService.showSnackbar('Updating event, please wait', 'loading');

                    SDKClient.updateAgentReminder({
                        id: event.id.toString(),
                        message: this.formatMessage(formValue).message,
                        reminderDate: format(reminderDateTime, 'yyyyMMdd'),
                        reminderTime: format(reminderDateTime, 'HHmmss'),
                        status: 'new'
                    })
                        .then((x) => {
                            if (x.response > 0) {
                                this._appUIService.showSnackbar('Event updated successfully');
                                this.events[eventIndex] = Object.assign(this.events[eventIndex], formValue);
                                this.refresh.next(true);
                            } else {
                                this._appUIService.showSnackbar('Updating event failed', 'failure');
                            }
                        })
                        .catch(() => {
                            this._appUIService.showSnackbar('Error in updating event', 'failure');
                        });
                    break;
                /**
                 * Delete
                 */
                case 'delete':
                    this.deleteEvent(event);

                    break;
            }
        });
    }

    /**
     * To format event message
     */
    formatMessage(formValue: any): any {
        let message = formValue.title;
        // check the type and format
        if (formValue.type === 'executetask') {
            const json = {
                Action: formValue.taskType,
                Data: formValue.taskType === 'changestate' ? `aux,${formValue.taskData}` : formValue.taskData,
                Comment: formValue.meta.notes
            };
            formValue.data = json;
            formValue.title = this.generateTitle(json);
            message = JSON.stringify(json);
        } else if (formValue.type === 'event') {
            message = JSON.stringify({
                Title: formValue.title,
                Color: {
                    Primary: formValue.color.primary,
                    Secondary: formValue.color.secondary
                },
                Meta: {
                    Location: formValue.meta.location,
                    Notes: formValue.meta.notes
                }
            });
        }
        return {
            formValue,
            message
        };
    }

    /**
     * To generate event title
     */
    generateTitle(task: any): string {
        let title = '';
        // check the action
        if (task.Action === 'changestate') {
            const value = task.Data.split(',')[1];
            const auxCodes = SDKClient.getAgentData().auxCodes.filter((f) => f.Value.toString() === value)?.[0];
            title = `Task: Change Status to ${auxCodes?.Name || task.Data}`;
        } else if (task.Action === 'makecall') {
            title = `Task: Make call to ${task.Data}`;
        } else if (task.Action === 'meeting') {
            title = `Task: Meeting ${task.Data ? ' - ' + task.Data : ''}`;
        } else {
            title = `Task: ${task.Action} - ${task.Data}`;
        }
        return title;
    }

    /**
     * Add Event
     */
    addEvent(): void {
        this.dialogRef = this._matDialog.open(CalendarEventFormDialogComponent, {
            panelClass: 'event-form-dialog',
            data: {
                action: 'new',
                date: this.selectedDay.date,
                data: this.data.Data
            }
        });
        this.dialogRef.afterClosed().subscribe((response: FormGroup) => {
            if (!response) {
                return;
            }

            let newEvent = response.getRawValue();
            newEvent.actions = this.actions;

            const reminderDateTime: any = new Date(newEvent.start);
            reminderDateTime.setHours(newEvent.startTime.split(':')[0]);
            reminderDateTime.setMinutes(newEvent.startTime.split(':')[1]);
            reminderDateTime.setSeconds(0);

            newEvent.end = newEvent.start = reminderDateTime;

            this._appUIService.showSnackbar('Adding event, please wait', 'loading');

            // format the message and newEvent
            const formatted = this.formatMessage(newEvent);

            // update the new event as well
            newEvent = formatted.formValue;

            SDKClient.createAgentReminderTask({
                message: formatted.message,
                reminderDate: format(reminderDateTime, 'yyyyMMdd'),
                reminderTime: format(reminderDateTime, 'HHmmss'),
                type: newEvent.type
            })
                .then((x) => {
                    if (x.response > 0) {
                        this._appUIService.showSnackbar('Event added successfully');

                        this.events.push(newEvent);
                        this.refresh.next(true);
                    } else {
                        this._appUIService.showSnackbar('Adding event failed', 'failure');
                    }
                })
                .catch(() => {
                    this._appUIService.showSnackbar('Error in adding event', 'failure');
                });
        });
    }
}
