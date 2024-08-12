import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ObjectPipe' })
export class ObjectPipe implements PipeTransform {
    /**
     * Method to transform input value
     * @param type Type of transformation to carry out
     * @param value Actual value in context
     * @param args Additional args to support transformation
     * @returns any
     */
    transform(type: string, value: any, args: any[]): any {
        switch (type) {
            case 'getObjectKeyString': {
                return Object.keys(value)[0];
            }
            case 'getObjectValue': {
                return Object.values(value)[0];
            }
        }
    }
}
