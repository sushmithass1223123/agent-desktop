import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { getStringVars } from '@tmac/operators';
import { IUIEvent, SDKClient, SignalRWrapper, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { get } from 'lodash';
import { takeUntil } from 'rxjs/operators';

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
    private WidgetData: WidgetData;

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
                'CallDisconnectedEvent',
                'TextChatIncomingEvent',
                'TextChatRemoteUserConnectedEvent',
                'TextChatDisconnectedEvent',
                'IncomingEmailEvent',
                'OutgoingEmailEvent',
                'FaxReceivedEvent',
                'SMSIncomingEvent',
                'SMSOutgoingEvent',
                'GenericInteractionEvent',
                'UUIDataEvent',
                'CCLDataEvent',
                'InteractionClosedEvent'
            ])
            .pipe(takeUntil(this.unsubscribeAll))
            // .subscribe(evts => evts.forEach(evt => this[evt.EventName](evt)));
            .subscribe((evts) =>
                evts.forEach((evt: IUIEvent) => {
                    // check if recovery event, then return
                    if (evt.RecoveryEvent) {
                        return;
                    }

                    // get the action based on event name
                    const action = this.WidgetData.Actions.filter((a) => a.EventName === evt.EventName)?.[0];
                    // if no action return
                    if (!action) {
                        TUtils.Logger.warn(`TwTcisIntegration: no action specified for ${evt.EventName}, ignore process!`);
                        return;
                    }

                    let args = '';
                    // check if any action to be executed on this event
                    if (action.EventName === evt.EventName) {
                        if (action.Parameters && action.Parameters.length) {
                            args = this.reduceParams(action.Parameters, evt);
                        }
                        // execute action
                        this.executeAction(action.Method, action.ExeName, (args || ',').slice(1));
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
     * Reduces parameters
     *
     * @param {String[]} params
     * @param {IUIEvent} evt
     */
    private reduceParams(params: string[], evt: IUIEvent): string {
        try {
            const AgentData = SDKClient.getAgentData();
            return params.reduce((acc, curr) => {
                const [prefix, tmacEvtName] = curr.split('.');
                let TMACEvent = this._tmacEventService
                    .getInteractionEventsArray(evt.InteractionID)
                    .reverse()
                    .find((e) => e.EventName === tmacEvtName);
                if (TMACEvent?.EventName) {
                    TMACEvent = {
                        [TMACEvent.EventName]: TMACEvent
                    };
                }
                if (prefix === 'AgentData') {
                    const val = get({ AgentData }, curr, '');
                    acc += `,${val}`;
                } else if (prefix === 'TMACEvent') {
                    const val = get({ TMACEvent }, curr, '');
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
            }, '');
        } catch (error) {
            TUtils.Logger.error('Exception in TwTcisIntegrationComponent.reduceParams', error);
        }
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
