import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SDKClient } from '@tmac/sdk';

const searchParams = new FormGroup({
    fromDate: new FormControl(''),
    fromTime: new FormControl(''),
    toDate: new FormControl(''),
    toTime: new FormControl(''),
    email: new FormControl(''),
    subject: new FormControl(''),
    content: new FormControl(''),
    skills: new FormControl(''),

    agent: new FormControl(''),

    inSessionid: new FormControl(''),

    deviceid: new FormControl(''),
    hasAttachments: new FormControl('yes'),
    assignedTo: new FormControl(''),

    replied: new FormControl('any'),
    closed: new FormControl('any'),
    assigned: new FormControl('any'),

    sesisonid: new FormControl(''),
    global: new FormControl(''),
    listOfMailboxes: new FormControl([], [Validators.required])
});

/**
 * TwWorkbench Service
 */
@Injectable({
    providedIn: 'root'
})
export class TwWorkBenchService {
    /**
     * Internal service state
     */
    private readonly _internal$ = {
        email: {
            initialized: false,
            searchParams,
            globalSearchKey: new FormControl(''),
            defaultEmail: new FormControl(''),
            availableMailboxes: new FormControl([])
        }
    };

    /**
     * ReadOnly Observable for email workbench state
     */
    readonly globalEmailWorkbenchState$ = this._internal$.email;

    constructor() {}

    /**
     * Service init method
     */
    async init(): Promise<void> {
        await this.setMailboxes();
    }

    /**
     * Sets mailboxes
     */
    async setMailboxes(): Promise<void> {
        try {
            const res = await SDKClient.getMailboxes('agent');
            if (res.response.length) {
                this._internal$.email.initialized = true;
                const listOfMailboxes =
                    res.response.map((email) => {
                        const [mail] = email.split(',');
                        return mail;
                    }) || [];
                this.globalEmailWorkbenchState$.searchParams.patchValue({ listOfMailboxes });
                // this.globalEmailWorkbenchState$.defaultEmail.setValue(res.response[0]);
                this.globalEmailWorkbenchState$.availableMailboxes.setValue(res.response);
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Sets searchParams key in _internal$
     */
    setEmailSearchParams(params: Partial<typeof searchParams>, global = ''): void {
        this._internal$.email.searchParams.patchValue(params);
        if (global) {
            this._internal$.email.globalSearchKey.patchValue(global);
        }
    }

    /**
     * Resets email state
     */
    resetEmailState(): void {
        const params = searchParams.value;
        this.globalEmailWorkbenchState$.searchParams.setValue({
            ...params,
            listOfMailboxes: this.globalEmailWorkbenchState$.availableMailboxes.value
        });
    }
}
