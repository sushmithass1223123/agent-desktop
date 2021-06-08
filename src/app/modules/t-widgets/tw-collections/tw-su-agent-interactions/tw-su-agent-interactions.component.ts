import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { DashboardService } from '@services/dashboard.service';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentFeatures, IAgentData, InteractionDataModel, IResponse, SDKClient, SuAgentModel } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_FEATURES, AGENT_FEATURES_MAP } from 'app/constants';
import { CustomSDKEvent, IWidget } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';

/**
 * Supervisor Agent Interactions Component
 */
@Component({
    selector: 'tw-su-agent-interactions',
    templateUrl: './tw-su-agent-interactions.component.html',
    styleUrls: ['./tw-su-agent-interactions.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuAgentInteractionsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Mat sort for mat table
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    /**
     * Mat paginator for mat table
     */
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    /**
     * Config data
     */
    configData: SuAgentModel;

    /**
     * Maximized flag
     */
    maximized = false;

    /**
     * Interaction list
     */
    interactionList: any;

    /**
     * Mat table minimized displayed columns
     */
    mindisplayedColumns = ['InteractionID', 'Channel', 'LastStatus', 'User', 'ActiveTime', 'HoldTime', 'Actions'];

    /**
     * Agent feature map
     */
    featureMap = AGENT_FEATURES_MAP;

    /**
     * Agent data
     */
    agentData: IAgentData;

    /**
     * Interaction details table
     */
    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: this.mindisplayedColumns,
        loaded: false
    };

    /**
     * Constructor
     */
    constructor(
        private _dashboardService: DashboardService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService
    ) {
        super();

        this.agentData = SDKClient.getAgentData();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // assign the widget data
        this.configData = this.data.Data;

        // register to event
        this._tmacEventService
            .getNonInteractionEvents(['TeamAgentInteractionDetailsEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        // start receiving data
        this._dashboardService.triggerAgentInteractions(this.configData?.AgentLoginID, true);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // stop receiving data
        this._dashboardService.triggerAgentInteractions(this.configData?.AgentLoginID, false);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To process TeamAgentInteractionDetailsEvent
     *
     * @param {CustomSDKEvent} evt
     */
    private TeamAgentInteractionDetailsEvent = (evt: CustomSDKEvent) => {
        // if the list is empty the return
        if (evt.Data.length === 0) {
            return;
        }

        // filter for the agent
        if (evt.Data[0].AgentLoginID !== this.configData?.AgentLoginID) {
            return;
        }

        // assign the interaction details
        this.interactionList = evt.Data[0].Interactions;

        this.interactionDetailsTable.loaded = true;
        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
    };

    /**
     * To perform chat bargeIn
     * @param {'silent' | 'whisper' | 'conf'} type Type of barge-In
     * @param {InteractionDataModel} item Interaction data
     */
    private performChatBargeIn(type: 'silent' | 'whisper' | 'conf', item: InteractionDataModel): void {
        this._appUIService.showSnackbar('Please wait, connecting to the interaction...', 'loading');
        // send request to server
        SDKClient.transferTextChat({
            agentId: this.configData.AgentLoginID,
            deviceId: this.configData.StationID,
            tmacServer: this.configData.TmacServer,
            chatMode: item.Channel === 'audiochat' ? 'audio' : item.Channel === 'videochat' ? 'video' : 'text',
            comment: '',
            conferenceType: type,
            interactionId: item.InteractionID.toString(),
            lineId: 'bargein',
            sessionId: item.InteractionData.SessionId,
            toAgentId: this.agentData.agentId,
            toTmacServer: this.agentData.tmacServer
        })
            .then((resp: IResponse) => {
                // check the response
                if (resp.response && resp.response.ResultCode >= 0) {
                    this._appUIService.showSnackbar(`Chat ${type === 'conf' ? 'conference' : type} barge-in successful`, 'success');
                    // close the widget
                    this._aotWidgetService.destroyWidget(this.data.ID);
                } else {
                    this._appUIService.showSnackbar(`Chat ${type === 'conf' ? 'conference' : type} barge-in failed`, 'failure');
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Failed to barge-in', 'failure');
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On widget maximized event
     * @param state Maximzed flag
     */
    public maximizeEvent(state: boolean): void {
        this.maximized = state;
        if (state) {
            // TODO:: handle maximized view
            this.interactionDetailsTable.columns = this.mindisplayedColumns;
        } else {
            this.interactionDetailsTable.columns = this.mindisplayedColumns;
        }
    }

    /**
     * To check whether the feature is enabled for the agent
     * @param {AgentFeatures} feature Agent's feature
     * @param {'agent' | 'interaction'} type Type of feature
     * @param {string} subType Subtype of feature
     */
    public featureCheck(feature: AgentFeatures, type: 'agent' | 'interaction', subType: string): boolean {
        // if not allow supervisor or in map the item is not found return false
        if (!feature.Feature.startsWith('AllowSupervisor') || !this.featureMap[feature.Feature]) {
            return false;
        }

        // check for the type and subtype
        if (this.featureMap[feature.Feature].Type !== type || this.featureMap[feature.Feature].SubType !== subType) {
            return false;
        }

        // check if agent action
        if (type === 'agent') {
            return feature.IsEnabled;
        }
        // check if interaction action
        else if (type === 'interaction' && this.featureMap[feature.Feature].Type === type && this.featureMap[feature.Feature].SubType === subType) {
            return feature.IsEnabled;
        } else {
            return false;
        }
    }

    /**
     * To perform action on agent interaction
     */
    public performInteractionAction(item: InteractionDataModel, feature: AgentFeatures): void {
        console.log('performAgentAction', { item, feature });
        switch (feature.Feature.toLowerCase()) {
            case AGENT_FEATURES.AllowSupervisorToBargeIn:
                break;
            case AGENT_FEATURES.AllowSupervisorToChatConference:
                this.performChatBargeIn('conf', item);
                break;
            case AGENT_FEATURES.AllowSupervisorToChatSilentMonitor:
                this.performChatBargeIn('silent', item);
                break;
            case AGENT_FEATURES.AllowSupervisorToChatWhisper:
                this.performChatBargeIn('whisper', item);
                break;
            case AGENT_FEATURES.AllowSupervisorToFaxTransferAgent:
                break;
            case AGENT_FEATURES.AllowSupervisorToFaxTransferAgent:
                break;
            case AGENT_FEATURES.AllowSupervisorToInteractionNotification:
                break;
            case AGENT_FEATURES.AllowSupervisorToSilentMonitor:
                break;
            case AGENT_FEATURES.AllowSupervisorToViewEmailDetails:
                break;
            default:
        }
    }
}

// for more info visit - https://angular.io/api/core
