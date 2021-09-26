import { Injectable } from '@angular/core';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { AgentStateDurationList, SDKClient, SignalRWrapper, TUtils } from '@tmac/sdk';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppDataService } from './app-data.service';
import { TMACEventService } from './tmac-event.service';

/**
 * Dashboard Service
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardService extends SharedWrapper {
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
     * Dashboard Seervice subject
     */
    private _dataReceivedSubject: Subject<string>;
    /**
     * Service started flag
     */
    private _serviceStarted: boolean;
    /**
     * Supervisor dashboard duration
     */
    private _sdDuration: number;
    /**
     * Agent hierarchy flag
     */
    private _agentHierarchy: boolean;

    constructor(private _appDataService: AppDataService, private _tmacEventService: TMACEventService) {
        super();
    }

    /**
     * Start signalr
     */
    private startService(): void {
        this.logger.info('startService', false);

        // get agent data
        const agentData = SDKClient.getAgentData();

        // check if we rece
        if (Object.keys(agentData).length === 0) {
            this.logger.warn('startService: Agent data is not available!');
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
            signalR.hub.on('onRegistered', () => {});

            signalR.hub.on('onTeamAgentList', (agentList: any) => {
                this._tmacEventService.emitSDKEvent({
                    event: {
                        EventName: 'TeamAgentListEvent',
                        Data: agentList
                    }
                });
            });

            signalR.hub.on('onAgentInteractionList', (interactionList: any) => {
                this._tmacEventService.emitSDKEvent({
                    event: {
                        EventName: 'AgentInteractionDetailsEvent',
                        Data: interactionList
                    }
                });

                this._dataReceivedSubject.next('agent-received');
            });

            signalR.hub.on('onChannelList', (channelList: any) => {
                this._tmacEventService.emitSDKEvent({
                    event: {
                        EventName: 'AgentChannelListEvent',
                        Data: channelList
                    }
                });

                this._dataReceivedSubject.next('agent-received');
            });

            signalR.hub.on('onStatusList', (statusDetails: AgentStateDurationList) => {
                this._tmacEventService.emitSDKEvent({
                    event: {
                        EventName: 'AgentStatusDetailsEvent',
                        Data: statusDetails
                    }
                });

                this._dataReceivedSubject.next('agent-received');
            });

            signalR.hub.on('onDataReceivedForAgent', (dataForAgent: any) => {
                this._tmacEventService.emitSDKEvent({
                    event: {
                        EventName: 'CallbackDataReceivedForAgent',
                        Data: dataForAgent
                    },
                    log: true
                });
            });

            // ----- Supervisor -----

            // check for the profile
            if (agentData.agentProfile === 'S') {
                signalR.hub.on('onAgentList', (agentList: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'SupervisorAgentListEvent',
                            Data: agentList
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });

                signalR.hub.on('onAgentListData', (agentListData: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'TeamAgentListDataEvent',
                            Data: agentListData
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });

                signalR.hub.on('onTeamChannelList', (channelList: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'TeamChannelListEvent',
                            Data: channelList
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });

                signalR.hub.on('onIntentList', (intentList: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'TeamIntentListEvent',
                            Data: intentList
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });

                signalR.hub.on('onTeamActiveStatusList', (activeStatusList: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'TeamActiveStatusDetailsEvent',
                            Data: activeStatusList
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });

                signalR.hub.on('onTeamActiveChannelList', (activeChannelList: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'TeamActiveChannelListEvent',
                            Data: activeChannelList
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });

                signalR.hub.on('onInteractionList', (interactionList: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'TeamAgentInteractionDetailsEvent',
                            Data: interactionList
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });

                signalR.hub.on('onWorkCodeList', (workCodeList: any) => {
                    this._tmacEventService.emitSDKEvent({
                        event: {
                            EventName: 'TeamrWorkCodeDetailsEvent',
                            Data: workCodeList
                        }
                    });

                    this._dataReceivedSubject.next('supervisor-received');
                });
            }

            // connection connected event
            signalR.events.on('SignalRConnectedEvent', () => {
                this._dashboardServiceSubject.next('connected');
            });

            // connection disconnected event
            signalR.events.on('SignalRDisconnectedEvent', () => {
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
     * Getter to observe the data received
     */
    get dataReceived(): any | Observable<string> {
        return this._dataReceivedSubject.asObservable();
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

        this.logger.info('subscribe', false);

        this._unsubscribeAll = new Subject();
        this._dashboardServiceSubject = new BehaviorSubject('');
        this._dataReceivedSubject = new Subject();

        // set the flag
        this._subscribed = true;
        this._serviceStarted = false;

        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(async (config: any) => {
            const serverUrls = await SDKClient.getDataServerSignalRNatUrls({
                currentUrlList: config.Main.Urls?.DashboardServerUrls || [],
                reason: ''
            }).catch((err) => {
                console.error(err);
            });
            // check whether the Urls are provided in config
            if (serverUrls) {
                this._serviceUrls = serverUrls?.response || config.Main.Urls?.DashboardServerUrls || [];
            } else {
                this._serviceUrls = config.Main.Urls?.DashboardServerUrls || [];
            }
            // if urls are there then start service
            if (this._serviceUrls.length > 0 && !this._serviceStarted) {
                this.startService();
            }
        });
    }

    /**
     * To unsubscribe from dashboard servie
     */
    public unsubscribe(): void {
        // check if unsubscribed
        if (!this._subscribed) {
            return;
        }

        this.logger.info('unsubscribe', false);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        this._dashboardServiceSubject.next('');
        this._dashboardServiceSubject.complete();

        this._dataReceivedSubject.next('');
        this._dataReceivedSubject.complete();

        this._subscribed = false;
        this._serviceStarted = false;
        this._agentHierarchy = false;

        // close the signalr connection for this session
        if (this._signalRInstance) {
            this._signalRInstance.close(true);
        }
    }

    /**
     * Trigger Agent Data
     *
     * @param {String} agentId
     * @param {Boolean} start
     * @param {number} duration
     */
    public triggerAgentData(agentId: string, start: boolean, duration: number): void {
        this.logger.info(`triggerAgentData: start=${start}, duration=${duration}`, false);

        // if connected, then trigger
        if (this._signalRInstance?.isConnected()) {
            this._signalRInstance.hub.invoke('GetAgentData', this._signalRInstance.hub.connection.id, agentId, start, duration);
        }
    }

    /**
     * Trigger Active agents
     *
     * @param {String} agentId
     * @param {String} teamId
     * @param {Boolean} start
     * @param {Boolean} hierarchy
     * @param {Number} duration
     */
    public triggerActiveAgents(agentId: string, teamId: string, start: boolean, hierarchy: boolean, duration: number): void {
        this.logger.info(`triggerActiveAgents: start=${start}, hierarchy=${hierarchy}, duration=${duration}`, false);

        // assign the hierarchy
        this._agentHierarchy = hierarchy;

        // if start, store the duration
        if (start) {
            this._sdDuration = duration;
        }

        // if connected, then trigger
        if (this._signalRInstance?.isConnected()) {
            this._signalRInstance.hub.invoke(
                'GetActiveAgentList',
                this._signalRInstance.hub.connection.id,
                agentId,
                hierarchy ? teamId : '',
                start,
                duration
            );
        }
    }

    /**
     * Re-trigger Active agents
     *
     * @param {String} agentId
     * @param {String} teamId
     */
    public reTriggerActiveAgents(agentId: string, teamId: string): void {
        this.logger.info(`reTriggerActiveAgents: hierarchy=${this._agentHierarchy}`, false);

        // if connected, then trigger
        if (this._signalRInstance?.isConnected()) {
            // stop first
            this._signalRInstance.hub.invoke(
                'GetActiveAgentList',
                this._signalRInstance.hub.connection.id,
                agentId,
                this._agentHierarchy ? teamId : '',
                false,
                0
            );

            // then start in next event loop
            setTimeout(() => {
                this._signalRInstance.hub.invoke(
                    'GetActiveAgentList',
                    this._signalRInstance.hub.connection.id,
                    agentId,
                    this._agentHierarchy ? teamId : '',
                    true,
                    this._sdDuration
                );
            });
        }
    }

    /**
     * Trigger agent Interactions
     *
     * @param {String} agentId
     * @param {Boolean} start
     */
    public triggerAgentInteractions(agentId: string, start: boolean): void {
        this.logger.info(`triggerAgentInteractions: agentId=${agentId}, start=${start}`, false);

        if (this._signalRInstance?.isConnected()) {
            this._signalRInstance.hub.invoke('GetActiveInteractionList', this._signalRInstance.hub.connection.id, agentId, start);
        }
    }

    /**
     * Trigger agent team list for IM list
     *
     * @param {String} agentId
     * @param {String} teamId
     * @param {Boolean} start
     * @param {Boolean} teamFilter
     */
    public triggerTeamAgentList(agentId: string, teamId: string, start: boolean, teamFilter: boolean): void {
        this.logger.info(`triggerTeamAgentList: start=${start}, teamFilter=${teamFilter}`, false);

        if (this._signalRInstance?.isConnected()) {
            this._signalRInstance.hub.invoke('GetTeamAgentList', this._signalRInstance.hub.connection.id, agentId, start, teamFilter ? teamId : '');
        }
    }
}
