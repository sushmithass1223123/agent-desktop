import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { IAUXCodes, SDKClient, IResponse, IAgentData, SDK } from 'tmac-sdk';

@Component({
    selector: 'tw-aux-codes',
    templateUrl: './tw-aux-codes.component.html',
    styleUrls: ['./tw-aux-codes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAuxCodesComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    opened = false;
    auxCodesList: IAUXCodes[] = [];
    currentAux: IAUXCodes = null;
    agentName = '';
    agentStatus = '';

    constructor() {
        super();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);

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
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    menuOpened(opened: boolean): void {
        this.opened = opened;
    }

    changeStatus(item: IAUXCodes): void {
        // emit a custom event
        SDKClient.events.emit('AgentStatusChangingEvent');
        // change the status
        SDKClient.changeStatus({
            type: item.Code === 'available' ? 'available' : item.Code === 'acw' ? 'acw' : 'aux',
            code: item.Value.toString()
        }, null).then((result: IResponse) => {
            // check the response
            if (result.response) {
                this.auxCodesList.forEach((aux: IAUXCodes) => {
                    if (aux.Name === result.response.Status) {
                        this.currentAux = aux;
                    }
                });
            }
        });
    }
}
