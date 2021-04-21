import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_DATA_MAP } from 'app/constants';
import { IWidget } from 'app/interfaces';
import { formatJsonData } from 'app/utils';
import { get, join } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { IUIEvent, SDKClient, SignalRWrapper, TUtils } from 'tmac-sdk';

/**
 * TCIS Integration Component
 */
@Component({
    selector: 'tw-tcis-integration',
    templateUrl: './tw-tcis-integration.component.html',
    styleUrls: ['./tw-tcis-integration.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwTcisIntegrationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Widget config data
     */
    private WidgetData: ITCISWidgetData;

    /**
     * SignalR wrapper for TCIS connection
     */
    private _signalrWrapper: SignalRWrapper;

    constructor(private _tmacEventService: TMACEventService) {
        super();
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // assign the data
        this.WidgetData = this.data.Data;

        // listen to tmac events
        this._tmacEventService
            .getInteractionEventsByName([
                'IncomingCallEvent',
                'OutgoingCallEvent',
                'CallConnectedEvent',
                'CallerIntentEvent',
                'UUIDataEvent',
                'CCLDataEvent',
                'CallDisconnectedEvent',
                'TextChatIncomingEvent',
                'TextChatRemoteUserConnectedEvent',
                'TextChatDisconnectedEvent',
                'InteractionClosedEvent'
            ])
            .pipe(takeUntil(this.unsubscribeAll))
            // .subscribe(evts => evts.forEach(evt => this[evt.EventName](evt)));
            .subscribe((evts) =>
                evts.forEach((evt: IUIEvent) => {
                    // get the action based on event name
                    const action = this.WidgetData.Actions.filter((a) => a.EventName === evt.EventName)?.[0];
                    // if no action return
                    if (!action) {
                        return;
                    }
                    // check if any action to be executed on this event
                    if (action.EventName === evt.EventName) {
                        let actionParam = '';
                        if (action.Parameters && action.Parameters.length) {
                            const AgentData = AGENT_DATA_MAP('LowerCase');
                            const paramMap = action.Parameters.reduce((acc, curr) => {
                                acc[curr.replaceAll('.', '_')] = curr.split('.');
                                return acc;
                            }, {});
                            console.log({ paramMap, AgentData: SDKClient.getAgentData(), TMACEvent: evt });
                            const vals = formatJsonData({ AgentData: SDKClient.getAgentData(), TMACEvent: evt }, paramMap);
                            console.log({ vals });
                            const args = Object.values(vals).join(',');
                            console.log('#######################################', { args });
                            action.Parameters.forEach((param) => {
                                const splitParam = param.split('.');
                                // check if the value to be taken from TMAC event
                                if (splitParam[0].toLowerCase() === 'tmacevent') {
                                    // TMACEvent.EventName.{...Property}
                                    // get value from TMAC event
                                    const getValue = this.FindInTMACEvent(splitParam, evt);
                                    if (getValue) {
                                        actionParam += getValue + ',';
                                    }
                                } else if (splitParam[0].toLowerCase() === 'agentdata') {
                                    // AgentData.{...Property}
                                    // get value from agent data
                                    const regValue = this.FindInAgentData(splitParam);
                                    if (regValue) {
                                        actionParam += regValue + ',';
                                    }
                                } else {
                                    actionParam += param + ',';
                                }
                            });
                        }

                        // clear the trailing comma
                        actionParam = actionParam.replace(/(^,)|(,$)/g, '');

                        // execute action
                        // this.executeAction(action.Method, action.ExeName, actionParam);
                    }
                })
            );

        // check if Urls provided
        if (this.WidgetData.Urls.length) {
            // create a signalR wrapper
            this._signalrWrapper = new TUtils.SignalRWrapper(this.WidgetData.Urls, '', 'TCIS', {}, this.WidgetData.Hub);

            // register to hub events
            this.registerHubEvents();

            // connect to the server
            this._signalrWrapper.connect();
        }
    }

    /**
     * To find value from TMAC events based on object map
     *
     * @param {string[]} splitParam
     * @param {IUIEvent} evt
     */
    private FindInTMACEvent(splitParam: string[], evt: IUIEvent): string {
        let getValue = '';
        // shift the first item out i.e., keyword TMACEvent
        splitParam.shift();
        // get all the interaction events and process the events and form params for action
        this._tmacEventService.interactionEvents(evt.InteractionID).forEach((ev: IUIEvent) => {
            if (splitParam[0] === ev.EventName) {
                // shift the first item out i.e., EventName
                splitParam.shift();
                // map the property and get the value from event property
                const valueMap = join(splitParam, '.');
                // map the property and get the value from event property=
                getValue = get(ev, valueMap, '');
            }
        });
        return getValue;
    }

    /**
     * To find value from Agent Data
     *
     * @param splitParam
     */
    private FindInAgentData(splitParam: string[]): string {
        // get the agent data map
        const mapObj = AGENT_DATA_MAP('LowerCase');
        // add the query param
        const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
        return splitParam[1].replace(reg, (matched: string) => {
            return mapObj[matched.toLowerCase()] || '';
        });
    }

    /**
     * On Destroy.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To register hub events
     */
    private registerHubEvents(): void {}

    /**
     * Method to execute action to invoke the server
     */
    private executeAction(exeName: string, method: string, params: string): void {
        TUtils.Logger.console('info', `TwTcisIntegrationComponent.executeAction: ${exeName} - ${method} - ${params}`);
        // check if exeName/method
        if (!exeName || !method) {
            TUtils.Logger.warn('TCIS: exeName|method not found');
            return;
        }
        // check if connection exists
        if (this._signalrWrapper?.isConnected()) {
            this._signalrWrapper.hub.invoke(exeName, method, params, false);
        } else {
            TUtils.Logger.warn('TCIS: Signalr Connection to the server is not available');
        }
    }
}

interface ITCISWidgetData {
    /**
     * Connection urls
     */
    Urls: string[];
    /**
     * SignalR connection hub
     */
    Hub: string;
    /**
     * Actions to execute
     */
    Actions: {
        /**
         * On which event the action to be executed
         */
        EventName: string;
        /**
         * Parameters for actions
         */
        Parameters: string[];
        /**
         * Invoke method name
         */
        Method: string;
        /**
         * Exe name
         */
        ExeName: string;
    }[];
}
