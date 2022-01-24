import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentStatusChangeEvent, AUXCodeUpdateEvent, IAgentData, IAUXCodes, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils';
import { IWidget } from 'app/interfaces';
import { throwADError } from 'app/utils';
import { takeUntil } from 'rxjs/operators';
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
    @Input() data: IWidget<any, IWidgetData>;

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
     * Aux codes config
     */
    auxCodeConfig: IAuxCodeConfig;
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

    constructor(
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService,
        private _tmacEventService: TMACEventService
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
        this.auxCodeConfig = this.data.Data.AuxCodes || {
            Enabled: false,
            ByTeam: false,
            DefaultACW: false,
            DefaultLogout: false
        };

        // get agent details
        this.agentData = SDKClient.getAgentData();

        // register to events
        this._tmacEventService
            .getNonInteractionEvents(['AgentStatusChangeEvent', 'AUXCodeUpdateEvent', 'AgentSettingsUpdatedEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        // get agent aux codes
        SDKClient.loadAUXCodes(this.auxCodeConfig.ByTeam, null)
            .then((result) => {
                if (!result.response || !result.response.length) {
                    return;
                }

                // check for default Aux
                result.response = result.response.map((aux) => {
                    if (aux.Value === 110 && this.auxCodeConfig.DefaultLogout) {
                        aux.Display = 1;
                    }
                    return aux;
                });

                // filter and assign the aux codes
                this.auxCodesList = result.response;
            })
            .catch(() => {
                this._appUIService.showSnackbar('Error in loading aux codes', 'failure');
            });
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * AgentStatusChangeEvent Handler
     *
     * @param {AgentStatusChangeEvent} evt
     */
    AgentStatusChangeEvent(evt: AgentStatusChangeEvent): void {
        this.agentData.agentStatus = evt.Status;
        // if DefaultACW is enabled, then enable on call only
        if (this.auxCodeConfig.DefaultACW) {
            const index = this.auxCodesList.findIndex((a) => a.Value === 111);
            if (index >= 0) {
                if (evt.Status.includes('On Call')) {
                    this.auxCodesList[index].Display = 1;
                } else {
                    this.auxCodesList[index].Display = 0;
                }
            }
        }
    }

    /**
     * To process AgentSettingsUpdatedEvent
     */
    AgentSettingsUpdatedEvent(): void {
        this._appUIService.showAppSnackbar({
            message: 'Agent setting has been updated!',
            state: 'success',
            duration: 10000
        });

        // update the agent data
        this.agentData = SDKClient.getAgentData();
    }

    /**
     * To process AUXCodeUpdateEvent
     *
     * @param {AUXCodeUpdateEvent} evt
     */
    AUXCodeUpdateEvent(evt: AUXCodeUpdateEvent): void {
        // update the aux codes
        this.auxCodesList = evt.AUXCodes;
        // show an alert
        this._appUIService.showAppSnackbar({
            message: 'Aux Codes reloaded successfully',
            state: 'success'
        });
    }

    /**
     * To change agent status
     *
     * @param {IAUXCodes} item
     */
    changeStatus(item: IAUXCodes): void {
        // show the progress bar
        this._fuseProgressBarService.show();
        const oldStatus = this.agentData.agentStatus;
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
                    this.agentData.agentStatus = oldStatus;
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Change status error, please try again!', 'failure');
                this.agentData.agentStatus = oldStatus;
            })
            .finally(() => this._fuseProgressBarService.hide());
    }
}

interface IWidgetData {
    /**
     * To show profile picture
     */
    ProfilePicture: boolean;
    /**
     * To show agent status
     */
    Status: boolean;
    /**
     * Auxcodes ref
     */
    AuxCodes: IAuxCodeConfig;
}

interface IAuxCodeConfig {
    /**
     * Enabled flag
     */
    Enabled: boolean;
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
