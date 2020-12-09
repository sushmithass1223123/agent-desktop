import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { IUIEvent, SDKClient, TUtils } from 'tmac-sdk';

/**
 * Common event service for different pages
 */
@Injectable({
    providedIn: 'root'
})
export class EventBufferService {
    /**
     * Behavor subject for list of non interaction events
     */
    _nonInteractionEvents: BehaviorSubject<Record<string, { updated: boolean, data: any[] }>>;

    /**
     * Behavor subject for list of interaction events
     */
    _interactionEvents: BehaviorSubject<Record<string, { updated: boolean, data: any[] }>>;


    constructor() { }

    /**
     * To subscribe to event buffer
     */
    subscribe(): void {
        TUtils.Logger.console('info', 'EventBufferService.subscribe');
        SDKClient.events.on('onTMACEvent', this.onTMACEvents);

        this._nonInteractionEvents = new BehaviorSubject({});
        this._interactionEvents = new BehaviorSubject({});
    }

    /**
     * To unsubscribe from event buffer
     */
    unsubscribe(): void {
        TUtils.Logger.console('info', 'EventBufferService.unsubscribe');
        SDKClient.events.off('onTMACEvent', this.onTMACEvents);

        this._nonInteractionEvents = null;
        this._interactionEvents = null;
    }

    /**
     * To process onTMACEvents
     *
     * @param {IUIEvent} evt
     */
    private onTMACEvents = (evt: IUIEvent) => {
        let eventListMap: Record<string, { updated: boolean, data: any[] }>;

        // check if interaction event
        if (evt.InteractionID > 0) {
            eventListMap = this._interactionEvents.value;

            // check event is already there, then update
            if (!this._interactionEvents.value[evt.EventName]) {
                eventListMap[evt.EventName] = {
                    data: [evt],
                    updated: true
                };
            } else {
                eventListMap[evt.EventName].updated = true;
                eventListMap[evt.EventName].data = [evt];
            }

            // notify the observer
            this._interactionEvents.next(eventListMap);
        } else {
            eventListMap = this._nonInteractionEvents.value;

            // check event is already there, then update
            if (!this._nonInteractionEvents.value[evt.EventName]) {
                eventListMap[evt.EventName] = {
                    data: [evt],
                    updated: true
                };
            } else {
                eventListMap[evt.EventName].updated = true;
                eventListMap[evt.EventName].data.push(evt);
            }

            // notify the observer
            this._nonInteractionEvents.next(eventListMap);
        }
    }


    /**
     * Teset
     * @param eventName 
     */
    getEvent<T>(eventName: string): Observable<T[]> {
        return this._nonInteractionEvents.pipe(
            filter(evt => !!evt[eventName] && evt[eventName].updated),
            distinctUntilChanged((prev, cur) => {
                console.log(prev);
                console.log(cur);

                return prev[eventName].data[0].EventID === cur[eventName].data[0].EventID;
            }),
            tap(evt => {
                return evt[eventName].data.length >= 2 ? evt[eventName].data.shift() : null;
            }),
            map(evt => evt[eventName].data)
        );
    }

    // /**
    //  * Gets events for the passed event name
    //  * @param {String} evt Event name to get
    //  */
    // getEvents<T = any>(eventNames: string[]): Observable<T[]> {
    //     return this._nonInteractionEvents.pipe(
    //         map(evt => Object.keys(evt).filter(x => eventNames.includes(x)).map(y => evt[y])),
    //         // distinctUntilChanged(evt => evt['dsjk'])
    //         // mergeAll(),
    //         // filter((evt: any) => eventNames.includes(evt.EventName)));
    // }

    /**
     * Gets events for the passed event name
     * @param {String} evt Event name to get
     * @param {Number} evt Interaction ID
     */
    getInteractionEvents<T = any>(eventNames: string[], interactionId: number): Observable<T> {
        return this._interactionEvents.pipe(filter((evt: any) => interactionId === evt.InteractionID && eventNames.includes(evt.EventName)));
    }
}
