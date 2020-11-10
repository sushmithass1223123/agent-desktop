import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SDKClient } from 'tmac-sdk';
import { HOME_DASH_BUFFER_SIZE } from 'app/constants';
import { filter, map, mergeAll } from 'rxjs/operators';

/**
 * Common event service for different pages
 */
@Injectable({
    providedIn: 'root'
})
export class EventBufferService {

    /**
     * Behavor subject for list of events for agent dashboard
     */
    agentDash = new BehaviorSubject<any[]>([]);

    constructor() { }

    /**
     * Registers events for Home Page dashboard
     */
    registerAgentDashEvents(events: string[]): void {
        SDKClient.events.on('onTMACEvent', (evt: any) => {
            if (events.includes(evt.EventName)) {
                const newEventList = this.agentDash.value;
                newEventList.unshift(evt);
                if (newEventList.length > HOME_DASH_BUFFER_SIZE) {
                    newEventList.pop();
                }
                this.agentDash.next(newEventList);
            }
        });
    }

    /**
     * Gets events for the passed event name
     * @param {String} evt Event name to get 
     */
    getEvents<T = any>(eventName: string): Observable<T> {
        return this.agentDash.pipe(
            mergeAll(),
            filter((evt: any) => evt.EventName === eventName)
        );
    }
}
