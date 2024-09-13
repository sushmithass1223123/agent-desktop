import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'MiscellaneousPipe' })
export class MiscellaneousPipe implements PipeTransform {
    /**
     * Method to transform input value
     * @param type Type of transformation to carry out
     * @param value Actual value in context
     * @param args Additional args to support transformation
     * @returns any
     */
    transform(type: string, value: any, args: any[]): any {
        switch (type) {
            case 'replace': {
                return value.toString().replace(args[0], args[1]);
            }
            case 'replaceAll': {
                return value.toString().replaceAll(args[0], args[1]);
            }
            case 'split': {
                return value.toString().split(args[0]);
            }
            case 'includes': {
                return value.toString().includes(args[0]);
            }
            case 'slice': {
                if (args[0] !== undefined && args[1] !== undefined) return value.slice(args[0], args[1]);
                else return value.slice(args[0]);
            }
        }
    }
}
