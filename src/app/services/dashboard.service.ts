import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TUtils, IAgentData, SDKClient, AgentStateDurationList, SignalRWrapper } from 'tmac-sdk';
import { AppDataService } from './app-data.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private _unsubscribeAll: Subject<any>;
    private _subscribed: boolean;
    private _serviceUrls: string[];
    private _signalRInstance: SignalRWrapper;

    constructor(private _appDataService: AppDataService) {
        this._unsubscribeAll = new Subject();
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
            this._serviceUrls,
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
                signalR.hub.invoke('GetAgentData', signalR.hub.connection.id, agentData.agentId, true, 100);

                // check for the profile
                if (agentData.agentProfile === 'S') {
                    signalR.hub.invoke('GetActiveAgentList', signalR.hub.connection.id, agentData.agentId, agentData.teamId, true, 100);
                }
            });

            // connect to the server
            signalR.connect();

            // assign to local variable
            this._signalRInstance = signalR;
        }
    }

    public subscribe(): void {
        // check if subscribed
        if (this._subscribed) {
            // if subscribed, then return
            return;
        }

        TUtils.Logger.console('info', 'DashboardService.subscribe');

        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {
                // check whether the Urls are provided in config
                this._serviceUrls = config.Main.Content.Urls?.DashboardServerUrls || [];
                // if urls are there then start service
                if (this._serviceUrls.length > 0) {
                    this.startService();
                }
            });

        // set the flag
        this._subscribed = true;
    }

    public unsubscribe(): void {
        // check if unsubscribed
        if (!this._subscribed) {
            return;
        }

        TUtils.Logger.console('info', 'DashboardService.unsubscribe');

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this._subscribed = false;
    }

    public triggerAgentInteractions(agentId: string, start: boolean): void {
        // invoke data server to start/stop sending interaction data
        this._signalRInstance.hub.invoke('GetActiveInteractionList', this._signalRInstance.hub.connection.id, agentId, start);
    }
}
