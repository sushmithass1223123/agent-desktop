import { HostBinding, Directive } from '@angular/core';
import { Subject } from 'rxjs';
import { IWidget } from 'app/interfaces';
import { TUtils } from 'tmac-sdk';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export class TWidgetWrapper {
    @HostBinding('class') class = 'tw-card';
    @HostBinding('style') style = '';
    @HostBinding('id') id = '';

    // Private
    unsubscribeAll: Subject<any>;

    constructor() {
        // Set the unsubscribeAll defaults
        this.unsubscribeAll = new Subject();
    }

    initWrapper(data: IWidget): void {
        // check if the data is null
        if (!data) {
            console.warn('TWidgetWrapper: data us null');
            return;
        }

        // check if any id is appended, if not add here
        if (!data.ID) {
            // get new id from uuid
            data.ID = TUtils.Generic.uuid();
            // append the id to the tag
            this.id = data.ID;
        }

        if (this.getWidgetType(data.Type) === 'tw') {
            // add custom class for 'tw' type
        }

        // Check if the position is defined
        if (data.Config.Position) {
            // check if X positon is defined
            if (data.Config.Position.X) {
                this.style = `${this.style} grid-row: span ${data.Config.Position.X} / auto;`.trim();
            }
            // check if Y positon is defined
            if (data.Config.Position.Y) {
                this.style = `${this.style} grid-column: span ${data.Config.Position.Y} / auto;`.trim();
            }

            // check if W width is defined
            if (data.Config.Position.W) {
                this.style = `${this.style} width: ${data.Config.Position.W}px;`.trim();
            }

            // check if H height is defined
            if (data.Config.Position.H) {
                this.style = `${this.style} height: ${data.Config.Position.H}px;`.trim();
            }
        }

        // check if the Class is defined
        if (data.Config.Class) {
            // add the postion class
            this.class += ' ' + data.Config.Class;
        }

        // add the view state as class
        if (data.Config.ViewState) {
            this.class += ' ' + data.Config.ViewState;
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
