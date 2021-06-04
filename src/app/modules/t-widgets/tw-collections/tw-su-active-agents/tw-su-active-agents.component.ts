import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { DashboardService } from '@services/dashboard.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    AgentFeatures,
    AgentStatusChangeEvent,
    AgentTabCount,
    IAgentData,
    IAUXCodes,
    IResponse,
    SDKClient,
    SuAgentDataModel,
    SuAgentModel,
    TUtils
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_FEATURES, AGENT_FEATURES_MAP, COMMON_ERR_MESSAGE } from 'app/constants';
import { CustomSDKEvent, IWidget, QuizEventJsonData } from 'app/interfaces';
import { InstantMessagingService } from 'app/layout/components/instant-messaging/instant-messaging.service';
import { TwWidgetModel } from 'app/models';
import { map, orderBy, random } from 'lodash';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Active agents component widget
 */
@Component({
    selector: 'tw-su-active-agents',
    templateUrl: './tw-su-active-agents.component.html',
    styleUrls: ['./tw-su-active-agents.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwSuActiveAgentsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: any;

    /**
     * Fuse Config
     */
    // fuseConfig: any;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * Use info
     */
    user: IAgentData;
    /**
     * Agent list
     */
    agentList: SuAgentModel[];
    /**
     * Filtered Agents
     */
    filteredAgents: SuAgentModel[];
    /**
     * Search key
     */
    searchTerm: string;
    /**
     * Selected Agent
     */
    selectedAgent: string;
    /**
     * Agent features
     */
    featureMap = AGENT_FEATURES_MAP;
    /**
     * Activity widget
     * Need more description
     */
    activityWidget: IWidget;
    /**
     * Aux code list
     * Need more description
     */
    auxCodesList: IAUXCodes[];
    /**
     * To sort agent list
     */
    sortBy: string;
    /**
     * Sort type
     */
    sortType: 'desc' | 'asc';
    /**
     * Reload agent data flag
     */
    reload: boolean;

    /**
     * Available quiz intents
     */
    availableQuizIntents = [
        { name: 'General Quiz', intent: 'GeneralQuiz' },
        { name: 'Product Quiz', intent: 'CallCenterQuiz' },
        { name: 'Training Quiz', intent: 'CallCenterQuiz' }
    ];

    /**
     * Is Agent a supervisor
     */
    isAgentSupervisor: boolean;

    /**
     * Constructor
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private _dashboardService: DashboardService,
        private _fuseSidebarService: FuseSidebarService,
        private _instantMessagingService: InstantMessagingService
    ) {
        super();

        this.agentList = [];
        this.filteredAgents = [];
        this.user = SDKClient.getAgentData();
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
        this.isAgentSupervisor = SDKClient.getAgentData().agentProfile === 'S';

        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
        //     this.fuseConfig = config;
        // });

        this.sortBy = this.data.Data.SortBy ?? 'AgentName';
        this.sortType = this.data.Data.SortType ?? 'asc';

        this._tmacEventService
            .getEvents(['SupervisorAgentListEvent', 'TeamAgentListDataEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        // get agent aux codes
        SDKClient.loadAUXCodes(false, null).then((result: IResponse) => {
            // check if the data is null
            if (result.response && result.response.length > 0) {
                // filter and assign the aux codes
                this.auxCodesList = result.response.filter((a: IAUXCodes) => a.Display === 1);
            }
        });
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * SupervisorAgentListEvent handler
     * @method SupervisorAgentListEvent
     * @param {CustomSDKEvent} evt
     */
    private SupervisorAgentListEvent = (evt: CustomSDKEvent) => {
        // filter for excpet me
        this.agentList = this.filteredAgents = evt.Data || [];
        // check any search term is there, then filter
        if (this.searchTerm) {
            this.filterAgents();
        }

        // sort agent list
        this.sortAgentList();

        if (this.reload) {
            this.reload = false;
            this._appUIService.showSnackbar('Agent data is reloaded');
        }
    };

    /**
     * TeamAgentListDataEvent Handler
     * @method TeamAgentListDataEvent
     * @param {CustomSDKEvent} evt
     */
    private TeamAgentListDataEvent = (evt: CustomSDKEvent) => {
        if (this.agentList.length === 0) {
            return;
        }

        this.agentList.forEach((item1: SuAgentModel, index1) => {
            evt.Data.forEach((item2: SuAgentDataModel) => {
                if (item2.AgentLoginID === item1.AgentLoginID) {
                    this.agentList[index1] = { ...item1, ...item2 };
                    this.agentList[index1].ChannelCount = orderBy(this.agentList[index1].ChannelCount, ['CurrentCount'], ['desc']);
                }
            });
        });

        this.filteredAgents = this.agentList;

        if (this.searchTerm) {
            this.filterAgents();
        }

        // sort agent list
        this.sortAgentList();
    };

    /**
     * createActivityWidget
     * Need more description
     * @method createActivityWidget
     * @param {any} item
     */
    private createActivityWidget(item: any): void {
        // create activity details widget
        const widget = new TwWidgetModel(item.title, 'tw-su-agent-activity-details', 'local_activity');
        widget.Config.Actions = ['collapse', 'destroy'];
        widget.Config.ViewState = 'maximize';
        widget.Config.Anchor = true;
        widget.Config.Position.X = 3;
        widget.Config.Position.Y = 4;
        widget.Config.Class = 'mx-cover no-restore inherit-header';
        widget.Data.ActivityDetails = item;

        // push the widget to list
        this.activityWidget = widget;
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Filter Agents
     * @method filterAgents
     */
    public filterAgents(): void {
        const searchTerm = this.searchTerm.toLowerCase();
        // Search
        if (searchTerm === '') {
            this.filteredAgents = this.agentList;
        } else {
            this.filteredAgents = this.agentList.filter((agentItem) => {
                return agentItem.AgentName.toLowerCase().includes(searchTerm);
            });
        }
    }

    /**
     * To sort agent list
     *
     * @param {string} by
     */
    public sortAgentList(by?: string): void {
        // check the sort type
        if (this.sortBy === by) {
            this.sortType = this.sortType === 'desc' ? 'asc' : 'desc';
        }
        // check if type is provided
        else if (by) {
            this.sortBy = by;
        }

        // sort the agent list by type
        this.filteredAgents = orderBy(this.filteredAgents, this.sortBy, this.sortType);
    }

    /**
     * Track by for avoiding rerender
     * @method trackByID
     * @param {number} index
     * @param {any} agent
     */
    public trackByID(index: number, agent: any): string {
        return agent.AgentLoginID;
    }

    /**
     * Select an agent
     * @method selectAgent
     * @param {any} agent
     */
    public selectAgent(agent: any): void {
        if (this.selectedAgent === agent.AgentLoginID) {
            this.selectedAgent = null;
        } else {
            this.selectedAgent = agent.AgentLoginID;
        }
    }

    /**
     * Check Feature
     * @method featureCheck
     * @param {AgentFeatures} feature
     * @param {String} type
     * @param {String} subType
     */
    public featureCheck(feature: AgentFeatures, type: string, subType: string): boolean {
        // if not allow supervisor or in map the item is not found return false
        if (
            !feature.Feature.startsWith('AllowSupervisor') ||
            feature.Feature === 'AllowSupervisorToChangeStatus' ||
            !this.featureMap[feature.Feature]
        ) {
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
     * Perform Agent Action
     * @method performAgentAction
     * @param {SuAgentDataModel} agent
     * @param {AgentFeatures} feature
     */
    public performAgentAction(agent: SuAgentModel, feature: AgentFeatures): void {
        switch (feature.Feature.toLowerCase()) {
            case AGENT_FEATURES.AllowSupervisorToCapturePicture:
                this._appUIService.showSnackbar('Please wait, retrieving information...', 'loading');
                SDKClient.getAgentActivity(
                    {
                        agentId: agent.AgentLoginID,
                        consent: false,
                        location: agent.AgentFeatures.filter((f) => f.Feature === 'IsLocationEnabled')?.[0].IsEnabled || false,
                        screenshot: agent.AgentFeatures.filter((f) => f.Feature === 'IsScreenCaptureEnabled')?.[0].IsEnabled || false,
                        screenvideo: agent.AgentFeatures.filter((f) => f.Feature === 'IsScreenCaptureEnabled')?.[0].IsEnabled || false,
                        snapshot: agent.AgentFeatures.filter((f) => f.Feature === 'IsCameraCaptureEnabled')?.[0].IsEnabled || false,
                        source: 'supervisor',
                        sourceId: SDKClient.getAgentData().agentId
                    },
                    { agent }
                )
                    .then((dt: IResponse) => {
                        const response = dt.response;
                        const agentInfo = dt.userObject.agent;
                        if (response.Response < 0) {
                            this._appUIService.showSnackbar('Request timedout!', 'failure');
                            return;
                        }
                        this._appUIService.showSnackbar('Done', 'success');
                        this.createActivityWidget({
                            title: `Activity - ${agentInfo.AgentName}`,
                            profilePicture: response.ProfilePic,
                            details: [
                                {
                                    Title: 'Agent Name',
                                    Value: agentInfo.AgentName
                                },
                                {
                                    Title: 'Agent ID',
                                    Value: agentInfo.AgentLoginID
                                },
                                {
                                    Title: 'Network IP',
                                    Value: agentInfo.AgentIP
                                }
                            ],
                            snapshot: response.Camera,
                            location: response.Location ? JSON.parse(response.Location) : '',
                            screenshot: response.Screenshot,
                            screenvideo: response.Screenvideo
                        });
                    })
                    .catch((error: string) => {
                        this._appUIService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
                        // log the error to server for troubleshooting purpose
                        TUtils.Logger.error('Exception in performAgentAction.AgentSnapShotEvent', error);
                    });
                break;
            case AGENT_FEATURES.AllowSupervisorToLogout:
                // check the agent's current status
                if (agent.CurrentAgentStatus.toLowerCase().includes('on call')) {
                    this._appUIService.showSnackbar(`Logout is not allowed, ${agent.AgentName} is on call`, 'failure');
                    return;
                }
                // confirm logout
                const confirmDialogRef = this._appUIService.showAppConfirmDialog(
                    'logout',
                    null,
                    `Are you sure you want to logout ${agent.AgentName}?`
                );
                confirmDialogRef.afterClosed().subscribe((dialogResult) => {
                    if (dialogResult) {
                        // show the progress bar
                        this._appUIService.showSnackbar('Please wait, Logging out the user..', 'loading');
                        SDKClient.logout(
                            {
                                deviceId: agent.StationID,
                                reason: 'SupervisorLogout'
                            },
                            null
                        ).then((dt: IResponse) => {
                            // check if the logout is success
                            if (dt.response && dt.response.ResultCode === 0) {
                                // filter the logout agent
                                this.filteredAgents = this.filteredAgents.filter((a) => a.StationID !== agent.StationID);
                                // route back to login page
                                this._appUIService.showSnackbar('Logged out successfully', 'success');
                            } else {
                                // logout error
                                this._appUIService.showSnackbar('Logout failed, please try again', 'failure');
                            }
                        });
                    }
                });
                break;
            case AGENT_FEATURES.AllowSupervisorToSendNotification:
                this._fuseSidebarService.getSidebar('chatPanel').toggleOpen();
                setTimeout(() => {
                    this._instantMessagingService.selectUser(agent.AgentLoginID);
                }, 300);
                break;
            default:
        }
    }

    /**
     * Check for active interactions
     * @method checkForActiveInteraction
     * @param {AgentTabCount[]} channelItems
     */
    public checkForActiveInteraction(channelItems: AgentTabCount[]): boolean {
        let isActive = false;

        channelItems.forEach((channelItem: AgentTabCount) => {
            if (channelItem.CurrentCount > 0) {
                isActive = true;
            }
        });

        return isActive;
    }

    /**
     * View interactions by agent
     * @method viewInteractions
     * @param {SuAgentModel} item
     */
    public viewInteractions(item: SuAgentModel): void {
        const widget = new TwWidgetModel('Interaction Details - ' + item.AgentName, 'tw-su-agent-interactions');
        widget.Config.Anchor = true;
        widget.Config.Position.W = 800;
        widget.Config.Position.H = 300;
        widget.Config.Actions = ['maximize', 'collapse', 'destroy'];
        widget.Data = item;
        this._aotWidgetService.addWidget(widget);
    }

    /**
     * Change agent status
     * @method changeAgentStatus
     * @param {SuAgentDataModel} agent
     * @param {IAUXCodes} item
     */
    public changeAgentStatus(agent: SuAgentModel, item: IAUXCodes): void {
        this._appUIService.showSnackbar('Please wait, changing status...', 'loading');
        // change the status
        SDKClient.changeStatus(
            {
                deviceId: agent.StationID,
                type: item.Code.toLocaleLowerCase() === 'available' ? 'available' : item.Code.toLocaleLowerCase() === 'acw' ? 'acw' : 'aux',
                code: item.Value.toString()
            },
            item
        )
            .then((dt) => {
                if (dt.response.EventName === 'AgentStatusChangeEvent') {
                    // parse the result to AgentStatusChangeEvent
                    const response = dt.response as AgentStatusChangeEvent;
                    let message = 'Agent status changed successfully';
                    if (agent.CurrentAgentStatus.includes('On Call')) {
                        message = 'Agent is on call, status change request sent successfully';
                    }
                    this._appUIService.showSnackbar(message, 'success');
                    this.filteredAgents = map(this.filteredAgents, (agt: SuAgentModel) => {
                        if (agt.StationID === agent.StationID) {
                            agt.CurrentAgentStatus = response.Status;
                            agt.CurrentStatusDuration = 0;
                        }
                        return agt;
                    });
                } else {
                    this._appUIService.showSnackbar('Status change failed!', 'failure');
                }
            })
            .catch(() => {
                // logout error
                this._appUIService.showSnackbar('Error in status change, please try again', 'failure');
            });
    }

    /**
     *  Send Quiz intent to agent
     * @param {String} intentName
     * @param {SuAgentDataModel} item
     */
    public sendQuizIntent(intentName: string, item: SuAgentModel): void {
        if (!this.data.Data.TASUrl) {
            this._appUIService.showSnackbar('You missed a quiz event because TASUrl is missing in app config', 'failure');
            return;
        }

        const intentDetails = {
            GeneralQuiz: {
                ucid: 'Test',
                flowType: 'Test',
                campId: 'Test',
                station: 42002,
                phoneNumber: '6539284004'
            },
            CallCenterQuiz: {}
        };

        const JsonData: QuizEventJsonData = {
            url: this.data.Data.TASUrl,
            params: {
                intentname: intentName,
                customerId: random(100000, 999999, false),
                inSimulation: false,
                enableQuiz: true,
                ...intentDetails[intentName]
            }
        };
        const reqPacket = {
            agentId: item.AgentLoginID,
            eventString: JSON.stringify({
                EventName: 'GenericEvent',
                SubEventName: 'QuizEvent',
                JsonData: JSON.stringify(JsonData)
            }),
            isPriority: true,
            toTmacServer: item.TmacServer
        };
        SDKClient.addEventToAgentSession(reqPacket);
    }

    /**
     * To reload the list
     */
    public refreshList(): void {
        this.reload = true;
        this._dashboardService.reTriggerActiveAgents(this.user.agentId, this.user.teamId);
    }

    /**
     * Sends broadcast message to supervisor team
     */
    sendBroadcast(): void {
        const { agentId, teamId } = SDKClient.getAgentData();
        if (this.isAgentSupervisor) {
            const dialogRef = this._appUIService.showCustomDialog(
                'prompt',
                'Write the message to be broadcasted below',
                'Broadcast Message',
                { minRows: 5 },
                { minWidth: '30%' }
            );
            let erroredSnackbarMessage = '';
            dialogRef.afterClosed().subscribe({
                next: async (message) => {
                    try {
                        if (message) {
                            this._appUIService.showSnackbar('Sending Broadcast', 'loading');
                            const res = await SDKClient.setBroadcastMessageForTeam({
                                message,
                                supervisorId: agentId,
                                teamIds: [teamId]
                            });
                            res.response.forEach((teamRes) => {
                                if (teamRes.ResultCode < 0) {
                                    if (!erroredSnackbarMessage) {
                                        erroredSnackbarMessage = `Broadcast message sending failed for `;
                                    }
                                    erroredSnackbarMessage += teamRes.ResultMessage;
                                }
                            });
                            if (!erroredSnackbarMessage) {
                                this._appUIService.showSnackbar('Broadcast sent', 'success');
                            } else {
                                throw new Error(erroredSnackbarMessage);
                            }
                        }
                    } catch (e) {
                        if (!erroredSnackbarMessage) {
                            this._appUIService.showSnackbar('Something went wrong while sending broacast', 'failure');
                            console.error(e);
                        }
                    }
                },
                error: console.error
            });
        }
    }
}

// for more info visit - https://angular.io/api/core
