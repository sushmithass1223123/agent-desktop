import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentStatusChangeEvent, IAgentData, IAUXCodes, IResponse, SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-aux-codes',
    templateUrl: './tw-aux-codes.component.html',
    styleUrls: ['./tw-aux-codes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAuxCodesComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    opened = false;
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
    currentAux: string;
    agentName = '';
    agentStatus = '';

    constructor(
        private _fuseProgressBarService: FuseProgressBarService
    ) {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // register to event
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);

        // get agent aux codes
        SDKClient.loadAUXCodes(false, null)
            .then((result: IResponse) => {
                // check if the data is null
                if (result.response && result.response.length > 0) {
                    // filter and assign the aux codes
                    this.auxCodesList = result.response.filter((a: IAUXCodes) => a.Display === 1);
                }
            });

        // get agent details
        const agentData: IAgentData = SDKClient.getAgentData();
        this.agentName = agentData.agentName;
        this.agentStatus = agentData.agentStatus;
        this.currentAux = agentData.agentStatus;
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    private AgentStatusChangeEvent = (evt: AgentStatusChangeEvent) => {
        this.currentAux = evt.Status;
    }

    menuOpened(opened: boolean): void {
        this.opened = opened;
    }

    changeStatus(item: IAUXCodes): void {
        // show the progress bar
        this._fuseProgressBarService.show();
        // emit a custom event
        SDKClient.events.emit('AgentStatusChangingEvent');
        // change the status
        SDKClient.changeStatus({
            type: item.Code.toLocaleLowerCase() === 'available' ? 'available' : item.Code.toLocaleLowerCase() === 'acw' ? 'acw' : 'aux',
            code: item.Value.toString()
        }, item)
            .then(() => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
            });
    }
}
