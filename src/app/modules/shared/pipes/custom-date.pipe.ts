import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'customDate'
})
export class CustomDatePipe extends DatePipe implements PipeTransform {
    transform(date: any, format?: string): any {
        try {
            return super.transform(date, format);
        } catch {}
        return date.toString();
    }
}
