import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwWrapperModule } from '@modules/t-widgets/tw-wrapper/tw-wrapper.module';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { TwCalendarComponent } from './tw-calendar.component';
import { CalendarEventFormDialogComponent } from './event-form/event-form.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { TranslocoRootModule } from '../../../../transloco-root.module';
/**
 * Tw Calendar Module
 */
@NgModule({
    declarations: [TwCalendarComponent, CalendarEventFormDialogComponent],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [
        CommonModule,
        TwWrapperModule,
        SharedModule,
        ColorPickerModule,
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory
        }),
        TranslocoRootModule
    ],
    exports: [TwCalendarComponent]
})
export class TwCalendarModule {}
