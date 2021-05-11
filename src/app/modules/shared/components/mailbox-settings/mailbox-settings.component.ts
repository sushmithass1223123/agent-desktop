import { ChangeDetectionStrategy, Component, Inject, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TwWorkBenchService } from '@modules/t-widgets/tw-collections/tw-workbench-panel/tw-workbench-panel.service';
import { AppUiService } from '@services/app-ui.service';
import { SDKClient } from '@tmac/sdk';

@Component({
    selector: 'app-mailbox-settings',
    templateUrl: './mailbox-settings.component.html',
    styleUrls: ['./mailbox-settings.component.scss']
})
export class MailboxSettingsComponent implements OnInit {
    /**
     * mailboxes formgroup , and available mailbox list
     */
    mailboxes = {
        available: [],
        loaded: false,
        form: new FormGroup({
            selected: new FormControl(this._twWorkbenchService.globalEmailWorkbenchState$.searchParams.controls.listOfMailboxes.value),
            default: new FormControl(this._twWorkbenchService.globalEmailWorkbenchState$.defaultEmail.value, [Validators.required])
        })
    };

    constructor(
        private _twWorkbenchService: TwWorkBenchService,
        @Inject(MAT_DIALOG_DATA)
        private data: {
            /**
             * Closes Dialog
             */
            close: () => void;
        },
        private _appUiService: AppUiService
    ) {}

    /**
     * Lifecycle hook
     */
    async ngOnInit(): Promise<void> {
        try {
            const emailWorkbenchstate = this._twWorkbenchService.globalEmailWorkbenchState$;
            if (!emailWorkbenchstate.initialized) {
                await this._twWorkbenchService.init();
                this.mailboxes.form.controls.default.disable();
                this.mailboxes.form.controls.selected.disable();
            }
            this.mailboxes.form.controls.default.enable();
            this.mailboxes.form.controls.selected.enable();
            this.mailboxes.loaded = true;
            const availableMailboxes = emailWorkbenchstate.availableMailboxes.value;
            this.mailboxes.available = availableMailboxes;
            this.mailboxes.form.setValue({
                selected: emailWorkbenchstate.searchParams.controls.listOfMailboxes.value,
                default: emailWorkbenchstate.defaultEmail.value
            });

            this.mailboxes.form.valueChanges.subscribe((res) => {
                if (res.default) {
                    emailWorkbenchstate.defaultEmail.setValue(res.default);
                }
                emailWorkbenchstate.searchParams.controls.listOfMailboxes.setValue(res?.selected || '');
            });
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Opens email template
     * @param template
     */
    async openEmailSelectorDialog(): Promise<void> {}

    /**
     * Sends email
     * @param email
     */
    sendEmail(email: any): void {
        console.log({ email });
    }

    /**
     * Sends request  to copmpose a new email
     */
    composeEmail(btn: MatButton): void {
        this._appUiService.showSnackbar('Sending request for new email', 'loading');
        btn.disabled = true;
        SDKClient.composeNewEmail(this.mailboxes.form.controls.default.value)
            .then((res) => {
                this._appUiService.showSnackbar('Request sent for a new email');
                this.data.close();
            })
            .catch((e) => {
                console.error(e);
                this._appUiService.showSnackbar('Error while composing new email');
            })
            .finally(() => {
                btn.disabled = false;
            });
    }
}
