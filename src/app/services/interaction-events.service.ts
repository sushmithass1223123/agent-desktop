import { Injectable } from '@angular/core';
import { IUIEvent, SDKClient } from 'tmac-sdk';

@Injectable({
    providedIn: 'root'
})
export class InteractionEventsService {
    // Private
    private _tmacEventArray: any[];

    constructor() {
        // intialize all the subject
        this._tmacEventArray = new Array();
        // register to TMAC events
        this.registerToEvents();
    }

    private registerToEvents(): void {
        SDKClient.events.on('onTMACEvent', (evt: IUIEvent) => {
            if (evt.InteractionID > 0) {
                this._tmacEventArray.push(evt);
            }
        });
    }

    public async get(interactionId: number): Promise<any> {
        // get the events based on interaction Id
        const events = this._tmacEventArray.filter(i => i.InteractionID === interactionId);
        if (events.length > 0) {
            return events;
        }
        return null;
    }

    public remove(interactionId: number): void {
        this._tmacEventArray = this._tmacEventArray.filter(i => i.InteractionID !== interactionId);
    }
}
