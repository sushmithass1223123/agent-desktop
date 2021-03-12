import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentNotificaitonEvent, SDKClient } from 'tmac-sdk';
/**
 * Broadcat component
 */
@Component({
    selector: 'tw-broadcast',
    templateUrl: './tw-broadcast.component.html',
    styleUrls: ['./tw-broadcast.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwBroadcastComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App confog data
     */
    @Input() data: any;

    /**
     * Broadcat messgae
     */
    broadcastMessage: string;

    /**
     * Is Agent a supervisor
     */
    isAgentSupervisor: boolean;

    constructor(private appUiService: AppUiService) {
        super();
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.isAgentSupervisor = SDKClient.getAgentData().agentProfile === 'S';
        // register to event
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     * Lifecycle hoook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     *
     * Triggered on notification reception
     * @param {AgentNotificaitonEvent} evt
     * @method
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // check if the interaction id is there then return
        if (evt.InteractionID > 0) {
            return;
        }

        // check the type
        if (evt.Type === 'Broadcast' && evt.Message) {
            this.broadcastMessage = evt.Message;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sends broadcast message to supervisor team
     */
    sendBroadcast(): void {
        const { agentId, teamId } = SDKClient.getAgentData();
        if (this.isAgentSupervisor) {
            const dialogRef = this.appUiService.showCustomDialog(
                'prompt',
                'Write the message to be broadcasted below',
                'Broadcast Message',
                { minRows: 5 },
                { minWidth: '30%' }
            );
            dialogRef.afterClosed().subscribe(async (message) => {
                try {
                    if (message) {
                        this.appUiService.showSnackbar('Sending Broadcast', 'loading');
                        const res = await SDKClient.setBroadcastMessageForTeam({
                            message,
                            supervisorId: agentId,
                            teamIds: [teamId]
                        });
                        if (res.response.ResultCode >= 0) {
                            this.appUiService.showSnackbar('Broadcast sent', 'success');
                        } else {
                            throw new Error('Something went wrong while sending broacast');
                        }
                    }
                } catch (e) {
                    this.appUiService.showSnackbar('Something went wrong while sending broacast', 'failure');
                    console.error(e);
                }
            });
        }
    }
}
