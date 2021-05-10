import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentSettingsUpdatedEvent, AgentStatusChangeEvent, AUXCodeUpdateEvent, IAgentData, IAUXCodes, IResponse, SDKClient } from '@tmac/sdk';
import { TwWorkBenchService } from '@modules/t-widgets/tw-collections/tw-workbench-panel/tw-workbench-panel.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
/**
 * Agent Details component
 */
@Component({
    selector: 'tw-agent-details',
    templateUrl: './tw-agent-details.component.html',
    styleUrls: ['./tw-agent-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAgentDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App confif widget data
     */
    @Input() data: any;

    /**
     * Agent Data
     */
    agentData: IAgentData;

    /**
     * Menu opened flag
     */
    opened: boolean;
    /**
     * Aux codes opened flag
     */
    auxOpened: boolean;
    /**
     * Aux code config
     */
    auxCodeConfig: {
        /**
         * Enabled flag
         */
        Enabled: boolean;
        /**
         * Load by team flag
         */
        ByTeam: boolean;
    };
    /**
     * AUX code list with default data
     */
    auxCodesList: IAUXCodes[] = [
        {
            Code: 'nodata',
            Display: 1,
            MaxCount: 0,
            Name: 'No Data Available',
            TeamId: 0,
            Value: 0
        }
    ];

    /**
     * mailboxes formgroup , and available mailbox list
     */
    mailboxes = {
        available: [],
        form: new FormGroup({
            selected: new FormControl(this._twWorkbenchService.globalEmailWorkbenchState$.searchParams.controls.listOfMailboxes.value),
            default: new FormControl(this._twWorkbenchService.globalEmailWorkbenchState$.defaultEmail.value, [Validators.required])
        })
    };

    constructor(
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService,
        private _twWorkbenchService: TwWorkBenchService,
        private matDialog: MatDialog
    ) {
        super();
    }

    /**
     * Life cycle hooks
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the widget extra data
        this.auxCodeConfig = this.data.Data.AuxCodes || {};

        // get agent details
        this.agentData = SDKClient.getAgentData();

        // register to events
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
        SDKClient.events.on('AUXCodeUpdateEvent', this.AUXCodeUpdateEvent);
        SDKClient.events.on('AgentSettingsUpdatedEvent', this.AgentSettingsUpdatedEvent);

        // get agent aux codes
        SDKClient.loadAUXCodes(this.auxCodeConfig.ByTeam, null).then((result: IResponse) => {
            // check if the data is null
            if (result.response && result.response.length > 0) {
                // filter and assign the aux codes
                this.auxCodesList = result.response.filter((a: IAUXCodes) => a.Display === 1);
            }
        });
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from events
        SDKClient.events.off('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
        SDKClient.events.off('AUXCodeUpdateEvent', this.AUXCodeUpdateEvent);
        SDKClient.events.off('AgentSettingsUpdatedEvent', this.AgentSettingsUpdatedEvent);
    }

    /**
     * AgentStatusChangeEvent Handler
     *
     * @param {AgentStatusChangeEvent} evt
     */
    private AgentStatusChangeEvent = (evt: AgentStatusChangeEvent) => {
        this.agentData.agentStatus = evt.Status;
    };

    /**
     * To process AgentSettingsUpdatedEvent
     *
     * @param {AgentSettingsUpdatedEvent} evt
     */
    private AgentSettingsUpdatedEvent = (evt: AgentSettingsUpdatedEvent) => {
        this._appUIService.showAppSnackbar({
            message: 'Agent setting has been updated!',
            state: 'success',
            duration: 10000
        });

        // update the agent data
        this.agentData = SDKClient.getAgentData();
    };

    /**
     * To process AUXCodeUpdateEvent
     *
     * @param {AUXCodeUpdateEvent} evt
     */
    AUXCodeUpdateEvent = (evt: AUXCodeUpdateEvent) => {
        // update the aux codes
        this.auxCodesList = evt.AUXCodes;
        // show an alert
        this._appUIService.showAppSnackbar({
            message: 'Aux Codes reloaded successfully',
            state: 'success'
        });
    };

    /**
     * To change agent status
     *
     * @param {IAUXCodes} item
     */
    changeStatus(item: IAUXCodes): void {
        // show the progress bar
        this._fuseProgressBarService.show();
        this.agentData.agentStatus = 'Please wait...';
        // change the status
        SDKClient.changeStatus({
            type: item.Code.toLocaleLowerCase() === 'available' ? 'available' : item.Code.toLocaleLowerCase() === 'acw' ? 'acw' : 'aux',
            code: item.Value.toString()
        })
            .then((dt) => {
                if (dt.response.EventName === 'AgentStatusChangeEvent') {
                    // parse the result to AgentStatusChangeEvent
                    dt.response = dt.response as AgentStatusChangeEvent;
                    // get the status
                    this.agentData.agentStatus = dt.response.Status;
                } else {
                    this._appUIService.showSnackbar('Change status failed, please try again!', 'failure');
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Change status error, please try again!', 'failure');
            })
            .finally(() => this._fuseProgressBarService.hide());
    }

    /**
     * Opens email template
     * @param template
     */
    async openEmailSelectorDialog(template: TemplateRef<any>): Promise<void> {
        try {
            const emailWorkbenchstate = this._twWorkbenchService.globalEmailWorkbenchState$;
            const availableMailboxes = emailWorkbenchstate.availableMailboxes.value;
            this.mailboxes.available = availableMailboxes;
            this.mailboxes.form.setValue({
                selected: emailWorkbenchstate.searchParams.controls.listOfMailboxes.value.split(','),
                default: emailWorkbenchstate.defaultEmail.value
            });

            const sub = this.mailboxes.form.valueChanges.subscribe((res) => {
                if (res.default) {
                    emailWorkbenchstate.defaultEmail.setValue(res.default);
                }
                emailWorkbenchstate.searchParams.controls.listOfMailboxes.setValue(res?.selected?.join(',') || '');
            });

            this.matDialog
                .open(template, {
                    width: '30%'
                })
                .afterClosed()
                .subscribe(() => {
                    sub.unsubscribe();
                });
        } catch (e) {
            console.error(e);
        }
    }

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
    composeEmail(): void {
        SDKClient.composeNewEmail(this.mailboxes.form.controls.default.value)
            .then((res) => {
                console.log({ res });
            })
            .catch((e) => console.log(e));
    }
}
