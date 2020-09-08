import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { environment } from 'environments/environment';
import { AgentStatusChangeEvent, IAgentData, SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-agent-details',
    templateUrl: './tw-agent-details.component.html',
    styleUrls: ['./tw-agent-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAgentDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    agentData: IAgentData;

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get agent details
        this.agentData = SDKClient.getAgentData();

        if (!environment.production) {
            console.log('Agent details: ', this.agentData);
        }

        // register to events
        SDKClient.events.on('AgentStatusChangingEvent', this.AgentStatusChangingEvent);
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from events
        SDKClient.events.off('AgentStatusChangingEvent', this.AgentStatusChangingEvent);
        SDKClient.events.off('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    private AgentStatusChangingEvent = () => {
        this.agentData.agentStatus = 'Please wait...';
    }

    private AgentStatusChangeEvent = (evt: AgentStatusChangeEvent) => {
        this.agentData.agentStatus = evt.Status;
    }
}
