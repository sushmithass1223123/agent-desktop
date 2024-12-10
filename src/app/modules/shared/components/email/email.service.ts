import { Injectable } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
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

const searchParams = new UntypedFormGroup({
    fromDate: new UntypedFormControl(initEmailSearchState.fromDate),
    fromTime: new UntypedFormControl(initEmailSearchState.fromTime),
    toDate: new UntypedFormControl(initEmailSearchState.toDate),
    toTime: new UntypedFormControl(initEmailSearchState.toTime),
    email: new UntypedFormControl(initEmailSearchState.email),
    subject: new UntypedFormControl(initEmailSearchState.subject),
    content: new UntypedFormControl(initEmailSearchState.content),
    skills: new UntypedFormControl(initEmailSearchState.skills),

    agent: new UntypedFormControl(initEmailSearchState.agent),

    inSessionId: new UntypedFormControl(initEmailSearchState.inSessionId),

    deviceid: new UntypedFormControl(initEmailSearchState.deviceid),
    hasAttachments: new UntypedFormControl(initEmailSearchState.hasAttachments),
    assignedTo: new UntypedFormControl(initEmailSearchState.assignedTo),

    replied: new UntypedFormControl(initEmailSearchState.replied),
    closed: new UntypedFormControl(initEmailSearchState.closed),
    assigned: new UntypedFormControl(initEmailSearchState.assigned),

    listOfMailboxes: new UntypedFormControl([])
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
            globalSearchKey: new UntypedFormControl(''),
            defaultEmail: new UntypedFormControl(''),
            availableMailboxes: new UntypedFormControl([])
        }
    };

    /**
     * ReadOnly Observable for email workbench state
     */
    readonly globalEmailWorkbenchState$ = this._internal$.email;

    /**
     * Email template depratments by team
     */
    emailTemplatesDepartmentsByTeam = false;

    /**
     * Email template depratments by hierarchy
     */
    emailTemplatesDepartmentsByHierarchy = false;

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
    resetEmailState(update?: any): void {
        this.globalEmailWorkbenchState$.globalSearchKey.reset();
        this.globalEmailWorkbenchState$.searchParams.setValue({
            ...initEmailSearchState,
            ...update,
            listOfMailboxes: this.globalEmailWorkbenchState$.availableMailboxes.value
        });
    }
}
