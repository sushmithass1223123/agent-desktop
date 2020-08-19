import { HostBinding, Directive } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export class TWidgetWrapper {
    @HostBinding('class') class = 'tw-card';
    @HostBinding('style') style = '';

    // Private
    unsubscribeAll: Subject<any>;

    constructor() {
        // Set the unsubscribeAll defaults
        this.unsubscribeAll = new Subject();
    }

    initWrapper(data: any): void {
        // check if the data is null
        if (!data) {
            console.warn('TWidgetWrapper: data us null');
            return;
        }

        if (this.getWidgetType(data.Type) === 'tw') {
            // add custom class for 'tw' type
        }

        // Check if the position is defined
        if (data.Config.Position) {
            // check if X positon is defined
            if (data.Config.Position.X) {
                this.style = `${this.style} grid-row: span ${data.Config.Position.X} / auto;`;
            }
            // check if Y positon is defined
            if (data.Config.Position.Y) {
                this.style = `${this.style} grid-column: span ${data.Config.Position.Y} / auto;`;
            }
        }

        // check if the Class is defined
        if (data.Config.Class) {
            // add the postion class
            this.class += ' ' + data.Config.Class;
        }
    }

    destroyWrapper(): void {
        // Unsubscribe from all subscriptions
        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    private getWidgetType(type: string): string {
        const typeSplit = type.split('-');
        return typeSplit[0];
    }
}
