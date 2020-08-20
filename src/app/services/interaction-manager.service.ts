import { Injectable } from '@angular/core';
import { ActiveInteraction, InteractionRef } from 'app/interfaces';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { SDKClient } from 'tmac-sdk';

@Injectable({
    providedIn: 'root'
})
export class InteractionManagerService {

    // Private
    private _interactionsSubject: BehaviorSubject<any[]>;

    constructor() {
        // intialize all the subject
        this._interactionsSubject = new BehaviorSubject([]);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for interactions
     */
    get interactions(): any | Observable<any[]> {
        return this._interactionsSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Methods
    // -----------------------------------------------------------------------------------------------------

    addInteraction(payload: InteractionRef): void {
        // check if the data is null
        if (!payload) {
            return;
        }

        // Get the value from the behavior subject
        const interactions = this._interactionsSubject.getValue();

        // push the new content
        interactions.push(payload);

        // Notify the observers
        this._interactionsSubject.next(interactions);
    }

    updateInteraction(interactionId: number, key: string, value: any): void {
        // check if the key and value are not null
        if (!key || !value) {
            return;
        }

        // Get the value from the behavior subject
        const interactions = this._interactionsSubject.getValue();

        // is updated flag
        let updated = false;

        // update the interaction value
        const updatedInteractions = _.map(interactions, item => {
            // if its to update the active interaction, initially set all the interaction inactive
            if (key === 'isActive') {
                item.isActive = false;
            }
            // filter the matching interaction
            if (item.interactionId === interactionId && item.hasOwnProperty(key) && item[key] !== value) {
                // check if the key is to update the active state
                if (key === 'isActive') {
                    // call the sdk to update the server
                    SDKClient.selectInteraction(interactionId.toString(), null);
                }
                // update the value of key
                item[key] = value;
                // set the updated flag true
                updated = true;
            }
            // return the item
            return item;
        });

        // Notify the observers if updated
        if (updated) {
            this._interactionsSubject.next(updatedInteractions);
        }
    }

    removeInteraction(interactionId: number): void {
        // Get the value from the behavior subject
        let interactions = this._interactionsSubject.getValue();
        const currentCount = interactions.length;

        // filter the interaction by id
        interactions = interactions.filter((i: InteractionRef) => i.interactionId !== interactionId);

        // check if any item is removed
        if (interactions.length !== currentCount) {
            // Notify the observers
            this._interactionsSubject.next(interactions);
        }
    }

    getInteractionCount(): number {
        return 0;
    }
}

