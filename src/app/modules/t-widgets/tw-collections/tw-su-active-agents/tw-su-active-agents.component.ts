import { AOTWidget, TwSuActiveAgents } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { AgentFeaturesService } from '@services/agent-features.service';
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
    AgentNotificaitonEvent
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_FEATURES, AGENT_FEATURES_MAP } from 'app/constants';
import { CustomSDKEvent, IWidget, QuizEventJsonData } from 'app/interfaces';
import { InstantMessagingService } from 'app/layout/components/instant-messaging/instant-messaging.service';
import { TwWidgetModel } from 'app/models';
import { map, orderBy, random } from 'lodash';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { from } from 'rxjs';
import { groupBy, mergeMap, toArray } from 'rxjs/operators';

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
    @Input() data: TwSuActiveAgents;

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
     * Selected group
     */
    selectedGroup: string;
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
     * To allow broadcast
     */
    allowBroadcast: boolean;

    agentListOnHold: String[] = [];

    groupedAgentList = [];

    groupedBy;

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
        private _instantMessagingService: InstantMessagingService,
        private _agentFeaturesService: AgentFeaturesService,
        private translocoService: TranslocoService
    ) {
        super('TwSuActiveAgentsComponent');

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

        this.sortBy = this.data.Data.SortBy ?? 'AgentName';
        this.sortType = this.data.Data.SortType ?? 'asc';

        this._tmacEventService
            .getNonInteractionEvents(['SupervisorAgentListEvent', 'TeamAgentListDataEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        // get agent aux codes
        SDKClient.loadAUXCodes(false).then((result: IResponse) => {
            // check if the data is null
            if (result.response && result.response.length > 0) {
                // filter and assign the aux codes
                this.auxCodesList = result.response.filter((a: IAUXCodes) => a.Display === 1 && a.Value !== 110 && a.Value !== 111);
            }
        });

        this._agentFeaturesService.features.pipe(takeUntil(this.unsubscribeAll)).subscribe((change: boolean) => {
            if (change) {
                // check agent features
                this.checkAgentFeatures();
            }
        });

        // check agent features
        this.checkAgentFeatures();

        // register to event
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To check agent features for IsSetBroadcastEnabled
     */
    private checkAgentFeatures(): void {
        try {
            const checkFeature = SDKClient.getAgentData().featuresList.filter(
                (f) => f.Feature.toLowerCase() === AGENT_FEATURES.IsSetBroadcastEnabled && f.IsEnabled
            )?.[0];
            this.allowBroadcast = (SDKClient.getAgentData().agentProfile === 'S' && checkFeature?.IsEnabled) ?? false;
        } catch (error) {}
    }

    /**
     * createActivityWidget
     * Need more description
     * @method createActivityWidget
     * @param {any} item
     */
    private createActivityWidget(item: any): void {
        // if the widget opened, send the event to update
        if (this.activityWidget) {
            this._tmacEventService.emitSDKEvent({
                event: {
                    EventName: 'AgentActivityEvent',
                    ...item
                },
                isInteractionEvent: false
            });
            return;
        }

        const widget = new TwWidgetModel(item.title, 'tw-su-agent-activity-details', 'local_activity');
        widget.Config.Actions = ['collapse', 'destroy'];
        widget.Config.ViewState = 'maximize';
        widget.Config.Anchor = true;
        widget.Config.Position.X = 3;
        widget.Config.Position.Y = 4;
        widget.Config.Class = 'mx-cover no-restore inherit-header';
        widget.Data.ActivityDetails = item;
        widget.destroy = () => {
            this.activityWidget = null;
        };
        this.activityWidget = widget;
    }

    /**
     * SupervisorAgentListEvent handler
     * @method SupervisorAgentListEvent
     * @param {CustomSDKEvent} evt
     */
    SupervisorAgentListEvent(evt: CustomSDKEvent): void {
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
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.agentDataReloadSuccess'));
        }

        if (this.groupedBy) {
            this.groupAgentListBy(this.groupedBy['groupAttribute'], this.groupedBy['groupTitle']);
        }
    }

    /**
     * TeamAgentListDataEvent Handler
     * @method TeamAgentListDataEvent
     * @param {CustomSDKEvent} evt
     */
    TeamAgentListDataEvent(evt: CustomSDKEvent): void {
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

        if (this.groupedBy) {
            this.groupAgentListBy(this.groupedBy['groupAttribute'], this.groupedBy['groupTitle']);
        }
    }

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
        this.filteredAgents = this.filteredAgents.sort((a, b) => {
            if (this.sortType === 'asc') {
                if (typeof a[this.sortBy] === 'string' && typeof b[this.sortBy] === 'string') {
                    return a[this.sortBy].localeCompare(b[this.sortBy], undefined, { numeric: true });
                } else {
                    return a[this.sortBy] > b[this.sortBy] ? 1 : a[this.sortBy] < b[this.sortBy] ? -1 : 0;
                }
            } else {
                if (typeof a[this.sortBy] === 'string' && typeof b[this.sortBy] === 'string') {
                    return b[this.sortBy].localeCompare(a[this.sortBy], undefined, { numeric: true });
                } else {
                    return b[this.sortBy] > a[this.sortBy] ? 1 : b[this.sortBy] < a[this.sortBy] ? -1 : 0;
                }
            }
        });
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
     * Select an agent
     * @method selectAgent
     * @param {any} agent
     */
     public selectGroup(group: any): void {
        if (this.selectedGroup === group.groupName) {
            this.selectedGroup = null;
        } else {
            this.selectedGroup = group.groupName;
        }
    }

    /**
     * Check Feature
     * @method featureCheck
     * @param {AgentFeatures} feature
     * @param {String} type
     * @param {String} subType
     */
    public featureCheck(feature: AgentFeatures, type: 'agent' | 'interaction', subType: string): boolean {
        // if not allow supervisor or in map the item is not found return false
        if (
            !feature.Feature.startsWith('AllowSupervisor') ||
            feature.Feature === 'AllowSupervisorToChangeStatus' ||
            !this.featureMap[feature.Feature]
        ) {
            return false;
        }

        // check for the type and subtype
        if (this.featureMap[feature.Feature].Type !== type || !this.featureMap[feature.Feature].SubType.includes(subType)) {
            return false;
        }

        // check if agent action
        if (type === 'agent') {
            return feature.IsEnabled;
        }
        // check if interaction action
        else if (
            type === 'interaction' &&
            this.featureMap[feature.Feature].Type === type &&
            this.featureMap[feature.Feature].SubType.includes(subType)
        ) {
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
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.agentDataloadingMsg'), 'loading');
                SDKClient.getAgentActivity(
                    {
                        agentId: agent.AgentLoginID,
                        consent: false,
                        location: agent.AgentFeatures.filter((f) => f.Feature === 'IsLocationEnabled')?.[0].IsEnabled || false,
                        screenshot: agent.AgentFeatures.filter((f) => f.Feature === 'IsScreenCaptureEnabled')?.[0].IsEnabled || false,
                        screenvideo: agent.AgentFeatures.filter((f) => f.Feature === 'IsScreenCaptureEnabled')?.[0].IsEnabled || false,
                        snapshot: agent.AgentFeatures.filter((f) => f.Feature === 'IsCameraCaptureEnabled')?.[0].IsEnabled || false,
                        source: 'supervisor',
                        sourceId: SDKClient.getAgentData().agentId,
                        tmacServer: agent.TmacServer
                    },
                    { agent }
                )
                    .then((dt: IResponse) => {
                        const response = dt.response;
                        const agentInfo = dt.userObject.agent;
                        if (response.Response < 0) {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.requestTimeoutMsg'), 'failure');
                            return;
                        }
                        this._appUIService.showSnackbar('Done', 'success');
                        this.createActivityWidget({
                            title: `Activity - ${agentInfo.AgentName}`,
                            agentId: agentInfo.AgentLoginID,
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
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.agentActivityFailed'), 'failure');
                        this.logger.error('Error in performAgentAction.AgentSnapShotEvent', error);
                    });
                break;
            case AGENT_FEATURES.AllowSupervisorToLogout:
                // check the agent's current status
                if (agent.CurrentAgentStatus.toLowerCase().includes('on call')) {
                    this._appUIService.showSnackbar(
                        this.translocoService.translate('widgets.activeAgents.logoutNotAllowed') +
                            `${agent.AgentName}` +
                            this.translocoService.translate('widgets.activeAgents.isOnCall'),
                        'failure'
                    );
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
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.logoutLoadingMessage'), 'loading');
                        SDKClient.logout(
                            {
                                deviceId: agent.StationID,
                                reason: 'SupervisorLogout',
                                tmacServer: agent.TmacServer
                            },
                            null
                        ).then((dt: IResponse) => {
                            // check if the logout is success
                            if (dt.response && dt.response.ResultCode === 0) {
                                // filter the logout agent
                                this.filteredAgents = this.filteredAgents.filter((a) => a.StationID !== agent.StationID);
                                // route back to login page
                                this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.logoutSuccess'), 'success');
                            } else {
                                // logout error
                                this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.logoutFailed'), 'failure');
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
        const widget = new TwWidgetModel('Interaction Details - ' + item.AgentName, 
        'tw-su-agent-interactions', null, item.AgentLoginID);
        widget.Config.Anchor = true;
        widget.Config.Position.W = 800;
        widget.Config.Position.H = 300;
        widget.Config.Actions = ['maximize', 'collapse', 'destroy'];
        widget.Data = item;
        widget.ExtraConfig = this.data.Data;
        this._aotWidgetService.addWidget(widget as AOTWidget);
    }

    /**
     * Change agent status
     * @method changeAgentStatus
     * @param {SuAgentDataModel} agent
     * @param {IAUXCodes} item
     */
    public changeAgentStatus(agent: SuAgentModel, item: IAUXCodes): void {
        this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.loadingChangeStatus'), 'loading');
        // change the status
        SDKClient.changeStatus(
            {
                deviceId: agent.StationID,
                type: item.Code.toLocaleLowerCase() === 'available' ? 'available' : item.Code.toLocaleLowerCase() === 'acw' ? 'acw' : 'aux',
                code: item.Value.toString(),
                tmacServer: agent.TmacServer
            },
            item
        )
            .then((dt) => {
                if (dt.response.EventName === 'AgentStatusChangeEvent') {
                    // parse the result to AgentStatusChangeEvent
                    const response = dt.response as AgentStatusChangeEvent;
                    // notification to the agent
                    let notification = `Supervisor ${this.user.agentName} has changed your status to ${response.Status}`;
                    // snackbar message
                    let message = this.translocoService.translate('widgets.activeAgents.agentStatusSuccess');
                    // check if the agent is on call
                    if (agent.CurrentAgentStatus.includes('On Call')) {
                        message = this.translocoService.translate('widgets.activeAgents.statusChangeRequestSuccess');
                        message = message?.replace('#agentName', agent.AgentName);
                        notification += ', will be reflecting after the interaction';
                    }

                    SDKClient.sendNotification({
                        agentIds: [agent.AgentLoginID],
                        informAllTmac: false,
                        message: notification,
                        supervisorId: '',
                        teamId: '',
                        type: 'notify',
                        tmacServer: agent.TmacServer
                    });

                    this._appUIService.showSnackbar(message, 'success');

                    // change the status on active list immediatly, since the dashboard refresh may be delayed
                    this.filteredAgents = map(this.filteredAgents, (agt: SuAgentModel) => {
                        if (agt.StationID === agent.StationID) {
                            agt.CurrentAgentStatus = response.Status;
                            agt.CurrentStatusDuration = 0;
                        }
                        return agt;
                    });
                } else {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.statusChangeFailed'), 'failure');
                }
            })
            .catch(() => {
                // logout error
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.statusChangeError'), 'failure');
            });
    }

    /**
     *  Send Quiz intent to agent
     * @param {String} intentName
     * @param {SuAgentDataModel} item
     */
    public sendQuizIntent(intentName: string, item: SuAgentModel): void {
        if (!this.data.Data.TASUrl) {
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.quizMissedError'), 'failure');
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
        if (this.allowBroadcast) {
            const dialogRef = this._appUIService.showCustomDialog(
                'prompt',
                this.translocoService.translate('widgets.activeAgents.broadCastPopupTitle'),
                this.translocoService.translate('widgets.activeAgents.broadCastMsgPlaceholder'),
                { minRows: 5 },
                { minWidth: '30%' }
            );
            let erroredSnackbarMessage = '';
            dialogRef.afterClosed().subscribe({
                next: async (message) => {
                    try {
                        if (message) {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.activeAgents.broadCastSending'), 'loading');
                            const res = await SDKClient.setBroadcastMessageForTeam({
                                message,
                                supervisorId: agentId,
                                teamIds: [teamId]
                            });
                            res.response.forEach((teamRes) => {
                                if (teamRes.ResultCode < 0) {
                                    if (!erroredSnackbarMessage) {
                                        erroredSnackbarMessage = this.translocoService.translate('widgets.activeAgents.broadCastMsgFailed');
                                    }
                                    erroredSnackbarMessage += teamRes.ResultMessage;
                                }
                            });
                            if (!erroredSnackbarMessage) {
                                this._appUIService.showSnackbar(
                                    this.translocoService.translate('widgets.activeAgents.broadCaseMsgSuccess'),
                                    'success'
                                );
                            } else {
                                throw new Error(erroredSnackbarMessage);
                            }
                        }
                    } catch (e) {
                        if (!erroredSnackbarMessage) {
                            this._appUIService.showSnackbar(
                                this.translocoService.translate('widgets.activeAgents.broadCaseMsgFailedGeneric'),
                                'failure'
                            );
                            console.error(e);
                        }
                    }
                },
                error: console.error
            });
        }
    }

    /**
     * AgentNotificaitonEvent Handler
     * @method AgentNotificaitonEvent
     * @param {AgentNotificaitonEvent} evt
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // check the type

        if (evt.Type === 'CustomerOnHold') {
            this.agentListOnHold.push(evt.FromAgentId);
            this.updateOnHoldAgentList(evt.FromAgentId);
        }
    };

    /**
     *
     * @param agentId ID of agent who has kept customer on hold
     * removing the user from the list after sometime since we do not receive unhold notification yet, this logic can be removed after unhold
     * - logic is implemented
     */
    updateOnHoldAgentList(agentId) {
        setTimeout(() => {
            this.agentListOnHold.splice(this.agentListOnHold.indexOf(agentId), 1);
        }, 9900);
    }

    /**
     *
     * @param groupAttribute : An attribute by which to group the agents
     * @param groupTitle : A readable attribute as a title on the group to display
     */
    groupAgentListBy(groupAttribute, groupTitle) {
        this.groupedBy = { groupTitle: groupTitle, groupAttribute: groupAttribute };
        this.groupedAgentList = [];
        const source = from(this.filteredAgents);
        const values = source.pipe(
            groupBy((a) => a[groupAttribute]),
            mergeMap((group) => group.pipe(toArray()))
        );
        values.subscribe((val) => {
            const group = {
                groupName: val[0][groupTitle] ? val[0][groupTitle] : val[0][groupAttribute],
                list: val,
                size: val ? val.length : 0
            };
            this.groupedAgentList.push(group);
        });
    }

    clearGroup() {
        this.groupedBy = undefined;
    }
}

// for more info visit - https://angular.io/api/core
