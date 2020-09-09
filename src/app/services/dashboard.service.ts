import { Injectable } from '@angular/core';
import { TUtils, IAgentData, SDKClient, AgentStateDurationList, SignalRWrapper } from 'tmac-sdk';
import { AppDataService } from './app-data.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private serviceUrls: string[];
    private signalRInstance: SignalRWrapper;

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
            signalR.hub.on('onRegistered', () => { });

            signalR.hub.on('onTeamAgentList', (agentList: any) => {
                SDKClient.events.emit('TeamAgentListEvent', agentList);
            });

            signalR.hub.on('onAgentInteractionList', (interactionList: any) => {
                SDKClient.events.emit('AgentInteractionDetailsEvent', interactionList);
            });

            signalR.hub.on('onChannelList', (channelList: any) => {
                SDKClient.events.emit('AgentChannelDetailsEvent', channelList);
            });

            signalR.hub.on('onStatusList', (statusDetails: AgentStateDurationList) => {
                SDKClient.events.emit('AgentStatusDetailsEvent', statusDetails);
            });

            signalR.hub.on('onDataReceivedForAgent', (data: any) => {
                SDKClient.events.emit('CallbackDataReceivedForAgent', data);
            });

            // ----- Supervisor -----

            // check for the profile
            if (agentData.agentProfile === 'S') {

                signalR.hub.on('onAgentList', (agentList: any) => {
                    SDKClient.events.emit('SupervisorAgentListEvent', agentList);
                });

                signalR.hub.on('onAgentListData', (agentListData: any) => {
                    SDKClient.events.emit('TeamAgentListDataEvent', agentListData);
                });

                signalR.hub.on('onTeamChannelList', (channelList: any) => {
                    SDKClient.events.emit('TeamChannelListEvent', channelList);
                });

                signalR.hub.on('onIntentList', (intentList: any) => {
                    SDKClient.events.emit('TeamIntentListEvent', intentList);
                });

                signalR.hub.on('onTeamActiveStatusList', (activeStatusList: any) => {
                    SDKClient.events.emit('TeamActiveStatusDetailsEvent', activeStatusList);
                });

                signalR.hub.on('onTeamActiveChannelList', (activeChannelList: any) => {
                    SDKClient.events.emit('TeamActiveChannelListEvent', activeChannelList);
                });

                signalR.hub.on('onInteractionList', (interactionList: any) => {
                    SDKClient.events.emit('TeamAgentInteractionDetailsEvent', interactionList);
                });

                signalR.hub.on('onWorkCodeList', (workCodeList: any) => {
                    SDKClient.events.emit('TeamrWorkCodeDetailsEvent', workCodeList);
                });
            }

            // connection connected event
            signalR.events.on('onConnected', () => {
                signalR.hub.invoke('GetAgentData', signalR.hub.connection.id, agentData.agentId, true);

                // check for the profile
                if (agentData.agentProfile === 'S') {
                    signalR.hub.invoke('GetActiveAgentList', signalR.hub.connection.id, agentData.agentId, agentData.teamId, true);
                }
            });

            // connect to the server
            signalR.connect();

            // assign to local variable
            this.signalRInstance = signalR;
        }
    }

    public triggerAgentInteractions(agentId: string, start: boolean): void {
        // invoke data server to start/stop sending interaction data
        this.signalRInstance.hub.invoke('GetActiveInteractionList', this.signalRInstance.hub.connection.id, agentId, start);
    }
}
