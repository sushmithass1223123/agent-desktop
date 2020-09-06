import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import * as _ from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { AgentFeatures, IAgentData, SDKClient, SuAgentDataModel, SuAgentModel, IResponse, TUtils } from 'tmac-sdk';
import { TwWidgetModel } from 'app/models';
import { IWidget } from 'app/interfaces';

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
    @Output() selectActiveAgent = new EventEmitter();

    fuseConfig: any;
    appConfig: any;

    user: IAgentData;
    agentList: SuAgentModel[];
    filteredAgents: SuAgentModel[];
    searchTerm: string;
    selectedAgent = null;

    featureMap = {
        AllowSupervisorToBargeIn: {
            Type: 'interaction',
            SubType: 'voice',
            Icon: 'call_merge',
            Label: 'Barge-In'
        },
        AllowSupervisorToCapturePicture: {
            Type: 'agent',
            SubType: '',
            Icon: 'fact_check',
            Label: 'View Activity'
        },
        AllowSupervisorToChangeStatus: {
            Type: 'agent',
            SubType: '',
            Icon: 'track_changes',
            Label: 'Change Status'
        },
        AllowSupervisorToChatConference: {
            Type: 'interaction',
            SubType: 'textchat',
            Icon: 'forum',
            Label: 'Conference'
        },
        AllowSupervisorToChatSilentMonitor: {
            Type: 'interaction',
            SubType: 'textchat',
            Icon: 'speaker_notes',
            Label: 'Silent Monitor'
        },
        AllowSupervisorToChatWhisper: {
            Type: 'interaction',
            SubType: 'textchat',
            Icon: 'quickreply',
            Label: 'Whisper'
        },
        AllowSupervisorToFaxTransferAgent: {
            Type: 'interaction',
            SubType: 'fax',
            Icon: 'forward',
            Label: 'Transfer Fax'
        },
        AllowSupervisorToFaxTransferSelf: {
            Type: 'interaction',
            SubType: 'fax',
            Icon: 'play_for_work',
            Label: 'Self Transfer'
        },
        AllowSupervisorToInteractionNotification: {
            Type: 'interaction',
            SubType: 'all',
            Icon: 'notification_important',
            Label: 'Interaction Notification'
        },
        AllowSupervisorToLogout: {
            Type: 'agent',
            SubType: '',
            Icon: 'power_settings_new',
            Label: 'Logout'
        },
        AllowSupervisorToSendNotification: {
            Type: 'agent',
            SubType: '',
            Icon: 'notifications',
            Label: 'Send Notification'
        },
        AllowSupervisorToSilentMonitor: {
            Type: 'interaction',
            SubType: 'voice',
            Icon: 'contactless',
            Label: 'Silent Monitor'
        },
        AllowSupervisorToViewEmailDetails: {
            Type: 'interaction',
            SubType: '',
            Icon: 'email',
            Label: 'View Details'
        }
    };

    activityWidget: IWidget;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(private _fuseConfigService: FuseConfigService, private _appDataService: AppDataService) {
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private SupervisorAgentListEvent = (agentList: SuAgentModel[]) => {
        console.log('agentList', agentList);

        // filter for excpet me
        this.agentList = this.filteredAgents = agentList || [];
        // check any search term is there, then filter
        if (this.searchTerm) {
            this.filterAgents();
        }
    }

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
    }

    private createActivityWidget(item: any): void {
        // create activity details widget
        const widget = new TwWidgetModel(item.dateTime, 'tw-su-agent-activity-details', 'local_activity');
        widget.Config.Actions = ['minimize', 'destroy'];
        widget.Config.ViewState = 'maximize';
        widget.Config.Position.X = 3;
        widget.Config.Position.Y = 4;
        widget.Config.Class = 'cover no-restore';
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
        if (this.selectedAgent?.AgentLoginID === agent.AgentLoginID) {
            this.selectedAgent = null;
        } else {
            this.selectedAgent = agent;
        }
        this.selectActiveAgent.emit(this.selectedAgent);
    }

    public featureCheck(feature: AgentFeatures, type: string, subType: string): boolean {
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

    public performAgentAction(agent: SuAgentModel, feature: AgentFeatures): void {
        console.log('performAgentAction', { agent, feature });

        switch (feature.Feature) {
            case 'AllowSupervisorToCapturePicture':
                SDKClient.getAgentActivity({
                    agentId: agent.AgentLoginID,
                    consent: false,
                    location: true,
                    screenshot: true,
                    screenvideo: true,
                    snapshot: true,
                    source: 'supervisor',
                    sourceId: SDKClient.getAgentData().agentId
                })
                    .then((dt: IResponse) => {
                        console.log('AgentSnapShotEvent Response: ', dt.response);
                    })
                    .catch((error: string) => {
                        // log the error to server for troubleshooting purpose
                        TUtils.Logger.log('Exception in performAgentAction.AgentSnapShotEvent', error);
                    });

                // this.createActivityWidget({
                //     dateTime: '10/10/10 10:10:10',
                //     profilePicUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
                //     details: [
                //         {
                //             Title: 'Agent Name',
                //             Value: 'chirag'
                //         },
                //         {
                //             Title: 'Agent ID',
                //             Value: '55001'
                //         }
                //     ],
                //     snapshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
                //     location: {
                //         x: 12.914142,
                //         y: 74.855957
                //     },
                //     screenshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
                //     screenRecordUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                // });
                break;
            default:
        }
    }
}

// for more info visit - https://angular.io/api/core
