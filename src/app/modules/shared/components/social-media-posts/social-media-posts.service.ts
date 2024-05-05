import { FormControl, FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { SDKClient } from '@tmac/sdk';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

export const initSmpostsSearchState = {
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
    fromDate: new FormControl(initSmpostsSearchState.fromDate),
    fromTime: new FormControl(initSmpostsSearchState.fromTime),
    toDate: new FormControl(initSmpostsSearchState.toDate),
    toTime: new FormControl(initSmpostsSearchState.toTime),
    email: new FormControl(initSmpostsSearchState.email),
    subject: new FormControl(initSmpostsSearchState.subject),
    content: new FormControl(initSmpostsSearchState.content),
    skills: new FormControl(initSmpostsSearchState.skills),
    agent: new FormControl(initSmpostsSearchState.agent),
    inSessionId: new FormControl(initSmpostsSearchState.inSessionId),
    deviceid: new FormControl(initSmpostsSearchState.deviceid),
    hasAttachments: new FormControl(initSmpostsSearchState.hasAttachments),
    assignedTo: new FormControl(initSmpostsSearchState.assignedTo),
    replied: new FormControl(initSmpostsSearchState.replied),
    closed: new FormControl(initSmpostsSearchState.closed),
    assigned: new FormControl(initSmpostsSearchState.assigned),
    listOfMailboxes: new FormControl([])
});

@Injectable({
    providedIn: 'root'
})
export class SocialMediaPostsService {
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
    readonly globalSmpWorkbenchState$ = this._internal$.email;

    /**
     * Service init method
     */
    async init(): Promise<void> {
        await this.setMailboxes();
    }

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
                this.globalSmpWorkbenchState$.searchParams.patchValue({ listOfMailboxes });
                this.globalSmpWorkbenchState$.defaultEmail.setValue(res.response[0]);
                this.globalSmpWorkbenchState$.availableMailboxes.setValue(res.response);
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Resets email state
     */
    resetEmailState(update?: any): void {
        this.globalSmpWorkbenchState$.globalSearchKey.reset();
        this.globalSmpWorkbenchState$.searchParams.setValue({
            ...initSmpostsSearchState,
            ...update
        });
    }
}
