import { Injectable } from '@angular/core';
import { SDKClient, TUtils } from '@tmac/sdk';
import { InteractionCount, InteractionRef } from 'app/interfaces';
import { map } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Need more Description
 * Interaction Manager Service
 */
@Injectable({
    providedIn: 'root'
})
export class InteractionManagerService {
    /**
     * Holds all interaction details
     */
    private _interactionsSubject: BehaviorSubject<InteractionRef[]>;

    constructor() {}

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

    /**
     * To subscribe to InteractionManagerService service
     */
    public subscribe(): void {
        TUtils.Logger.console('info', 'InteractionManagerService.subscribe');

        // intialize the subject
        this._interactionsSubject = new BehaviorSubject([]);
    }

    /**
     * To unsubscribe to InteractionManagerService service
     */
    public unsubscribe(): void {
        TUtils.Logger.console('info', 'InteractionManagerService.unsubscribe');

        // unsubscribe from the subject
        this._interactionsSubject.next([]);
        this._interactionsSubject.complete();
    }

    /**
     * Adds incoming interaction to the subject
     * @param {InteractionRef} payload
     */
    addInteraction(payload: InteractionRef): void {
        // check if the data is null
        if (!payload) {
            return;
        }

        // get the value from the behavior subject
        const interactions = this._interactionsSubject.getValue();

        // push the new content
        interactions.push(payload);

        // notify the observers
        this._interactionsSubject.next(interactions);
    }

    /**
     * Updates interaction info
     * @param {Number} interactionId
     * @param {any} value
     */
    updateInteraction(interactionId: number, value: any): void {
        // check if the key and value are not null
        if (!interactionId || !value) {
            return;
        }

        // Get the value from the behavior subject
        const interactions = this._interactionsSubject.getValue();

        // filter and check if the interaction is present
        if (interactions.filter((i) => i.interactionId === interactionId).length === 0) {
            return;
        }

        // is updated flag
        let updated = false;

        // update the interaction value
        const updatedInteractions = map(interactions, (item) => {
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
                // if the update is for other data then keep the exisitng other data values
                if (Object.keys(value).includes('otherData')) {
                    value.otherData = {
                        ...item.otherData,
                        ...value.otherData
                    };
                }
                // set the upated flag to true
                updated = true;
                // return the modified item
                return { ...item, ...value };
            }
            // else return the current item
            return currentItem;
        });

        // notify the observers if updated
        if (updated) {
            this._interactionsSubject.next(updatedInteractions);
        }
    }

    /**
     * Deleted interaction by interaction Id
     * @param {number} interactionId
     */
    removeInteraction(interactionId: number): void {
        // Get the value from the behavior subject
        let interactions = this._interactionsSubject.getValue();
        const currentCount = interactions.length;

        // if there are no interaction for this id return
        if (currentCount === 0) {
            return;
        }

        // filter the interaction by id
        interactions = interactions.filter((i: InteractionRef) => i.interactionId !== interactionId);

        // check if any item is removed
        if (interactions.length !== currentCount) {
            // notify the observers
            this._interactionsSubject.next(interactions);
        }
    }

    /**
     * Gets interaction counts
     * returns total and active interactions
     */
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
                // active: interactions.filter((i) => i.status === 'connected').length || 0
                active: interactions.filter((i) => i.isActive).length ?? 0
            };
        } catch (error) {}
        // return the result
        return result;
    }
}
