import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatColors } from '@fuse/mat-colors';
import { AppUiService } from '@services/app-ui.service';
import { format } from 'date-fns';
import { IAUXCodes, SDKClient } from 'tmac-sdk';
import { CustomCalendarEvent } from '../calendar.interface';
import { CalendarEventModel } from '../calendar.model';

/**
 * Calendar Event Form Dialog Component
 */
@Component({
    selector: 'calendar-event-form-dialog',
    templateUrl: './event-form.component.html',
    styleUrls: ['./event-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class CalendarEventFormDialogComponent {
    /**
     * Widget data
     */
    data: any;
    /**
     * Calendar action
     */
    action: string;
    /**
     * Calendar event
     */
    event: CustomCalendarEvent;
    /**
     * Event form
     */
    eventForm: FormGroup;
    /**
     * Dialog title
     */
    dialogTitle: string;
    /**
     * Present color
     */
    presetColors = MatColors.presets;
    /**
     * Agent aux codes
     */
    auxCodes: IAUXCodes[];

    /**
     * Constructor
     *
     * @param {MatDialogRef<CalendarEventFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<CalendarEventFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _appUIService: AppUiService
    ) {
        this.event = _data.event;
        this.action = _data.action;
        this.data = _data.data;

        if (this.action === 'edit') {
            this.dialogTitle = 'Edit Event/Task';
        }
        else {
            this.dialogTitle = 'New Event/Task';
            this.event = new CalendarEventModel({
                start: _data.date,
                end: _data.date
            });
        }
        this.auxCodes = SDKClient.getAgentData().auxCodes;
        this.eventForm = this.createEventForm();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To alert copy
     */
    copyAlert(): void {
        this._appUIService.showSnackbar('Copied!');
    }

    /**
     * Create the event form
     *
     * @returns {FormGroup}
     */
    createEventForm(): FormGroup {
        return new FormGroup({
            title: new FormControl(this.event.title),
            type: new FormControl({ value: this.event.type, disabled: this.action === 'edit' }),
            start: new FormControl(this.event.start),
            taskType: new FormControl({ value: this.event.type === 'executetask' ? this.event.data.Action : '', disabled: this.action === 'edit' }),
            taskData: new FormControl(this.event.type === 'executetask' ?
                this.event.data.Action === 'changestatus' ?
                    this.event.data.Data.split(',')[0] :
                    this.event.data.Data :
                ''),
            startTime: new FormControl(format(this.event.start, 'HH:mm')),
            end: new FormControl(this.event.start),
            endTime: new FormControl(format(this.event.start, 'HH:mm')),
            allDay: new FormControl(this.event.allDay),
            color: this._formBuilder.group({
                primary: new FormControl({ value: this.event.color.primary, disabled: this.event.type === '' || this.event.type === 'text' }),
                secondary: new FormControl({ value: this.event.color.secondary, disabled: this.event.type === '' || this.event.type === 'text' })
            }),
            meta:
                this._formBuilder.group({
                    location: new FormControl({ value: this.event.meta.location, disabled: this.event.type === '' || this.event.type === 'text' }),
                    notes: new FormControl({ value: this.event.meta.notes, disabled: this.event.type === '' || this.event.type === 'text' })
                })
        });
    }
}
