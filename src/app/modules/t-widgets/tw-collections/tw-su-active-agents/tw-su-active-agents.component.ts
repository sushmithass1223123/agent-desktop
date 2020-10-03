import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_FEATURES_MAP, COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, QuizEventJsonData } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import * as _ from 'lodash';
import { random } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { AgentFeatures, AgentTabCount, IAgentData, IAUXCodes, IResponse, SDKClient, SuAgentDataModel, SuAgentModel, TUtils } from 'tmac-sdk';

@Component({
    selector: 'tw-su-active-agents',
    templateUrl: './tw-su-active-agents.component.html',
    styleUrls: ['./tw-su-active-agents.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwSuActiveAgentsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    fuseConfig: any;
    appConfig: any;

    user: IAgentData;
    agentList: SuAgentModel[];
    filteredAgents: SuAgentModel[];
    searchTerm: string;
    selectedAgent: string;
    featureMap = AGENT_FEATURES_MAP;
    activityWidget: IWidget;
    auxCodesList: IAUXCodes[];

    availableQuizIntents = [
        { name: 'General Quiz', intent: 'GeneralQuiz' },
        { name: 'Product Quiz', intent: 'ProductQuiz' },
        { name: 'Learning Quiz', intent: 'LearningQuiz' }
    ];

    /**
     * Constructor
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _appDataService: AppDataService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService
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

        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        this.filteredAgents = [];

        // listen to agent list event
        SDKClient.events.on('SupervisorAgentListEvent', this.SupervisorAgentListEvent);
        SDKClient.events.on('TeamAgentListDataEvent', this.TeamAgentListDataEvent);
        SDKClient.events.on('AutoSelectSupervisorAgentEvent', this.AutoSelectSupervisorAgentEvent);

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

        // listen off agent list event
        SDKClient.events.off('SupervisorAgentListEvent', this.SupervisorAgentListEvent);
        SDKClient.events.off('TeamAgentListDataEvent', this.TeamAgentListDataEvent);
        SDKClient.events.off('AutoSelectSupervisorAgentEvent', this.AutoSelectSupervisorAgentEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private SupervisorAgentListEvent = (agentList: SuAgentModel[]) => {
        // filter for excpet me
        this.agentList = this.filteredAgents = agentList || [];
        // check any search term is there, then filter
        if (this.searchTerm) {
            this.filterAgents();
        }
    };

    private TeamAgentListDataEvent = (agentListData: SuAgentDataModel[]) => {
        if (this.agentList.length === 0) {
            return;
        }

        this.agentList.forEach((item1: SuAgentModel, index1) => {
            agentListData.forEach((item2: SuAgentDataModel) => {
                if (item2.AgentLoginID === item1.AgentLoginID) {
                    this.agentList[index1] = { ...item1, ...item2 };
                    this.agentList[index1].ChannelCount = _.orderBy(this.agentList[index1].ChannelCount, ['CurrentCount'], ['desc']);
                }
            });
        });

        this.agentList = _.orderBy(this.agentList, ['AgentName'], ['desc']);
        this.filteredAgents = this.agentList;

        if (this.searchTerm) {
            this.filterAgents();
        }
    };
    private AutoSelectSupervisorAgentEvent = (evt: any) => {
        this.selectedAgent = evt.AgentId;
    };

    private createActivityWidget(item: any): void {
        // create activity details widget
        const widget = new TwWidgetModel(item.title, 'tw-su-agent-activity-details', 'local_activity');
        widget.Config.Actions = ['minimize', 'destroy'];
        widget.Config.ViewState = 'maximize';
        widget.Config.Anchor = true;
        widget.Config.Position.X = 3;
        widget.Config.Position.Y = 4;
        widget.Config.Class = 'cover no-restore inherit-header';
        widget.Data.ActivityDetails = item;

        // push the widget to list
        this.activityWidget = widget;
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

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

    public selectAgent(agent: any): void {
        if (this.selectedAgent === agent.AgentLoginID) {
            this.selectedAgent = null;
        } else {
            this.selectedAgent = agent.AgentLoginID;
        }
    }

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

    public performAgentAction(agent: SuAgentModel, feature: AgentFeatures): void {
        console.log('performAgentAction', { agent, feature });

        switch (feature.Feature) {
            case 'AllowSupervisorToCapturePicture':
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
                        TUtils.Logger.log('Exception in performAgentAction.AgentSnapShotEvent', error);
                    });
                break;
            case 'AllowSupervisorToLogout':
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
            case 'AllowSupervisorToChangeStatus':
                break;
            default:
        }
    }

    public checkForActiveInteraction(channelItems: AgentTabCount[]): boolean {
        let isActive = false;

        channelItems.forEach((channelItem: AgentTabCount) => {
            if (channelItem.CurrentCount > 0) {
                isActive = true;
            }
        });

        return isActive;
    }

    public viewInteractions(item: SuAgentModel): void {
        const widget = new TwWidgetModel('Interaction Details - ' + item.AgentName, 'tw-su-agent-interactions');
        widget.Config.Anchor = true;
        widget.Config.Position.W = 800;
        widget.Config.Position.H = 300;
        widget.Config.Actions = ['maximize', 'minimize', 'destroy'];
        widget.Data = item;
        this._aotWidgetService.addWidget(widget);
    }

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
            .then(() => {
                // route back to login page
                this._appUIService.showSnackbar('Status changed successfully', 'success');
            })
            .catch(() => {
                // logout error
                this._appUIService.showSnackbar('Change status failed, please try again', 'failure');
            });
    }

    /**
     *  Send Quiz intent to agent
     * @param {String} intentname
     * @param {SuAgentDataModel} item
     */
    public sendQuizIntent(intentname: string, item: SuAgentModel): void {
        if (!this.data.Data.TASUrl) {
            this._appUIService.showSnackbar('You missed a quiz event because TASUrl is missing in app config', 'failure');
            return;
        }
        const JsonData: QuizEventJsonData = {
            url: this.data.Data.TASUrl,
            params: {
                intentname,
                customerId: random(100000, 999999, false),
                inSimulation: false,
                enableQuiz: true
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
}

// for more info visit - https://angular.io/api/core
