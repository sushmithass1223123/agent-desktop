import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentStateDurationList, IAgentData, SDKClient, SignalRWrapper, TUtils } from 'tmac-sdk';
import { AppDataService } from './app-data.service';
import { TMACEventService } from './tmac-event.service';

/**
 * Dashboard Service
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * Subscribed flag
     */
    private _subscribed: boolean;
    /**
     * Need More Description
     * Service Urls
     */
    private _serviceUrls: string[];
    /**
     * SignalR instance
     */
    private _signalRInstance: SignalRWrapper;
    /**
     * Dashboard Seervice subject
     */
    private _dashboardServiceSubject: BehaviorSubject<string>;
    /**
     * Service started flag
     */
    private _serviceStarted: boolean;

    constructor(
        private _appDataService: AppDataService,
        private _tmacEventService: TMACEventService
    ) { }

    /**
     * Start signalr
     */
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
                const eventData = {
                    EventName: 'TeamAgentListEvent',
                    Data: agentList
                };

                this._tmacEventService.emitCustomEvent(eventData);
            });

            signalR.hub.on('onAgentInteractionList', (interactionList: any) => {

                const eventData = {
                    EventName: 'AgentInteractionDetailsEvent',
                    Data: interactionList
                };

                this._tmacEventService.emitCustomEvent(eventData);
            });

            signalR.hub.on('onChannelList', (channelList: any) => {

                const eventData = {
                    EventName: 'AgentChannelDetailsEvent',
                    Data: channelList
                };

                this._tmacEventService.emitCustomEvent(eventData);
            });

            signalR.hub.on('onStatusList', (statusDetails: AgentStateDurationList) => {

                const eventData = {
                    EventName: 'AgentStatusDetailsEvent',
                    Data: statusDetails
                };

                this._tmacEventService.emitCustomEvent(eventData);
            });

            signalR.hub.on('onDataReceivedForAgent', (dataForAgent: any) => {

                const eventData = {
                    EventName: 'CallbackDataReceivedForAgent',
                    Data: dataForAgent
                };

                this._tmacEventService.emitCustomEvent(eventData);
            });

            // ----- Supervisor -----

            // check for the profile
            if (agentData.agentProfile === 'S') {
                signalR.hub.on('onAgentList', (agentList: any) => {

                    const eventData = {
                        EventName: 'SupervisorAgentListEvent',
                        Data: agentList
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });

                signalR.hub.on('onAgentListData', (agentListData: any) => {

                    const eventData = {
                        EventName: 'TeamAgentListDataEvent',
                        Data: agentListData
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });

                signalR.hub.on('onTeamChannelList', (channelList: any) => {

                    const eventData = {
                        EventName: 'TeamChannelListEvent',
                        Data: channelList
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });

                signalR.hub.on('onIntentList', (intentList: any) => {
                    const eventData = {
                        EventName: 'TeamIntentListEvent',
                        Data: intentList
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });

                signalR.hub.on('onTeamActiveStatusList', (activeStatusList: any) => {

                    const eventData = {
                        EventName: 'TeamActiveStatusDetailsEvent',
                        Data: activeStatusList
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });

                signalR.hub.on('onTeamActiveChannelList', (activeChannelList: any) => {

                    const eventData = {
                        EventName: 'TeamActiveChannelListEvent',
                        Data: activeChannelList
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });

                signalR.hub.on('onInteractionList', (interactionList: any) => {

                    const eventData = {
                        EventName: 'TeamAgentInteractionDetailsEvent',
                        Data: interactionList
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });

                signalR.hub.on('onWorkCodeList', (workCodeList: any) => {

                    const eventData = {
                        EventName: 'TeamrWorkCodeDetailsEvent',
                        Data: workCodeList
                    };

                    this._tmacEventService.emitCustomEvent(eventData);
                });
            }

            // connection connected event
            signalR.events.on('onConnected', () => {
                this._dashboardServiceSubject.next('connected');
            });

            // connection disconnected event
            signalR.events.on('onDisconnected', () => {
                this._dashboardServiceSubject.next('disconnected');
            });

            // connect to the server
            signalR.connect();

            // assign to local variable
            this._signalRInstance = signalR;

            // set the started flag to true
            this._serviceStarted = true;
        }
    }

    /**
     * Getter to observe the server connection change
     */
    get connectionState(): any | Observable<string> {
        return this._dashboardServiceSubject.asObservable();
    }

    /**
     * To subscribe to dashboard service
     */
    public subscribe(): void {
        // check if subscribed
        if (this._subscribed) {
            // if subscribed, then return
            return;
        }

        TUtils.Logger.console('info', 'DashboardService.subscribe');

        this._unsubscribeAll = new Subject();
        this._dashboardServiceSubject = new BehaviorSubject('');

        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            // check whether the Urls are provided in config
            this._serviceUrls = config.Main.Content.Urls?.DashboardServerUrls || [];
            // if urls are there then start service
            if (this._serviceUrls.length > 0 && !this._serviceStarted) {
                this.startService();
            }
        });

        // set the flag
        this._subscribed = true;
        this._serviceStarted = false;
    }

    /**
     * To unsubscribe from dashboard servie
     */
    public unsubscribe(): void {
        // check if unsubscribed
        if (!this._subscribed) {
            return;
        }

        TUtils.Logger.console('info', 'DashboardService.unsubscribe');

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        this._dashboardServiceSubject.next('');
        this._dashboardServiceSubject.complete();

        this._subscribed = false;
        this._serviceStarted = false;
    }

    /**
     * Trigger Agent Data
     * @param {String} agentId
     * @param {Boolean} start
     * @param {number} duration
     */
    public triggerAgentData(agentId: string, start: boolean, duration: number): void {
        TUtils.Logger.console('info', `DashboardService.triggerAgentData: start=${start}, duration=${duration}`);
        if (this._signalRInstance.isConnected()) {
            this._signalRInstance.hub.invoke('GetAgentData', this._signalRInstance.hub.connection.id, agentId, start, duration);
        }
    }

    /**
     * Trigger Active agents
     * @param {String} agentId
     * @param {String} teamId
     * @param {Boolean} start
     * @param {Number} duration
     */
    public triggerActiveAgents(agentId: string, teamId: string, start: boolean, duration: number): void {
        TUtils.Logger.console('info', `DashboardService.triggerActiveAgents: start=${start}, duration=${duration}`);
        if (this._signalRInstance.isConnected()) {
            this._signalRInstance.hub.invoke('GetActiveAgentList', this._signalRInstance.hub.connection.id, agentId, teamId, start, duration);
        }
    }

    /**
     * Trigger agent Interactions
     * @param {String} agentId
     * @param {Boolean} start
     */
    public triggerAgentInteractions(agentId: string, start: boolean): void {
        TUtils.Logger.console('info', `DashboardService.triggerAgentInteractions: agentId=${agentId}, start=${start}`);
        if (this._signalRInstance.isConnected()) {
            this._signalRInstance.hub.invoke('GetActiveInteractionList', this._signalRInstance.hub.connection.id, agentId, start);
        }
    }

    /**
     * Trigger agent team list for IM list
     * @param {String} agentId
     * @param {Boolean} start
     */
    public triggerTeamAgentList(agentId: string, start: boolean): void {
        TUtils.Logger.console('info', `DashboardService.triggerTeamAgentList: agentId=${agentId}, start=${start}`);
        if (this._signalRInstance.isConnected()) {
            this._signalRInstance.hub.invoke('GetTeamAgentList', this._signalRInstance.hub.connection.id, agentId, start);
        }
    }
}
