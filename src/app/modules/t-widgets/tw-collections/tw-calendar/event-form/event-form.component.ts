import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatColors } from '@fuse/mat-colors';
import { AppUiService } from '@services/app-ui.service';
import { IAUXCodes, SDKClient } from '@tmac/sdk';
import { format } from 'date-fns';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomCalendarEvent } from '../calendar.interface';
import { CalendarEventModel } from '../calendar.model';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Calendar Event Form Dialog Component
 */
@Component({
    selector: 'calendar-event-form-dialog',
    templateUrl: './event-form.component.html',
    styleUrls: ['./event-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CalendarEventFormDialogComponent implements OnInit, OnDestroy {
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
    eventForm: UntypedFormGroup;
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
     * mininimu date for task / event
     */
    minDate = new Date();

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
        private _formBuilder: UntypedFormBuilder,
        private _appUIService: AppUiService,
        private translocoService: TranslocoService
    ) {
        this.event = _data.event;
        this.action = _data.action;
        this.data = _data.data;

        if (this.action === 'edit') {
            this.dialogTitle = translocoService.translate('widgets.calendar.editEventTitle');
        } else {
            this.dialogTitle = translocoService.translate('widgets.calendar.newEventTitle');
            this.event = new CalendarEventModel({
                start: _data.date,
                end: _data.date
            });
        }
        this.auxCodes = SDKClient.getAgentData().auxCodes.filter((aux) => aux.Value !== 110 && aux.Value !== 111);

        // check the status of event
        // if (this.event.status.toLowerCase() === 'completed') {
        //     this.eventForm.disable();
        // }
    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.eventForm = this.createEventForm();
        // set the initial validators
        this.setValidators(this.eventForm.controls.type.value);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To set validators for form
     * @param { 'executetask' | 'event' } type
     */
    setValidators(type: 'executetask' | 'event'): void {
        const titleControl = this.eventForm.get('title');
        const taskTypeControl = this.eventForm.get('taskType');
        const taskDataControl = this.eventForm.get('taskData');

        if (type === 'executetask') {
            titleControl.setValue('');
            titleControl.setValidators([Validators.nullValidator]);
            taskTypeControl.setValidators(Validators.required);
            taskDataControl.setValidators([Validators.required, this.noWhitespaceValidator]);
        } else {
            taskTypeControl.setValue('');
            taskDataControl.setValue('');
            taskTypeControl.setValidators(Validators.nullValidator);
            taskDataControl.setValidators(Validators.nullValidator);
            titleControl.setValidators([Validators.required, this.noWhitespaceValidator]);
        }
        titleControl.updateValueAndValidity();
        taskTypeControl.updateValueAndValidity();
        taskDataControl.updateValueAndValidity();
    }

    /**
     * To alert copy
     */
    copyAlert(): void {
        this._appUIService.showSnackbar('Copied!');
    }

    /**
     * Validates Time of the form
     */
    validateTime(control: AbstractControl): ValidationErrors {
        if (this.eventForm && control.value) {
            const enteredDate = new Date(this.eventForm.get('start').value);
            const [hours, mins] = control.value.split(':');
            enteredDate.setHours(hours);
            enteredDate.setMinutes(mins);
            if (enteredDate.getTime() < Date.now()) {
                return { invalid: true };
            }
            return {};
        }
        return { invalid: true };
    }

    /**
     * Create the event form
     * @returns {FormGroup}
     */
    createEventForm(): UntypedFormGroup {
        // change the type case
        this.event.type = this.event.type.toLowerCase();

        const formGroup = new UntypedFormGroup({
            title: new UntypedFormControl(this.event.title),
            type: new UntypedFormControl({ value: this.event.type, disabled: this.action === 'edit' }),
            taskType: new UntypedFormControl({ value: this.event.type === 'executetask' ? this.event.data.Action : '', disabled: this.action === 'edit' }),
            taskData: new UntypedFormControl(
                this.event.type === 'executetask'
                    ? this.event.data.Action === 'changestate'
                        ? this.event.data.Data.split(',')[1]
                        : this.event.data.Data
                    : ''
            ),
            start: new UntypedFormControl(this.event.start),
            startTime: new UntypedFormControl(format(this.event.start, 'HH:mm'), [(control) => this.validateTime(control)]),
            end: new UntypedFormControl(this.event.start),
            endTime: new UntypedFormControl(format(this.event.start, 'HH:mm')),
            allDay: new UntypedFormControl(this.event.allDay),
            color: this._formBuilder.group({
                primary: new UntypedFormControl({ value: this.event.color.primary, disabled: this.event.type === '' || this.event.type === 'text' }),
                secondary: new UntypedFormControl({ value: this.event.color.secondary, disabled: this.event.type === '' || this.event.type === 'text' })
            }),
            meta: this._formBuilder.group({
                location: new UntypedFormControl({ value: this.event.meta.location, disabled: this.event.type === '' || this.event.type === 'text' }),
                notes: new UntypedFormControl({ value: this.event.meta.notes, disabled: this.event.type === '' || this.event.type === 'text' })
            })
        });

        formGroup.controls.start.valueChanges.subscribe(() => {
            formGroup.controls.startTime.updateValueAndValidity();
        });

        return formGroup;
    }

    /**
     * Custom validation function to prevent white spaces in title field
     */
    noWhitespaceValidator(control: UntypedFormControl) {
        const isWhitespace = (control.value || '').trim().length === 0;
        return !isWhitespace ? null : { 'whitespace': true };
    }
}
