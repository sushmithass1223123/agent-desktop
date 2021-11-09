import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SDKClient } from '@tmac/sdk';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

export const initEmailSearchState = {
    fromDate: yesterday,
    fromTime: `00:00`,
    toDate: today,
    toTime: `${'23'}:${'59'}`,

    email: '',
    subject: '',
    content: '',
    skills: '',

    agent: '',

    inSessionId: '',

    deviceid: '',
    hasAttachments: 2,
    assignedTo: '',

    replied: 2,
    closed: 2,
    assigned: 2,

    listOfMailboxes: []
};

const searchParams = new FormGroup({
    fromDate: new FormControl(initEmailSearchState.fromDate),
    fromTime: new FormControl(initEmailSearchState.fromTime),
    toDate: new FormControl(initEmailSearchState.toDate),
    toTime: new FormControl(initEmailSearchState.toTime),
    email: new FormControl(initEmailSearchState.email),
    subject: new FormControl(initEmailSearchState.subject),
    content: new FormControl(initEmailSearchState.content),
    skills: new FormControl(initEmailSearchState.skills),

    agent: new FormControl(initEmailSearchState.agent),

    inSessionId: new FormControl(initEmailSearchState.inSessionId),

    deviceid: new FormControl(initEmailSearchState.deviceid),
    hasAttachments: new FormControl(initEmailSearchState.hasAttachments),
    assignedTo: new FormControl(initEmailSearchState.assignedTo),

    replied: new FormControl(initEmailSearchState.replied),
    closed: new FormControl(initEmailSearchState.closed),
    assigned: new FormControl(initEmailSearchState.assigned),

    listOfMailboxes: new FormControl([])
});

/**
 * TwWorkbench Service
 */
@Injectable({
    providedIn: 'root'
})
export class EmailService {
    /**
     * Internal service state
     */
    private readonly _internal$ = {
        email: {
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

    emailTemplatesDepartmentsByTeam = false;

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
            if (!res.response) {
                throw new Error(`Invalid Server response ${JSON.stringify(res.response, null, 2)}`);
            }
            if (res.response.length) {
                const listOfMailboxes =
                    res.response.map((email) => {
                        const [mail] = email.split(',');
                        return mail;
                    }) || [];
                this.globalEmailWorkbenchState$.searchParams.patchValue({ listOfMailboxes });
                this.globalEmailWorkbenchState$.defaultEmail.setValue(res.response[0]);
                this.globalEmailWorkbenchState$.availableMailboxes.setValue(res.response);
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Resets email state
     */
    resetEmailState(): void {
        this.globalEmailWorkbenchState$.globalSearchKey.reset();
        this.globalEmailWorkbenchState$.searchParams.setValue({
            ...initEmailSearchState,
            listOfMailboxes: this.globalEmailWorkbenchState$.availableMailboxes.value
        });
    }
}
