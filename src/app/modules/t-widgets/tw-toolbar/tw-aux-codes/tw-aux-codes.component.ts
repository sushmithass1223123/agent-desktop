import { TwAuxCode } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentStatusChangeEvent, IAgentData, IAUXCodes, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils';

/**
 * Aux codes components
 */
@Component({
    selector: 'tw-aux-codes',
    templateUrl: './tw-aux-codes.component.html',
    styleUrls: ['./tw-aux-codes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAuxCodesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Widget data
     */
    @Input() data: TwAuxCode;
    /**
     * AUX code menu opened falg
     */
    opened = false;
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
    /**
     * Agent name reference
     */
    agentName = '';
    /**
     * Agent status reference
     */
    agentStatus = '';

    constructor(private _fuseProgressBarService: FuseProgressBarService, private _tmacEventService: TMACEventService) {
        super();
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // register to event
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);

        // get agent aux codes
        SDKClient.loadAUXCodes(this.data.Data.ByTeam ?? false, null).then((result) => {
            // check if the data is null
            if (result.response && result.response.length) {
                // check for default Aux
                result.response = result.response.map((aux) => {
                    if (aux.Value === 110 && this.data.Data.DefaultLogout) {
                        aux.Display = 1;
                    }
                    return aux;
                });
                // filter and assign the aux codes
                this.auxCodesList = result.response;
            }
        });

        // get agent details
        const agentData: IAgentData = SDKClient.getAgentData();
        this.agentName = agentData.agentName;
        this.agentStatus = agentData.agentStatus;
        this.currentAux = agentData.agentStatus;
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // unregister from event
        SDKClient.events.off('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    /**
     * To process AgentStatusChangeEvent
     *
     * @param {AgentStatusChangeEvent} evt
     */
    private AgentStatusChangeEvent = (evt: AgentStatusChangeEvent) => {
        this.currentAux = evt.Status;
        // if DefaultACW is enabled, then enable on call only
        if (this.data.Data.DefaultACW) {
            const index = this.auxCodesList.findIndex((a) => a.Value === 111);
            if (index >= 0) {
                if (evt.Status.includes('On Call')) {
                    this.auxCodesList[index].Display = 1;
                } else {
                    this.auxCodesList[index].Display = 0;
                }
            }
        }
    };

    /**
     * To change agent status
     *
     * @param {IAUXCodes} item
     */
    changeStatus(item: IAUXCodes): void {
        // show the progress bar
        this._fuseProgressBarService.show();

        const customEvent = {
            EventName: 'AgentStatusChangingEvent'
        };

        this._tmacEventService.emitSDKEvent({
            event: customEvent
        });

        // change the status
        SDKClient.changeStatus(
            {
                type: item.Code.toLocaleLowerCase() === 'available' ? 'available' : item.Code.toLocaleLowerCase() === 'acw' ? 'acw' : 'aux',
                code: item.Value.toString()
            },
            item
        ).then(() => {
            // hide the progress bar
            this._fuseProgressBarService.hide();
        });
    }
}

interface IWidgetData {
    /**
     * Load by team flag
     */
    ByTeam: boolean;
    /**
     * To show default ACW status
     */
    DefaultACW: boolean;
    /**
     * To show default Logout status
     */
    DefaultLogout: boolean;
}
