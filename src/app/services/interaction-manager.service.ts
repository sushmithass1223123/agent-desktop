import { Injectable } from '@angular/core';
import { InteractionRef, InteractionCount } from 'app/interfaces';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { SDKClient } from 'tmac-sdk';

@Injectable({
    providedIn: 'root'
})
export class InteractionManagerService {

    // Private
    private _interactionsSubject: BehaviorSubject<InteractionRef[]>;

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

        console.log('InteractionManagerService', payload);

        // Get the value from the behavior subject
        const interactions = this._interactionsSubject.getValue();

        // push the new content
        interactions.push(payload);

        // Notify the observers
        this._interactionsSubject.next(interactions);
    }

    updateInteraction(interactionId: number, value: any): void {
        // check if the key and value are not null
        if (!interactionId || !value) {
            return;
        }

        // Get the value from the behavior subject
        const interactions = this._interactionsSubject.getValue();

        // filter and check if the interaction is present
        if (interactions.filter(i => i.interactionId === interactionId).length === 0) {
            return;
        }

        // is updated flag
        let updated = false;

        // update the interaction value
        const updatedInteractions = _.map(interactions, item => {
            const currentItem = { ...item };
            // check the item for isActive
            if (Object.keys(value).includes('isActive')) {
                currentItem.isActive = false;
            }
            // filter for the interaction
            if (item.interactionId === interactionId) {
                // check the item for isActive and check if its not active already
                if (Object.keys(value).includes('isActive') && !item.isActive) {
                    SDKClient.selectInteraction(interactionId.toString(), null);
                    // for textchat interaction set the unread message count to 0
                    if (item.type === 'textchat') {
                        item.otherData.unreadCount = 0;
                    }
                }
                // set the upated flag to true
                updated = true;
                // return the modified item
                return { ...item, ...value };
            }
            // else return the current item
            return currentItem;
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

    getInteractionCount(): InteractionCount {
        // get all the interactions
        const interactions = this._interactionsSubject.getValue();
        // init the result obkect
        let result: InteractionCount = {
            total: 0,
            active: 0
        };
        try {
            // try calc the count
            result = {
                total: interactions.length || 0,
                active: interactions.filter(i => i.status === 'connected').length || 0
            };
        } catch (error) { }
        // return the result
        return result;
    }
}

