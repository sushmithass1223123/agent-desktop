import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentStatusChangeEvent, IAgentData, SDKClient } from 'tmac-sdk';
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

    constructor() {
        super();
    }

    /**
     * Life cycle hooks
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get agent details
        this.agentData = SDKClient.getAgentData();

        // register to events
        SDKClient.events.on('AgentStatusChangingEvent', this.AgentStatusChangingEvent);
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from events
        SDKClient.events.off('AgentStatusChangingEvent', this.AgentStatusChangingEvent);
        SDKClient.events.off('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    /**
     * AgentStatusChangingEvent Handler
     */
    private AgentStatusChangingEvent = () => {
        this.agentData.agentStatus = 'Please wait...';
    }

    /**
     * AgentStatusChangeEvent Handler
     * @param {AgentStatusChangeEvent} evt 
     */
    private AgentStatusChangeEvent = (evt: AgentStatusChangeEvent) => {
        this.agentData.agentStatus = evt.Status;
    }
}
