import { TwCalendar } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import { AppConfirmDialogComponent } from '@modules/shared/components';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentReminder, AgentReminderEvent, SDKClient, UpdateAgentReminderEvent } from '@tmac/sdk';
import { CalendarEventTimesChangedEvent, CalendarMonthViewDay } from 'angular-calendar';
import { addMinutes, format, isBefore, isSameDay, isSameMonth } from 'date-fns';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { CustomCalendarEvent, CustomEventAction } from './calendar.interface';
import { CalendarEventModel } from './calendar.model';
import { CalendarEventFormDialogComponent } from './event-form/event-form.component';
import { TranslocoService } from '@ngneat/transloco';

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
    @Input() data: TwCalendar;
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
     * Task's dot color
     */
    taskColor = 'var(--twd-primary-default)';
    /**
     * Event's dot color
     */
    eventColor = 'var(--twd-accent-default)';

    /**
     * Constructor
     */
    constructor(private _matDialog: MatDialog, private _appUIService: AppUiService, private _tmacEventService: TMACEventService,
        private translocoService: TranslocoService ) {
        super('TwCalendarComponent');

        // Set the defaults
        this.view = 'month';
        this.viewDate = new Date();
        this.activeDayIsOpen = true;
        // startOfDay(new Date()) removed this so that the initial value is a valid one
        this.selectedDay = { date: new Date() };
        this.actions = [
            {
                label: '<i class="material-icons s-16">' + this.translocoService.translate('widgets.calendar.editActionLabel') + '</i>',
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
                label: '<i class="material-icons s-16">' + this.translocoService.translate('widgets.calendar.deleteActionLabel') + '</i>',
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
        /**
         * Get events from service/server
         */
        this.setEvents();

        // since we get data from api as well as event
        // use 'addTMACEventListener' from _tmacEventService
        // instead of 'getNonInteractionEvents'
        this._tmacEventService.addTMACEventListener([
            {
                label: 'AgentReminderEvent',
                callback: this.AgentReminderEvent
            },
            {
                label: 'UpdateAgentReminderEvent',
                callback: this.UpdateAgentReminderEvent
            }
        ]);
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // since we get data from api as well as event
        // use 'addTMACEventListener' from _tmacEventService
        // instead of 'getNonInteractionEvents'
        this._tmacEventService.removeTMACEventListener([
            {
                label: 'AgentReminderEvent',
                callback: this.AgentReminderEvent
            },
            {
                label: 'UpdateAgentReminderEvent',
                callback: this.UpdateAgentReminderEvent
            }
        ]);
    }

    /**
     * To process AgentReminderEvent
     *
     * @param {AgentReminderEvent} evt
     */
    AgentReminderEvent = (evt: AgentReminderEvent): void => {
        evt.Reminders.forEach((reminder) => {
            // update the event
            this.events.forEach((event) => {
                if (event.id === reminder.ID) {
                    event = this.processEvent(reminder);
                }
            });
        });
    };

    /**
     * To process UpdateAgentReminderEvent
     *
     * @param {UpdateAgentReminderEvent} evt
     */
    UpdateAgentReminderEvent = (evt: UpdateAgentReminderEvent): void => {
        // if valid then update
        if (typeof evt.Data === 'object' && evt.Data.ID) {
            this.events.forEach((event) => {
                if (event.id === evt.Data.ID) {
                    if (evt.Data.Status.startsWith('Snooze:')) {
                        const time = evt.Data.Status.split(':')[1];
                        event.start = addMinutes(event.start, time);
                        event.end = addMinutes(event.end, time);
                    } else {
                        event.status = evt.Data.Status;
                    }
                }
            });
        }
    };

    /**
     * To process reminder event
     * @param reminder
     * @returns
     */
    private processEvent(reminder: AgentReminder): CustomCalendarEvent {
        const item = new CalendarEventModel({});
        item.id = reminder.ID;
        item.start = moment(reminder.RemindDate + ' ' + reminder.RemindTime, 'MM/DD/YYYY HH:mm').toDate();
        item.end = moment(reminder.RemindDate + ' ' + reminder.RemindTime, 'MM/DD/YYYY HH:mm').toDate();
        item.status = reminder.Status;
        item.actions = this.actions;
        item.meta = {
            location: '',
            notes: ''
        };

        // get the type
        const type = (item.type = reminder.Type ? reminder.Type : 'text');

        // check if this is a task
        if (type.toLowerCase() === 'executetask') {
            const task = (item.data = JSON.parse(reminder.Message));
            item.title = this.generateTitle(task);
            item.meta.notes = task.Comment;
            item.color.primary = this.taskColor;
        } else if (type.toLowerCase() === 'event') {
            const event = (item.data = JSON.parse(reminder.Message));
            item.title = event.Title;
            item.color.primary = event.Color.Primary ?? this.eventColor;
            item.color.secondary = event.Color.Secondary;
            item.meta.location = event.Meta.Location;
            item.meta.notes = event.Meta.Notes;
        } else {
            item.title = reminder.Message;
        }
        return item;
    }

    /**
     * Before View Renderer
     *
     * @param {any} body
     */
    beforeMonthViewRender({ body }: any): void {
        /**
         * Get the selected day
         */
        // tslint:disable-next-line: completed-docs
        const _selectedDay = body.find((_day: { date: { getTime: () => any } }) => {
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
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.calendar.eventsReloading'), 'loading');
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

            response.forEach((reminder: AgentReminder) => {
                const item = this.processEvent(reminder);
                // push to the list
                this.events.push(item);
            });

            // refresh
            this.refresh.next(null);

            if (update) {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.calendar.eventsReloadSuccess'));
            }

            // this.events = this._calendarService.events.map(item => {
            //     item.actions = this.actions;
            //     return new CalendarEventModel(item);
            // });
        } catch (error) {}
    }

    /**
     * Delete Event
     *
     * @param event
     */
    deleteEvent(event: CustomCalendarEvent): void {
        //checks the alert type 
        const alertType = event.type === 'executetask' ? 'Task' : 'Event';
        this.confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', this.translocoService.translate('widgets.calendar.confirmDeleteTitle'), this.translocoService.translate('widgets.calendar.confirmDeleteMsg'));
        this.confirmDialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.deleteEventLoading'), 'loading');
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
                            this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.deleteEventSuccess'));
                            const eventIndex = this.events.indexOf(event);
                            this.events.splice(eventIndex, 1);
                            this.refresh.next(true);
                        } else {
                            this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.deleteEventFailed'), 'failure');
                        }
                    })
                    .catch(() => {
                        this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.deleteEventError'), 'failure');
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
        //checks the alert type
        const alertType = event.type === 'executetask' ? 'Task' : 'Event';

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
                        this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.eventInvalidDateMsg'), 'failure');
                        return;
                    }

                    this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.eventUpdateLoading'), 'loading');

                    SDKClient.updateAgentReminder({
                        id: event.id.toString(),
                        message: this.formatMessage(formValue).message,
                        reminderDate: format(reminderDateTime, 'yyyyMMdd'),
                        reminderTime: format(reminderDateTime, 'HHmmss'),
                        status: 'New'
                    })
                        .then((x) => {
                            if (x.response > 0) {
                                this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.updateEventSuccess'));
                                this.events[eventIndex] = Object.assign(this.events[eventIndex], formValue);
                                this.refresh.next(true);
                            } else {
                                this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.eventUpdateFailed'), 'failure');
                            }
                        })
                        .catch(() => {
                            this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.eventUpdateError'), 'failure');
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
        const aux = {
            111: 'acw',
            112: 'available'
        };
        // check the type and format
        if (formValue.type === 'executetask') {
            const json = {
                Action: formValue.taskType,
                Data: formValue.taskType === 'changestate' ? `${aux[formValue.taskData] || aux},${formValue.taskData}` : formValue.taskData,
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
    async addEvent(): Promise<void> {
        try {
            // check if for today
            const dateToAdd = format(new Date(), 'yyyyMMdd') === format(this.selectedDay.date, 'yyyyMMdd') ? new Date() : this.selectedDay.date;
            this.dialogRef = this._matDialog.open(CalendarEventFormDialogComponent, {
                panelClass: 'event-form-dialog',
                data: {
                    action: 'new',
                    date: dateToAdd,
                    data: this.data.Data
                }
            });
            this.dialogRef.afterClosed().subscribe(async (resp: FormGroup) => {
                if (!resp) {
                    return;
                }

                let newEvent = resp.getRawValue();
                newEvent.actions = this.actions;

                const reminderDateTime: any = new Date(newEvent.start);
                reminderDateTime.setHours(newEvent.startTime.split(':')[0]);
                reminderDateTime.setMinutes(newEvent.startTime.split(':')[1]);
                reminderDateTime.setSeconds(0);

                newEvent.end = newEvent.start = reminderDateTime;

                // format the message and newEvent
                const formatted = this.formatMessage(newEvent);

                // update the new event as well
                newEvent = formatted.formValue;

                const alertType = newEvent.type === 'executetask' ? 'Task' : 'Event';
                newEvent.color.primary = newEvent.type === 'executetask' ? this.taskColor : this.eventColor;

                this._appUIService.showSnackbar(`Adding ${alertType.toLowerCase()}, please wait`, 'loading');

                const { response } = await SDKClient.createAgentReminderTask({
                    message: formatted.message,
                    reminderDate: format(reminderDateTime, 'yyyyMMdd'),
                    reminderTime: format(reminderDateTime, 'HHmmss'),
                    type: newEvent.type
                });

                if (response > 0) {
                    // get the event id by getting remider from DB
                    const get = await SDKClient.getAgentReminders({
                        message: formatted.message,
                        status: 'New',
                        startDateTime: format(reminderDateTime, 'yyyyMMdd') + '' + format(reminderDateTime, 'HHmmss'),
                        endDateTime: format(reminderDateTime, 'yyyyMMdd') + '' + format(reminderDateTime, 'HHmmss')
                    });

                    // append the ID if success
                    if (get.response) {
                        get.response.forEach((e) => {
                            newEvent.id = e.ID;
                        });
                    }

                    // push event
                    this.events.push(newEvent);
                    this.refresh.next(true);

                    this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.addEventSuccess'));
                } else {
                    this._appUIService.showSnackbar(alertType + this.translocoService.translate('widgets.calendar.addEventFailed'), 'failure');
                }
            });
        } catch (error) {
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.calendar.addEventError'), 'failure');
        }
    }
}
