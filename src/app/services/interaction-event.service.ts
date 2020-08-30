import { Injectable } from '@angular/core';
import { IUIEvent, SDKClient } from 'tmac-sdk';
import { BehaviorSubject, Observable } from 'rxjs';
import { InteractionManagerService } from './interaction-manager.service';

@Injectable({
    providedIn: 'root'
})
export class InteractionEventService {
    // Private
    private _tmacEventArray: any[];
    private _constructDisposeEventSubject: BehaviorSubject<any>;

    constructor(
        private _interactionManagerService: InteractionManagerService
    ) {
        // intialize all the subject
        this._constructDisposeEventSubject = new BehaviorSubject({});
        this._tmacEventArray = new Array();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * getter for interaction construct/dispose events
     */
    get constructDisposeEvents(): any | Observable<any[]> {
        return this._constructDisposeEventSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private Methods
    // -----------------------------------------------------------------------------------------------------    

    private onTMACEvents = (evt: IUIEvent) => {
        if (evt.InteractionID > 0) {
            // add all the interaction events to the array
            this._tmacEventArray.push(evt);
            // check for construct/dispose events
            if (evt.IsInteractionConstructEvent || evt.IsInteractionDisposeEvent) {
                // for dispose event remove the reference from array
                if (evt.IsInteractionDisposeEvent) {
                    // remove the events for the ID
                    this.remove(evt.InteractionID);
                    // remove the interaction reference 
                    this._interactionManagerService.removeInteraction(evt.InteractionID);
                }
                // notify the observers
                this._constructDisposeEventSubject.next(evt);
            }
        }
    }

    private remove(interactionId: number): void {
        this._tmacEventArray = this._tmacEventArray.filter(i => i.InteractionID !== interactionId);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Methods
    // -----------------------------------------------------------------------------------------------------

    registerTMACEvents(): void {
        SDKClient.events.on('onTMACEvent', this.onTMACEvents);
    }

    deReigsterTMACEvents(): void {
        SDKClient.events.off('onTMACEvent', this.onTMACEvents);
    }

    public get(interactionId: number): any {
        // get the events based on interaction Id
        const events = this._tmacEventArray.filter(i => i.InteractionID === interactionId);
        if (events.length > 0) {
            return events;
        }
        return [];
    }
}
