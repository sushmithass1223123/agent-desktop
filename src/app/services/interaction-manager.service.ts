import { Injectable } from '@angular/core';
import { ActiveInteraction } from 'app/interfaces';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { retry } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class InteractionManagerService {

    // Private
    private _interactionsSubject: BehaviorSubject<any[]>;
    private _activeInteractionsSubject: BehaviorSubject<ActiveInteraction>;

    constructor() {
        // intialize all the subject
        this._interactionsSubject = new BehaviorSubject([]);
        this._activeInteractionsSubject = new BehaviorSubject(null);
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


    /**
     * Setter for activeInteraction
     */
    set activeInteraction(value) {
        // check if the data is null
        if (!value) {
            return;
        }

        // Notify the observers
        this._activeInteractionsSubject.next(value);
    }

    /**
     * Getter for activeInteraction
     */
    get activeInteraction(): any | Observable<ActiveInteraction> {
        return this._activeInteractionsSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Methods
    // -----------------------------------------------------------------------------------------------------

    addInteraction(value: any): void {
        // check if the data is null
        if (!value) {
            return;
        }

        // Get the value from the behavior subject
        const interactions = this._interactionsSubject.getValue();

        // push the new content
        interactions.push(value);

        // Notify the observers
        this._interactionsSubject.next(interactions);
    }

    updateInteraction(value: any): void {
        // check if the data is null
        if (!value) {
            return;
        }

        // Get the value from the behavior subject
        // const interactions = this._interactionsSubject.getValue()?.filter(i=> i.interactionId);


    }

    removeInteraction(interactionId: number): void {
        // Get the value from the behavior subject
        let interactions = this._interactionsSubject.getValue();

        // filter the interaction by id
        interactions = interactions.filter((i: any) => i.InteractionID !== interactionId);

        // Notify the observers
        this._interactionsSubject.next(interactions);
    }

    getInteractionCount(): number {

        return 0;
    }
}

