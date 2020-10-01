import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { DashboardService } from '@services/dashboard.service';
import { IWidget } from 'app/interfaces';
import { SDKClient, SuAgentInteractionModel, AgentFeatures, SuAgentModel, InteractionDataModel, IAgentData, IResponse } from 'tmac-sdk';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AGENT_FEATURES_MAP, COMMON_ERR_MESSAGE } from 'app/constants';
import { AppUiService } from '@services/app-ui.service';
import { AOTWidgetService } from '@services/aot-widget.service';

@Component({
    selector: 'tw-su-agent-interactions',
    templateUrl: './tw-su-agent-interactions.component.html',
    styleUrls: ['./tw-su-agent-interactions.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuAgentInteractionsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;


    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    configData: SuAgentModel;

    maximized = false;
    interactionList: any;

    mindisplayedColumns: string[] = ['InteractionID', 'Channel', 'LastStatus', 'User', 'ActiveTime', 'HoldTime', 'Actions'];

    featureMap = AGENT_FEATURES_MAP;
    agentData: IAgentData;

    interactionDetailsTable = {
        source: new MatTableDataSource([]),
        columns: this.mindisplayedColumns,
        loaded: false
    };

    /**
     * Constructor 
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _appDataService: AppDataService,
        private _dashboardService: DashboardService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService
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
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.fuseConfig = config;
                }
            );

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.appConfig = config;
                }
            );

        // assign the widget data
        this.configData = this.data.Data;

        // register to event
        SDKClient.events.on('TeamAgentInteractionDetailsEvent', this.TeamAgentInteractionDetailsEvent);

        // start receiving data
        this._dashboardService.triggerAgentInteractions(this.configData?.AgentLoginID, true);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('TeamAgentInteractionDetailsEvent', this.TeamAgentInteractionDetailsEvent);

        // stop receiving data
        this._dashboardService.triggerAgentInteractions(this.configData?.AgentLoginID, false);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private TeamAgentInteractionDetailsEvent = (data: SuAgentInteractionModel[]) => {
        console.log('TeamAgentInteractionDetailsEvent', data);
        // if the list is empty the return
        if (data.length === 0) {
            return;
        }

        // filter for the agent
        if (data[0].AgentLoginID !== this.configData?.AgentLoginID) {
            return;
        }

        // assign the interaction details 
        this.interactionList = data[0].Interactions;

        this.interactionDetailsTable.loaded = true;
        this.interactionDetailsTable.source = new MatTableDataSource(this.interactionList);
        this.interactionDetailsTable.source.sort = this.sort;
        this.interactionDetailsTable.source.paginator = this.paginator;
    }

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
                }
                else {
                    this._appUIService.showSnackbar(`Chat ${type === 'conf' ? 'conference' : type} barge-in failed`, 'failure');
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
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
        }
        else {
            return false;
        }
    }

    /**
     * To perform action on agent interaction
     */
    public performInteractionAction(item: InteractionDataModel, feature: AgentFeatures): void {
        console.log('performAgentAction', { item, feature });
        switch (feature.Feature) {
            case 'AllowSupervisorToBargeIn':
                break;
            case 'AllowSupervisorToChatConference':
                this.performChatBargeIn('conf', item);
                break;
            case 'AllowSupervisorToChatSilentMonitor':
                this.performChatBargeIn('silent', item);
                break;
            case 'AllowSupervisorToChatWhisper':
                this.performChatBargeIn('whisper', item);
                break;
            case 'AllowSupervisorToFaxTransferAgent':
                break;
            case 'AllowSupervisorToFaxTransferSelf':
                break;
            case 'AllowSupervisorToInteractionNotification':
                break;
            case 'AllowSupervisorToSilentMonitor':
                break;
            case 'AllowSupervisorToViewEmailDetails':
                break;
            case 'AllowSupervisorToViewEmailDetails':
                break;
            default:
        }
    }
}

// for more info visit - https://angular.io/api/core
