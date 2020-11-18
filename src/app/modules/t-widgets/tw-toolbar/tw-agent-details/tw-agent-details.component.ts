import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentStatusChangeEvent, IAgentData, IAUXCodes, IResponse, SDKClient } from 'tmac-sdk';
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
     * Current AUX reference
     */
    currentAux: string;

    constructor(
        private _fuseProgressBarService: FuseProgressBarService
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
        SDKClient.events.on('AgentStatusChangingEvent', this.AgentStatusChangingEvent);
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);

        // get agent aux codes
        SDKClient.loadAUXCodes(this.auxCodeConfig.ByTeam, null)
            .then((result: IResponse) => {
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
     * 
     * @param {AgentStatusChangeEvent} evt 
     */
    private AgentStatusChangeEvent = (evt: AgentStatusChangeEvent) => {
        this.agentData.agentStatus = evt.Status;
    }

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
        }, item)
            .then((dt) => {
                if (dt.response.EventName === 'AgentStatusChangeEvent') {
                    // parse the result to AgentStatusChangeEvent
                    dt.response = dt.response as AgentStatusChangeEvent;
                    // get the status
                    this.agentData.agentStatus = dt.response.Status;
                }
                // hide the progress bar
                this._fuseProgressBarService.hide();
            })
            .catch(() => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
            });
    }
}
