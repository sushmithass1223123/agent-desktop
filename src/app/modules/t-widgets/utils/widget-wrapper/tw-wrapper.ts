import { HostBinding, Directive } from '@angular/core';
import { Subject } from 'rxjs';
import { IWidget } from 'app/interfaces';
import { TUtils } from '@tmac/sdk';

/**
 * T Widget Wrapper directive
 */
@Directive()
// tslint:disable-next-line: directive-class-suffix
export class TWidgetWrapper {
    /**
     * Host binding for class
     */
    @HostBinding('class') class = 'tw-card';
    /**
     * Host binding for style
     */
    @HostBinding('style') style = '';
    /**
     * Host binding for id
     */
    @HostBinding('id') id = '';

    /**
     * Subject to unsubscribe
     */
    unsubscribeAll: Subject<any>;

    constructor() {
        // Set the unsubscribeAll defaults
        this.unsubscribeAll = new Subject();
    }

    /**
     * On widget init
     *  
     * @param {IWidget} data Widget data
     */
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

        // Check if the position is defined
        if (data.Config.Position) {
            // check if X positon is defined
            if (data.Config.Position.X) {
                // this.style = `${this.style} grid-column : 1/${data.Config.Position.X}`
                this.style = `${this.style} grid-column: span ${data.Config.Position.X} / auto;`.trim();
            }
            // check if Y positon is defined
            if (data.Config.Position.Y) {
                // this.style = `${this.style} grid-row : 1/${data.Config.Position.Y}`
                this.style = `${this.style} grid-row: span ${data.Config.Position.Y} / auto;`.trim();
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

        // check if the widget is a hidden widget
        if (data.Config.Hidden) {
            this.style = `${this.style} display:none;`.trim();
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

    /**
     * On widget destroy
     */
    destroyWrapper(): void {
        // Unsubscribe from all subscriptions
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }
}
