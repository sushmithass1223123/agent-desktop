import { Injectable } from '@angular/core';
import { TUtils, IAgentData, SDKClient, AgentStateDurationList } from 'tmac-sdk';
import { AppDataService } from './app-data.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private serviceUrls: string[];

    constructor(_appDataService: AppDataService) {
        _appDataService.config.subscribe((config: any) => {
            // check whether the Urls are provided in config
            this.serviceUrls = config.Main.Content.Urls?.DashboardServerUrls || [];
            // if urls are there then start service
            if (this.serviceUrls.length > 0) {
                this.startService();
            }
        });
    }

    private startService(): void {
        TUtils.Logger.console('info', 'DashboardService.startService');

        // get agent data
        const agentData: IAgentData = SDKClient.getAgentData();

        // check if we rece
        if (Object.keys(agentData).length === 0) {
            TUtils.Logger.log('DashboardService.startService: Agent data is not available!');
            return;
        }

        // create a signalR connection to the server
        const signalR = new TUtils.SignalRWrapper(
            this.serviceUrls,
            'webSockets',
            'TmacDataServer',
            { agentId: agentData.agentId, stationId: '', tmacServer: '', isTmac: false },
            'TmacDataServerHub',
            false,
            10
        );

        // check if the connection is created successfully
        if (signalR) {
            // on registered event
            signalR.hub.on('onRegistered', () => {});

            // register to agent interaction list event
            signalR.hub.on('onAgentInteractionList', (interactionList: any) => {
                SDKClient.events.emit('AgentInteractionDetailsEvent', interactionList);
            });

            // register to agent channel list event
            signalR.hub.on('onChannelList', (channelList: any) => {
                SDKClient.events.emit('AgentChannelDetailsEvent', channelList);
            });

            // connection connected event
            signalR.events.on('onConnected', () => {
                signalR.hub.invoke('GetAgentData', signalR.hub.connection.id, agentData.agentId, true);
                if (agentData.agentProfile === 'S') {
                    signalR.hub.invoke('GetActiveAgentList', signalR.hub.connection.id, agentData.agentId, agentData.teamId, true);
                }
            });

            signalR.hub.on('onStatusList', (statusDetails: AgentStateDurationList) => {
                SDKClient.events.emit('AgentStatusDetailsEvent', statusDetails);
            });

            signalR.hub.on('onTeamChannelList', (channelList: any) => {
                SDKClient.events.emit('SupervisorTeamChannelListEvent', channelList);
            });

            signalR.hub.on('onIntentList', (intentList: any) => {
                SDKClient.events.emit('SupervisorIntentListEvent', intentList);
            });

            signalR.hub.on('onTeamAgentList', (agentList: any) => {
                SDKClient.events.emit('TeamAgentListEvent', agentList);
            });

            // connect to the server
            signalR.connect();
        }
    }
}
