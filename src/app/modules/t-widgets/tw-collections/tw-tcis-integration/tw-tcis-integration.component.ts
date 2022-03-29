import { TwTcisIntegration, TwTcisIntegrationData } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { extractJsonVal, getStringVars } from '@tmac/operators';
import { IUIEvent, SDKClient, SignalRWrapper, TMACEventTypes, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { get, uniq } from 'lodash';
import { takeUntil } from 'rxjs/operators';

/**
 * TCIS Integration Component
 */
@Component({
    selector: 'tw-tcis-integration',
    template: 'Tw Tcis Integration Component',
    styles: [],
    encapsulation: ViewEncapsulation.None
})
export class TwTcisIntegrationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwTcisIntegration;

    /**
     * Widget config data
     */
    private WidgetData: TwTcisIntegrationData;

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
        const eventNames = uniq(this.WidgetData.Actions.map((a) => a.EventName) ?? []);
        if (!eventNames.length) {
            this.logger.warn(`No action events specified, ignore process!`);
            return;
        }
        // listen to tmac events
        this._tmacEventService
            .getInteractionEventsByName(eventNames as any[])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) =>
                evts.forEach((evt: IUIEvent) => {
                    // check if recovery event, then return
                    if (evt.RecoveryEvent) {
                        return;
                    }

                    // execute action for this event and channel
                    this.WidgetData.Actions.forEach((action) => {
                        if (action.EventName === evt.EventName) {
                            let args = '';
                            // check if any action to be executed on this event
                            if (action.EventName === evt.EventName && this.matchChannel(evt, action.Channel as any)) {
                                if (action.Parameters && action.Parameters.length) {
                                    args = this.reduceParams(action.Parameters, evt);
                                }
                                // execute action
                                this.executeAction(action.Method, action.ExeName, args);
                            }
                        }
                    });
                })
            );

        // check if Urls provided
        if (this.WidgetData.Urls.length) {
            this._signalrWrapper = new TUtils.SignalRWrapper(this.WidgetData.Urls, '', 'TCIS', {}, this.WidgetData.Hub);
            this.registerHubEvents();
            this._signalrWrapper?.connect();
        }
    }

    /**
     * On Destroy.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this._signalrWrapper?.close(true);
    }

    /**
     * To match channel
     *
     * @param {IUIEvent} evt
     * @param {TChannels} channel
     * @returns
     */
    private matchChannel(evt: IUIEvent, channel: TChannels): boolean {
        try {
            if (!channel) {
                this.logger.warn(`matchChannel: channel is not provided for action event ${evt.EventName}, ignore process!`);
                return;
            }
            // get the construct event of this action event
            const event = this._tmacEventService.getInteractionEventsArray(evt.InteractionID).filter((e) => e.IsInteractionConstructEvent)?.[0];
            // if event is found the match it with the channel construct event
            if (event) {
                switch (channel.toLowerCase()) {
                    case 'chat':
                        return event.EventName === 'TextChatIncomingEvent';
                    case 'email':
                        return event.EventName === 'IncomingEmailEvent' || event.EventName === 'OutgoingEmailEvent';
                    case 'fax':
                        return event.EventName === 'FaxReceivedEvent';
                    case 'generic':
                        return event.EventName === 'GenericInteractionEvent';
                    case 'sms':
                        return event.EventName === 'SMSIncomingEvent' || event.EventName === 'SMSOutgoingEvent';
                    case 'voice':
                        return event.EventName === 'IncomingCallEvent' || event.EventName === 'OutgoingCallEvent';
                }
            }
        } catch (error) {}
        this.logger.warn(`matchChannel: no matching construct event for ${evt.EventName} and channel ${channel}!`);
        return false;
    }

    /**
     * Reduces parameters
     *
     * @param {String[]} params
     * @param {IUIEvent} evt
     */
    private reduceParams(params: string[], evt: IUIEvent): string {
        try {
            const AgentData = SDKClient.getAgentData();
            if (!params.length) {
                return '';
            }
            return params
                .reduce((acc, curr) => {
                    const [prefix, tmacEvtName] = curr.split('.');

                    if (prefix === 'AgentData') {
                        const val = get({ AgentData }, curr, '');
                        acc += `,${val}`;
                    } else if (prefix === 'TMACEvent') {
                        const TMACEvent = {
                            [tmacEvtName]: this._tmacEventService
                                .getInteractionEventsArray(evt.InteractionID)
                                .reverse()
                                .find((e) => e.EventName === tmacEvtName)
                        };
                        const val = extractJsonVal({ TMACEvent }, curr);
                        acc += `,${val}`;
                    } else {
                        const newParams = getStringVars(curr);
                        if (newParams) {
                            const newParamVals = this.reduceParams(
                                newParams.map((p) => p.replaceAll('${', '').replaceAll('}', '')),
                                evt
                            )
                                ?.slice(1)
                                ?.split(',');
                            acc += `,${newParams.reduce((subAcc, subCurr, i) => {
                                return subAcc.replaceAll(subCurr, newParamVals[i]);
                            }, curr)}`;
                        } else {
                            acc += `,${curr}`;
                        }
                    }
                    return acc;
                }, '')
                .slice(1);
        } catch (error) {
            this.logger.error('Error in reduceParams', error);
        }
    }

    /**
     * To register hub events
     */
    private registerHubEvents(): void {}

    /**
     * Method to execute action to invoke the server
     */
    private executeAction(exeName: string, method: string, params: string): void {
        this.logger.info(`executeAction: ${exeName} - ${method} - ${params.length}`, false);
        // check if exeName/method
        if (!exeName || !method) {
            this.logger.warn('executeAction: exeName|method not found');
            return;
        }
        // check if connection exists
        if (this._signalrWrapper?.isConnected()) {
            this._signalrWrapper.hub.invoke(exeName, method, params, false);
        } else {
            this.logger.warn('executeAction: Signalr Connection to the server is not available');
        }
    }
}

type TChannels = 'voice' | 'chat' | 'email' | 'fax' | 'sms' | 'generic';

interface WidgetData {
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
         * Channel to match
         */
        Channel: TChannels;
        /**
         * On which event the action to be executed
         */
        EventName: TMACEventTypes;
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
