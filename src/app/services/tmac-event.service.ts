import { AOTWidget, AppRootConfig, WidgetAction } from '@ad/types';
import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReminderTaskDialogComponent } from '@modules/shared/components';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import {
    ACWTimerEvent,
    AgentForcedLogoffEvent,
    AgentNotificaitonEvent,
    AgentReminder,
    AgentReminderEvent,
    AgentStatusChangeEvent,
    AutoCloseTabEvent,
    CommandResultEvent,
    IResponse,
    IUIEvent,
    SDKClient,
    TCMDirectAgentNotifyTimeoutEvent,
    TextChatTransferNotificationEvent,
    TMACEventTypes,
    TmacServerConnectionSuccess
} from '@tmac/sdk';
import { EXCLUDED_TMAC_EVENT } from 'app/constants';
import { CustomTMACEventTypes, IPostMessage, IWidget, QuizEvent } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { throwADError } from 'app/utils';
import { upperFirst } from 'lodash';
import { concat, merge, Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { AOTWidgetService } from './aot-widget.service';
import { AppDataService } from './app-data.service';
import { AppUiService } from './app-ui.service';

/**
 *  Componentless Event service
 */
@Injectable({
    providedIn: 'root'
})
export class TMACEventService extends SharedWrapper {
    // Private
    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * App config
     */
    appConfig: AppRootConfig;
    /**
     * Interaction events storage array
     */
    private _interactionEventArray: IUIEvent[];
    /**
     * Interaction event subject
     */
    private _interactionEvent$: Subject<IUIEvent[]>;
    /**
     * TMAC events story array
     */
    private _nonInteractionEventArray: IUIEvent[];
    /**
     * Non interaction event subject
     */
    private _nonInteractionEvent$: Subject<IUIEvent[]>;
    /**
     * Need more Description
     */
    private _postMessage$: Subject<IPostMessage>;
    /**
     * Array to store the list AOT widgets for AgentNotificaitonEvent's ExecuteAction and ExecuteTask
     */
    private _aotWidgets: IWidget[];
    /**
     * Remider task dialog reference
     */
    private _remiderTaskDialog: {
        /**
         * Make call task dialog ref
         */
        makeCall: MatDialogRef<ReminderTaskDialogComponent, any>;
        /**
         * Meeting task dialog ref
         */
        meeting: MatDialogRef<ReminderTaskDialogComponent, any>;
        /**
         * Change status task dialog ref
         */
        changeState: MatDialogRef<ReminderTaskDialogComponent, any>;
        /**
         * DAC request dialog ref
         */
        dacRequest: MatDialogRef<ReminderTaskDialogComponent, any>;
        /**
         * Normal reminder
         */
        reminder: {
            /**
             * Reminder ID
             */
            id: string;
            /**
             * Reminder dialog ref
             */
            ref: MatDialogRef<ReminderTaskDialogComponent, any>;
        }[];
    };

    /**
     * Constructor
     * @param {AppDataService} _appDataService
     * @param {AppUiService} _appUIService
     * @param {AOTWidgetService} _aotWidgetService
     */
    constructor(
        private _appDataService: AppDataService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _router: Router
    ) {
        // intialize all the subject
        super('TMACEventService');
        this._unsubscribeAll = new Subject();
        this._interactionEventArray = [];
        this._nonInteractionEventArray = [];
        this._nonInteractionEvent$ = new Subject();
        this._interactionEvent$ = new Subject();
        this._postMessage$ = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * TMAC event listener function
     * @param evt TMAC event
     */
    private OnTMACEvent = (evt: IUIEvent) => {
        if (evt.InteractionID > 0) {
            this.processInteractionEvents(evt);
        } else {
            this.processNonInteractionEvents(evt);
        }
    };

    /**
     * To process interaction events
     *
     * @param {IUIEvent} evt
     */
    private processInteractionEvents(evt: IUIEvent): void {
        // add all the interaction events to the array
        this._interactionEventArray.push(evt);
        // for dispose event remove the reference from array
        if (evt.IsInteractionDisposeEvent) {
            // remove the events for the InteractionID
            this._interactionEventArray = this._interactionEventArray.filter((i) => i.InteractionID !== evt.InteractionID);
        }
        // notify the observers
        this._interactionEvent$.next([evt]);
        // emit events to launcher
        this.emitEventsToLauncher(evt);
    }

    /**
     * To process non interaction events
     *
     * @param {IUIEvent} evt
     */
    private processNonInteractionEvents(evt: IUIEvent): void {
        const i = this._nonInteractionEventArray.findIndex((item) => item.EventName === evt.EventName);
        if (i > -1) {
            this._nonInteractionEventArray[i] = evt;
        } else {
            this._nonInteractionEventArray.push(evt);
        }
        // notify the observers
        this._nonInteractionEvent$.next([evt]);
        // emit events to launcher
        this.emitEventsToLauncher(evt);
    }

    /**
     * To emit events to the launcher
     * @param {IUIEvent} evt
     */
    private emitEventsToLauncher(evt: IUIEvent): void {
        // if the AD is opened from a laucher emit events to launcher as well
        if (!EXCLUDED_TMAC_EVENT.includes(evt.EventName)) {
            this.sendPostMessageToTheLauncher('onTMACEvent', [evt]);
        }
    }

    /**
     * To send post message to the launcher
     *
     * @param fn
     * @param data
     */
    private sendPostMessageToTheLauncher(fn: string, data: any): void {
        try {
            // get the element
            const element = opener ?? parent;
            // check if the element is present
            if (element != window) {
                // send post message to the element
                element.postMessage(
                    {
                        function: fn,
                        callback: null,
                        data,
                        source: 'tmac',
                        userObject: null
                    },
                    '*'
                );
            }
        } catch (error) {
            throwADError(`Error in TMACEventService.sendPostMessageToTheLauncher.${fn}`, error);
        }
    }

    /**
     * To process AgentNotificaitonEvent
     *
     * @param {AgentNotificaitonEvent} evt
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        try {
            // TODO:: check if the interaction id is there then return
            // and to handle interaction AgentNotificaitonEvent separatly
            // if (evt.InteractionID > 0) {
            //     this.logger.info('AgentNotificaitonEvent: event for an interaction, return', false);
            //     return;
            // }

            // get the type
            const type = evt.Type?.toLowerCase() ?? '';

            // handle alerts
            if (type === 'alert' && evt.Message) {
                this._appUIService.showAlertModal(evt.Message, 'error', 'Alert');
            } else if (type === 'executeaction') {
                // parse the action
                const parsedMessage: {
                    /**
                     * Type of action
                     */
                    Action: string;
                    /**
                     * Data for the notification
                     */
                    Data: string;
                    /**
                     * Mandatory action to be taken
                     */
                    IsMandatory: boolean;
                    /**
                     * [OPTIONAL] Work queue ID for DacRequest action
                     */
                    WQId?: string;
                    /**
                     * [OPTIONAL] Request Id for DacRequest action
                     */
                    RequestId?: string;
                    /**
                     * [OPTIONAL] Header for the assist widget
                     */
                    Header?: string;
                } = JSON.parse(evt.Message);

                // get the action
                switch (parsedMessage.Action.toLowerCase()) {
                    case 'registercallback': {
                        // check if AOT cofngured for register callback
                        const widget = this._aotWidgets.filter((w: IWidget) => w.Type === 'tw-register-callback')?.[0];
                        // check if widget is found
                        if (widget) {
                            this._aotWidgetService.addWidget(widget as AOTWidget);
                        }
                        break;
                    }
                    case 'dacrequest': {
                        // check if the dialog is already opened
                        if (this._remiderTaskDialog.dacRequest) {
                            this.logger.info('AgentNotificaitonEvent: dacRequest dialog is already opened!', false);
                            return;
                        }

                        // parse the data and get info
                        const { ItemID, CustomerIdentifier, Channel, Key } = JSON.parse(parsedMessage.Data);

                        this._remiderTaskDialog.dacRequest = this._appUIService.showRemiderTaskModal(
                            'dacrequest',
                            `Direct agent request from ${CustomerIdentifier || 'NA'} on channel ${Channel || 'NA'}`
                        );

                        this._remiderTaskDialog.dacRequest.afterClosed().subscribe((resp) => {
                            // since we do not have accept for DAC request, we will handle 'reject' | 'snooze'
                            if (resp === 'reject' || resp === 'snooze') {
                                // inform server about the reject
                                SDKClient.respondToWqDacRequest({
                                    comment: '',
                                    itemId: ItemID || '',
                                    requestId: parsedMessage.RequestId || '',
                                    response: resp,
                                    wqId: parsedMessage.WQId || '',
                                    wqKey: Key || ''
                                });
                            }

                            // set the dialogRef to null
                            this._remiderTaskDialog.dacRequest = null;
                        });
                        break;
                    }
                    case 'vivr': {
                        // check if AOT cofngured for VIVR
                        const widget: IWidget = new TwWidgetModel(`Agent Assist - ${parsedMessage.Header}`, 'tw-custom', 'assistance');
                        widget.Config.Actions = ['collapse', 'destroy'];
                        widget.Config.Position.W = 450;
                        widget.Config.Position.H = 800;
                        widget.Data.Url = parsedMessage.Data;

                        // if mandatory, pop a confiration and destroy
                        if (parsedMessage.IsMandatory) {
                            widget.OnDestroy = () => {
                                // get confiration before close
                                const confirmDialogRef = this._appUIService.showAppConfirmDialog(
                                    'generic',
                                    'Confirm Close',
                                    'Are you sure you want to close this widget?'
                                );
                                confirmDialogRef.afterClosed().subscribe((resp) => {
                                    if (resp) {
                                        widget.destroy();
                                    }
                                });
                                return false;
                            };
                        }
                        // check if widget is found
                        if (widget) {
                            this._aotWidgetService.addWidget(widget as AOTWidget);
                        }
                        break;
                    }
                    default:
                }
            } else if (type === 'executetask') {
                // parse the notification message
                const parsedMessage: AgentReminder = JSON.parse(evt.Message);
                // parse then reminder message
                const remiderMessage: {
                    /**
                     * Type of action
                     */
                    Action: string;
                    /**
                     * Data for the reminder
                     */
                    Data: string;
                    /**
                     * Comment to be alerted
                     */
                    Comment: string;
                } = JSON.parse(parsedMessage.Message);

                // get the action
                switch (remiderMessage.Action.toLowerCase()) {
                    case 'makecall': {
                        // check if the dialog is already opened
                        if (this._remiderTaskDialog.makeCall) {
                            this.logger.info('AgentNotificaitonEvent: makeCall dialog is already opened!', false);
                            return;
                        }

                        let message = `Make call to ${remiderMessage.Data}`;
                        // check if any comments added
                        if (remiderMessage.Comment) {
                            message += `<br /> ${remiderMessage.Comment} `;
                        }

                        this._remiderTaskDialog.makeCall = this._appUIService.showRemiderTaskModal('makecall', message);
                        this._remiderTaskDialog.makeCall.afterClosed().subscribe((resp) => {
                            if (resp === 'accept') {
                                // make call to the provided number and complete the reminder
                                SDKClient.makeCall({
                                    interactionId: '0',
                                    number: remiderMessage.Data,
                                    source: '',
                                    sourceId: ''
                                })
                                    .then((dt) => {
                                        // check the response
                                        if (dt.response.ResultCode === 0) {
                                            // make call success
                                            this._appUIService.showSnackbar(`Make call to ${remiderMessage.Data} successful`);
                                        } else {
                                            // make call failed
                                            this._appUIService.showSnackbar(`Make call failed, ${dt.response.ResultMessage}`, 'failure');
                                        }
                                    })
                                    .catch(() => {
                                        // make call error
                                        this._appUIService.showSnackbar('Make call error, please try manually', 'failure');
                                    });

                                // complete the reminder
                                this.updateReminderStatus('Completed', parsedMessage.ID);
                            } else if (resp === 'reject') {
                                // reject the reminder
                                this.updateReminderStatus('Rejected', parsedMessage.ID);
                            } else {
                                const time = resp.split(':')[1];
                                this.updateReminderStatus(`Snooze:${time}`, parsedMessage.ID);
                                this._appUIService.showSnackbar(`Make call task is snoozed for ${time} mins`, 'info');
                            }

                            // set the dialogRef to null
                            this._remiderTaskDialog.makeCall = null;
                        });
                        break;
                    }
                    case 'meeting': {
                        // check if the dialog is already opened
                        if (this._remiderTaskDialog.meeting) {
                            this.logger.info('AgentNotificaitonEvent: meeting dialog is already opened!', false);
                            return;
                        }

                        let message = `Meeting ${remiderMessage.Data ? ' - ' + remiderMessage.Data : ''}`;
                        // check if any comments added
                        if (remiderMessage.Comment) {
                            message += `<br /> ${remiderMessage.Comment} `;
                        }

                        this._remiderTaskDialog.meeting = this._appUIService.showRemiderTaskModal('meeting', message);
                        this._remiderTaskDialog.meeting.afterClosed().subscribe((resp) => {
                            if (resp === 'accept') {
                                // TODO:: handle meeting task

                                window.open(
                                    remiderMessage.Data,
                                    `meeting_${evt.EventId}`,
                                    `menubar=no,resizable=yes,location=no,scrollbars=no,
                                    width=${screen.width},
                                    height=${screen.height}`
                                );

                                // complete the reminder
                                this.updateReminderStatus('Completed', parsedMessage.ID);
                            } else if (resp === 'reject') {
                                // reject the reminder
                                this.updateReminderStatus('Rejected', parsedMessage.ID);
                            } else {
                                const time = resp.split(':')[1];
                                this.updateReminderStatus(`Snooze:${time}`, parsedMessage.ID);
                                this._appUIService.showSnackbar(`Meeting task is snoozed for ${time} mins`, 'info');
                            }

                            // set the dialogRef to null
                            this._remiderTaskDialog.meeting = null;
                        });
                        break;
                    }
                    case 'changestate': {
                        // check if the dialog is already opened
                        if (this._remiderTaskDialog.changeState) {
                            this.logger.info('AgentNotificaitonEvent: changeState dialog is already opened!', false);
                            return;
                        }

                        const value = remiderMessage.Data.split(',')[1];
                        const auxCodes = SDKClient.getAgentData().auxCodes.filter((f) => f.Value.toString() === value)?.[0];
                        let message = `Change Status to ${auxCodes?.Name || remiderMessage.Data}`;
                        // check if any comments added
                        if (remiderMessage.Comment) {
                            message += `<br /> ${remiderMessage.Comment} `;
                        }

                        this._remiderTaskDialog.changeState = this._appUIService.showRemiderTaskModal('changestate', message);
                        this._remiderTaskDialog.changeState.afterClosed().subscribe((resp) => {
                            if (resp === 'accept') {
                                // parse the data and get the aux code and value
                                const auxCode = remiderMessage.Data.split(',');
                                // make call to the provided number and complete the reminder
                                SDKClient.changeStatus({
                                    type: auxCode[0],
                                    code: auxCode[1]
                                })
                                    .then((dt: IResponse) => {
                                        // get the response
                                        let result: AgentStatusChangeEvent | CommandResultEvent = dt.response;
                                        // check the response
                                        if (result.ResultCode === 1) {
                                            // parse the result to AgentStatusChangeEvent
                                            result = result as AgentStatusChangeEvent;
                                            // make call success
                                            this._appUIService.showSnackbar(`Status changed to ${result.Status} successfully`);
                                        } else {
                                            // make call failed
                                            this._appUIService.showSnackbar('Change status failed, please try manually', 'failure');
                                        }
                                    })
                                    .catch(() => {
                                        // make call error
                                        this._appUIService.showSnackbar('Error in change status, please try manually', 'failure');
                                    });

                                // complete the reminder
                                this.updateReminderStatus('Completed', parsedMessage.ID);
                            } else if (resp === 'reject') {
                                // reject the reminder
                                this.updateReminderStatus('Rejected', parsedMessage.ID);
                            } else {
                                const time = resp.split(':')[1];
                                this.updateReminderStatus(`Snooze:${time}`, parsedMessage.ID);
                                this._appUIService.showSnackbar(`Change status task is snoozed for ${time} mins`, 'info');
                            }

                            // set the dialogRef to null
                            this._remiderTaskDialog.changeState = null;
                        });
                        break;
                    }
                    default:
                }
            } else if (type === 'agentsentimentdetected') {
                // parse the message
                const { AgentName, AgentId, DeviceId, Channel, TmacServer, SessionId, InteractionId } = JSON.parse(evt.Message);
                // get cofirmation
                const confrimationDialogRef = this._appUIService.showAppConfirmDialog(
                    'generic',
                    'Negative Sentiment Detected',
                    `Negative sentiment has been detected for ${AgentName}. Do you want to monitor?`
                );
                // route to supervisor page and select the agent if confirmed
                confrimationDialogRef.afterClosed().subscribe((resp1) => {
                    if (resp1) {
                        this._appUIService.showSnackbar('Please wait, connecting to the interaction...', 'loading');
                        // send request to server
                        SDKClient.transferTextChat({
                            agentId: AgentId,
                            deviceId: DeviceId,
                            tmacServer: TmacServer,
                            chatMode: Channel === 'audiochat' ? 'audio' : Channel === 'videochat' ? 'video' : 'text',
                            comment: '',
                            conferenceType: 'silent',
                            interactionId: InteractionId.toString(),
                            lineId: 'bargein',
                            sessionId: SessionId,
                            toAgentId: SDKClient.getAgentData().agentId,
                            toTmacServer: SDKClient.getAgentData().tmacServer
                        })
                            .then((resp2: IResponse) => {
                                // check the response
                                if (resp2.response && resp2.response.ResultCode >= 0) {
                                    this._appUIService.showSnackbar(`Chat silent barge-in successful`, 'success');
                                } else {
                                    this._appUIService.showSnackbar(`Chat silent barge-in failed`, 'failure');
                                }
                            })
                            .catch(() => {
                                this._appUIService.showSnackbar('Error in chat silent barge-in', 'failure');
                            });
                    }
                });
            } else if (type === 'customersentimentdetected') {
                // parse the message
                const { AgentName } = JSON.parse(evt.Message);
                // show in alert
                this._appUIService.showAppSnackbar({
                    message: `Negative sentiment has been detected from customer for ${AgentName}`,
                    state: 'info'
                });
            }
        } catch (error) {
            this.logger.error('Error in AgentNotificaitonEvent', error);
        }
    };

    /**
     * Remider action executed method to update agent reminder
     */
    private updateReminderStatus(status: string, id: string): void {
        // check if completed or rejected
        SDKClient.updateAgentReminder({
            id,
            message: '',
            status,
            reminderDate: '',
            reminderTime: ''
        });
    }

    /**
     * To process ACWTimerEvent
     *
     * @param {ACWTimerEvent} evt
     */
    private ACWTimerEvent = (evt: ACWTimerEvent) => {
        this._appUIService.showAppSnackbar({
            message: `ACW timer alert for ${evt.ACWTimeString}`,
            state: evt.ColorCode,
            duration: 10000
        });
    };

    /**
     * To process Quiz Event
     * @param {QuizEvent} evt
     */
    private QuizEvent = (evt: QuizEvent): void => {
        const data = JSON.parse(evt.JsonData);
        // get assist widget config
        const title = `${data.Title || 'Custom'} - ${data.params.intentname}`;
        const icon = data.Icon || '';
        const width = data.Width || 1000;
        const height = data.Height || 700;
        const actions: WidgetAction[] = data.Actions || ['destroy', 'maximize'];
        const viewState = data.ViewState || 'restore';

        // create a widget model
        const widget = new TwWidgetModel(title, 'tw-custom', icon);
        widget.Config.Position.W = width;
        widget.Config.Position.H = height;
        widget.Config.Actions = actions;
        widget.Config.ViewState = viewState;

        const url = new URL(data.url);

        Object.keys(data.params).forEach((k) => {
            url.searchParams.append(k, data.params[k]);
        });

        const { agentId } = SDKClient.getAgentData();
        url.searchParams.append('agentId', agentId);

        widget.Data.Url = url.toString();

        this._aotWidgetService.addWidget(widget as AOTWidget);
    };

    /**
     * To process TCM_DirectAgentNotifyTimeoutEvent
     * @param {TCMDirectAgentNotifyTimeoutEvent} evt
     */
    private TCMDirectAgentNotifyTimeoutEvent = (evt: TCMDirectAgentNotifyTimeoutEvent) => {
        const obj = JSON.parse(evt.JsonData);
        const contact = JSON.parse(obj.Contact);
        const message = `Callback request for ${contact.Name} number ${contact.PhoneNumber} timed out.`;

        // show an alert
        this._appUIService.addNotification({
            message,
            status: 'new',
            showAlert: true
        });
        // close the generic interaction in server
        SDKClient.closeInteraction(evt.InteractionID.toString());
    };

    /**
     * To process AgentReminderEvent
     *
     * @param {AgentReminderEvent} evt
     */
    private AgentReminderEvent = (evt: AgentReminderEvent) => {
        evt.Reminders.forEach((item: AgentReminder) => {
            // check if the ref is already opened
            const ref = this._remiderTaskDialog.reminder?.filter((r) => r.id === item.ID)?.length > 0;
            // check if the dialog is opened for this ID
            if (!ref) {
                let message = item.Message;
                let alert = item.Message;
                if (item.Type === 'event') {
                    const jsonMsg = JSON.parse(message);
                    alert = jsonMsg.Title;
                    message = `<b>Title:</b> ${jsonMsg.Title}<br />,
                                <b>Location:</b> ${jsonMsg.Meta.Location || 'NA'}<br />
                                <b>Notes:</b> ${jsonMsg.Meta.Notes || 'NA'}<br />`;
                }
                this._appUIService.showDesktopAlert('You have a new reminder', alert, false);
                const dialogRef = this._appUIService.showRemiderTaskModal('reminder', message, `Reminder @ ${item.RemindDate} ${item.RemindTime}`);
                this._remiderTaskDialog.reminder.push({
                    id: item.ID,
                    ref: dialogRef
                });

                dialogRef.afterClosed().subscribe((resp) => {
                    if (resp === 'accept') {
                        this.updateReminderStatus('Completed', item.ID);
                    } else if (resp.includes('snooze')) {
                        const time = resp.split(':')[1];
                        this.updateReminderStatus(`Snooze:${time}`, item.ID);
                        this._appUIService.showSnackbar(`Reminder is snoozed for ${time} mins`, 'info');
                    }

                    // remove the dialog from ref
                    this._remiderTaskDialog.reminder = this._remiderTaskDialog.reminder.filter((r) => r.id !== item.ID);
                });
            }
        });
    };

    /**
     * To process AgentForcedLogoffEvent
     * @param {AgentForcedLogoffEvent} evt
     */
    private AgentForcedLogoffEvent = (evt: AgentForcedLogoffEvent) => {
        let description = '';
        switch (evt.Type) {
            case 'SupervisorInitiatedLogout':
                description = 'You are logged out by the supervisor!';
                break;
            case 'SessionNotFound':
                description = 'There is no session found in server, please re-login!';
                break;
            case 'SessionKeyExpired':
                description = 'Your existing session expired as you are logged in using another session!';
                break;
            case 'NotLoggedIntoACD':
                description = '';
                break;
            case 'AgentInfoNotFound':
                description = 'Agent information not found, please re-login!';
                break;
            default:
                description = 'Your existing session expired as you are logged in using another session!';
        }

        // we will route to login page
        this._router.navigate(['login'], {
            // queryParamsHandling: 'preserve',
            // preserveFragment: true,
            // state: {
            //     subtitle: 'Oops',
            //     title: '',
            //     description,
            //     login: true
            // }
        });
        this._appUIService.showSnackbar(description);
    };

    /**
     * To process TextChatTransferNotificationEvent
     *
     * @param {TextChatTransferNotificationEvent} evt
     */
    private TextChatTransferNotificationEvent = (evt: TextChatTransferNotificationEvent) => {
        // parse the otherData
        const otherData = JSON.parse(evt.Data);
        // get the type
        const type = otherData.type === 'conf' ? 'conference' : 'transfer';
        // get the mode
        const mode = upperFirst(otherData.mode) + ' Chat';
        let message = `Agent <b>${evt.FromAgentName}</b> is trying to ${type} a ${mode}`;
        // check if the comment is there
        if (evt.Comment) {
            message += `<br /> with comment: ${evt.Comment}`;
        }
        // get cofirmation
        this._appUIService
            .showAppConfirmDialog('generic', `Confirm ${mode} ${upperFirst(type)}`, message)
            .afterClosed()
            .subscribe((resp1) => {
                evt.Response(resp1);
            });
    };

    /**
     * To process TmacServerConnectionSuccess
     *
     * @param {TmacServerConnectionSuccess} evt
     */
    private TmacServerConnectionSuccess = (evt: TmacServerConnectionSuccess) => {
        this._appUIService.showAppSnackbar({
            message: `New server [${evt.ResultMessage}] connection established`
        });
    };

    /**
     * To process TmacServerConnectionAborted
     *
     * @param {TmacServerConnectionAborted} evt
     */
    private TmacServerConnectionAborted = () => {
        // we will route to login page
        this._router.navigate(['login']);
        this._appUIService.showSnackbar('TMAC Server connection closed, Please relogin!');
    };

    /**
     * To process AutoCloseTabEvent
     *
     * @param {AutoCloseTabEvent} evt
     */
    private AutoCloseTabEvent = (evt: AutoCloseTabEvent) => {
        // remove the events for the InteractionID
        this._interactionEventArray = this._interactionEventArray.filter((i) => i.InteractionID !== evt.InteractionID);
    };

    /**
     * Post message received event
     *
     * @param {MessageEvent} evt
     */
    private postMessageReceived = async (evt: MessageEvent) => {
        try {
            // if event data is null then return
            if (!evt.data) {
                return;
            }

            let data: any = {};
            if (typeof evt.data === 'string') {
                try {
                    data = JSON.parse(evt.data);
                } catch (error) {
                    data = {};
                }
            } else if (typeof evt.data === 'object') {
                data = evt.data;
            }

            // check if destination is tmac
            if (data.destination?.toLowerCase() === 'tmac') {
                const message: IPostMessage = data;
                const fn = message.function?.toLowerCase();
                // handle generic function here only
                if (fn === 'emitevent') {
                    this.emitSDKEvent({
                        event: {
                            ...message.data
                        },
                        isInteractionEvent: !!message.data.InteractionID,
                        log: true
                    });
                } else if (fn.endsWith('event')) {
                    // for backward compatibility to support emitting event when AD receives any post message with function which has 'event'
                    this.emitSDKEvent({
                        event: {
                            EventName: message.function,
                            ...message.data
                        },
                        isInteractionEvent: !!message.data.InteractionID,
                        log: true
                    });
                }
                // to close tab/interaction
                else if (fn === 'closetab' || fn === 'closeinteraction') {
                    // check the interactionId
                    const intId = message.data.interactionID ?? message.data.InteractionID ?? message.data.intId;
                    if (!intId) {
                        this.logger.info('postMessageReceived to close tab reject, interaction id not found');
                        return;
                    }
                    // close tab
                    SDKClient.closeInteraction(message.data.interactionID);
                }
                // to show snackbar
                else if (fn === 'showsnackbar' && message.data?.message) {
                    this._appUIService.showSnackbar(
                        message.data.message,
                        message.data?.state ?? 'success',
                        message.data?.vPos ?? 'top',
                        message.data?.hPos ?? 'center',
                        message.data?.timeout ?? 5000,
                        () => {
                            message.data?.onClick?.();
                        }
                    );
                }
                // to invoke SDK method for non custom widgets
                else if (fn === 'invokesdk' && message.source.toLowerCase().includes('launcher')) {
                    try {
                        // if no data is there return
                        if (!message.data?.method) {
                            return;
                        }

                        const method = message.data?.method;
                        const params = message.data?.params ?? '';
                        // invoke SDK method dynamically
                        const response = await SDKClient[method](...params);
                        // send the response to the launcher
                        this.sendPostMessageToTheLauncher(message.callback || `${method}Done`, response);
                    } catch (error) {
                        throw new Error(error);
                    }
                    return;
                }

                // notify the observers
                this._postMessage$.next(data);
            }
        } catch (error) {
            this.logger.error('Error in TMACEventService.postMessageReceived', error, false);
        }
    };

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To subscribe to TMACEventService service
     */
    subscribe(): void {
        this.logger.info('subscribe', false);

        // intialize all the subject
        this._unsubscribeAll = new Subject();
        this._interactionEventArray = new Array();
        this._nonInteractionEventArray = new Array();
        this._nonInteractionEvent$ = new Subject();
        this._interactionEvent$ = new Subject();
        this._postMessage$ = new Subject();
        this._remiderTaskDialog = {
            makeCall: null,
            meeting: null,
            changeState: null,
            dacRequest: null,
            reminder: []
        };

        // subscribe to post message
        window.addEventListener('message', this.postMessageReceived);

        // subscribe to app config
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            if (Object.keys(config).length) {
                // assign the config
                this.appConfig = config;
                // get the AOT widgets
                this._aotWidgets = config.Main.AOT.Widgets;
            }
        });

        this.addTMACEventListener([
            {
                label: 'OnTMACEvent',
                callback: this.OnTMACEvent
            },
            {
                label: 'AgentNotificaitonEvent',
                callback: this.AgentNotificaitonEvent
            },
            {
                label: 'TCMDirectAgentNotifyTimeoutEvent',
                callback: this.TCMDirectAgentNotifyTimeoutEvent
            },
            {
                label: 'ACWTimerEvent',
                callback: this.ACWTimerEvent
            },
            {
                label: 'QuizEvent',
                callback: this.QuizEvent
            },
            {
                label: 'AgentReminderEvent',
                callback: this.AgentReminderEvent
            },
            {
                label: 'AgentForcedLogoffEvent',
                callback: this.AgentForcedLogoffEvent
            },
            {
                label: 'InteractionLimitReachedEvent',
                callback: this.AgentForcedLogoffEvent
            },
            {
                label: 'TextChatTransferNotificationEvent',
                callback: this.TextChatTransferNotificationEvent
            },
            {
                label: 'TmacServerConnectionSuccess',
                callback: this.TmacServerConnectionSuccess
            },
            {
                label: 'TmacServerConnectionAborted',
                callback: this.TmacServerConnectionAborted
            },
            {
                label: 'AutoCloseTabEvent',
                callback: this.AutoCloseTabEvent
            }
        ]);
    }

    /**
     * To unsubscribe to TMACEventService service
     */
    unsubscribe(): void {
        this.logger.info('unsubscribe', false);

        // this.removeTMACEventListener([
        //     {
        //         label: 'OnTMACEvent',
        //         callback: this.OnTMACEvent
        //     }
        // ]);

        // unsubscribe from post message
        window.removeEventListener('message', this.postMessageReceived);

        this.removeTMACEventListener([
            {
                label: 'OnTMACEvent',
                callback: this.OnTMACEvent
            },
            {
                label: 'AgentNotificaitonEvent',
                callback: this.AgentNotificaitonEvent
            },
            {
                label: 'TCMDirectAgentNotifyTimeoutEvent',
                callback: this.TCMDirectAgentNotifyTimeoutEvent
            },
            {
                label: 'ACWTimerEvent',
                callback: this.ACWTimerEvent
            },
            {
                label: 'QuizEvent',
                callback: this.QuizEvent
            },
            {
                label: 'AgentReminderEvent',
                callback: this.AgentReminderEvent
            },
            {
                label: 'AgentForcedLogoffEvent',
                callback: this.AgentForcedLogoffEvent
            },
            {
                label: 'InteractionLimitReachedEvent',
                callback: this.AgentForcedLogoffEvent
            },
            {
                label: 'TextChatTransferNotificationEvent',
                callback: this.TextChatTransferNotificationEvent
            },
            {
                label: 'TmacServerConnectionSuccess',
                callback: this.TmacServerConnectionSuccess
            },
            {
                label: 'TmacServerConnectionAborted',
                callback: this.TmacServerConnectionAborted
            },
            {
                label: 'AutoCloseTabEvent',
                callback: this.AutoCloseTabEvent
            }
        ]);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        this._nonInteractionEvent$.next(null);
        this._nonInteractionEvent$.complete();

        this._nonInteractionEvent$.next(null);
        this._nonInteractionEvent$.complete();

        this._interactionEventArray = new Array();
        this._nonInteractionEventArray = new Array();

        this._remiderTaskDialog = {
            makeCall: null,
            meeting: null,
            changeState: null,
            dacRequest: null,
            reminder: []
        };
    }

    /**
     * Get PostMessages
     */
    get postMessage(): any | Observable<IPostMessage> {
        return this._postMessage$.asObservable();
    }

    /**
     * To get all the existing interaction events.
     *
     * @param interactionId ID of the interaction
     */
    getInteractionEventsArray(interactionId: number): IUIEvent[] {
        return this._interactionEventArray.filter((i) => i.InteractionID === interactionId);
    }

    /**
     * To get all the existing non interaction events.
     */
    getNonInteractionEventsArray(): IUIEvent[] {
        return this._nonInteractionEventArray;
    }

    /**
     * To get interaction events (interaction id) as well as non interaction events
     *
     * @param {Number} interactionId
     */
    getAllEventsArray(interactionId?: number): IUIEvent[] {
        let events = [];
        if (interactionId) {
            events = this._interactionEventArray.filter((e) => e.InteractionID === interactionId);
        }
        return [...events, ...this._nonInteractionEventArray];
    }

    /**
     * To get interaction events (interaction id) as well as non interaction events excluded events
     *
     * @param {CustomTMACEventTypes[]} eventNames
     * @param {Number} interactionId
     * @returns
     */
    getAllEventsArrayExcluded(eventNames: CustomTMACEventTypes[], interactionId?: number): IUIEvent[] {
        return this.getAllEventsArray(interactionId).filter((e) => !eventNames.includes(e.EventName));
    }

    /**
     * To get non-interaction TMAC events for provided eventnames
     *
     * @param {CustomTMACEventTypes[]} eventNames
     */
    getNonInteractionEvents<T = any>(eventNames: CustomTMACEventTypes[]): Observable<T[]> {
        // create a new temp subject
        const tempSub = new Subject<any[]>();

        /**
         * Search for [COMMENT: 01] in this file
         */
        setTimeout(() => {
            // get events from array
            const events = this._nonInteractionEventArray.filter((i: IUIEvent) => eventNames.includes(i.EventName));
            tempSub.next(events);
            tempSub.complete();
        });

        /**
         * Search for [COMMENT: 02] in this file
         */
        // return all non interaction events for provided eventnames
        return concat(tempSub, this._nonInteractionEvent$).pipe(
            map((evts) => evts?.filter((evt) => evt && eventNames.includes(evt.EventName))),
            filter((evts) => evts.length > 0)
        );
    }

    /**
     * To get non-interaction TMAC events for provided eventnames excluded
     *
     * @param {CustomTMACEventTypes[]} eventName Name of the event
     */
    getNonInteractionEventsExcluded<T = any>(eventNames: CustomTMACEventTypes[]): Observable<T[]> {
        // create a new temp subject
        const tempSub = new Subject<any[]>();

        /**
         * Search for [COMMENT: 01] in this file
         */
        setTimeout(() => {
            // get events from array
            const events = this._nonInteractionEventArray.filter((i: IUIEvent) => !eventNames.includes(i.EventName));
            tempSub.next(events);
            tempSub.complete();
        });

        /**
         * Search for [COMMENT: 02] in this file
         */
        // return all non interaction events for provided eventnames excluded
        return merge(tempSub, this._nonInteractionEvent$).pipe(
            map((evts) => evts?.filter((evt) => evt && !eventNames.includes(evt.EventName))),
            filter((evts) => evts.length > 0)
        );
    }

    /**
     * To get interaction TMAC events for provided eventsnames and interaction id
     *
     * @param {CustomTMACEventTypes[]} eventNames
     * @param {Number} interactionId
     */
    getInteractionEvents<T = any>(eventNames: CustomTMACEventTypes[], interactionId: number): Observable<T[]> {
        // create a new temp subject
        const tempSub = new Subject<any[]>();

        /**
         * Search for [COMMENT: 01] in this file
         */
        setTimeout(() => {
            // get events from array
            const events = this._interactionEventArray.filter((i: IUIEvent) => i.InteractionID === interactionId && eventNames.includes(i.EventName));
            tempSub.next(events);
            tempSub.complete();
        });

        /**
         * Search for [COMMENT: 02] in this file
         */
        // return all interaction events for provided interaction id and eventnames
        return concat(tempSub, this._interactionEvent$).pipe(
            map((evts) => evts?.filter((evt) => evt && evt.InteractionID === interactionId && eventNames.includes(evt.EventName))),
            filter((evts) => evts.length > 0)
        );
    }

    /**
     * To get interaction TMAC events for provided eventnames
     *
     * @param {String[]} eventNames Names of the event
     */
    getInteractionEventsByName<T = any>(eventNames: CustomTMACEventTypes[]): Observable<T[]> {
        // create a new temp subject
        const tempSub = new Subject<any[]>();

        /**
         * Search for [COMMENT: 01] in this file
         */
        setTimeout(() => {
            // get events from array
            const events = this._interactionEventArray.filter((i: IUIEvent) => eventNames.includes(i.EventName));
            tempSub.next(events);
            tempSub.complete();
        });

        /**
         * Search for [COMMENT: 02] in this file
         */
        // return all interaction events for provided eventnames
        return concat(tempSub, this._interactionEvent$).pipe(
            map((evts) => evts?.filter((evt) => evt && eventNames.includes(evt.EventName))),
            filter((evts) => evts.length > 0)
        );
    }

    /**
     * To get interaction TMAC events for provided interaction id
     *
     * @param {Number} interactionId InteractionId to filter
     */
    getInteractionEventsById<T = any>(interactionId: number): Observable<T[]> {
        // create a new temp subject
        const tempSub = new Subject<any[]>();

        /**
         * Search for [COMMENT: 01] in this file
         */
        setTimeout(() => {
            // get events from array
            const events = this._interactionEventArray.filter((i: IUIEvent) => i.InteractionID === interactionId);
            tempSub.next(events);
            tempSub.complete();
        });

        /**
         * Search for [COMMENT: 02] in this file
         */
        // return all interaction events for provided interaction id
        return concat(tempSub, this._interactionEvent$).pipe(
            map((evts) => evts?.filter((evt) => evt && evt.InteractionID === interactionId)),
            filter((evts) => evts.length > 0)
        );
    }

    /**
     * To get construct/dispose TMAC events
     *
     * @param {String[]} eventNames Names of the event
     */
    getConstructDisposeEvents<T = any>(eventNames: CustomTMACEventTypes[]): Observable<T[]> {
        // get the event based on interaction Id
        // create a new temp subject
        const tempSub = new Subject<any[]>();

        /**
         * Search for [COMMENT: 01] in this file
         */
        setTimeout(() => {
            // get events from array
            const events = this._interactionEventArray.filter(
                (i: IUIEvent) => (i.IsInteractionConstructEvent || i.IsInteractionDisposeEvent) && eventNames.includes(i.EventName)
            );
            tempSub.next(events);
            tempSub.complete();
        });

        /**
         * Search for [COMMENT: 02] in this file
         */
        // return all interaction events for that is a IsInteractionConstructEvent or IsInteractionDisposeEvent
        return concat(tempSub, this._interactionEvent$).pipe(
            map((evts) =>
                evts?.filter((evt) => evt && (evt.IsInteractionConstructEvent || evt.IsInteractionDisposeEvent) && eventNames.includes(evt.EventName))
            ),
            filter((evts) => evts.length > 0)
        );
    }

    /**
     * To register to TMAC events
     */
    addTMACEventListener(
        events: {
            /**
             * Event label
             */
            label: TMACEventTypes | string;
            /**
             * Event callback
             */
            callback: (...args: any[]) => any;
        }[]
    ): void {
        events.forEach((evt) => {
            const label: any = evt.label;
            SDKClient.events.on(label, evt.callback);
        });
    }

    /**
     * To de-register from TMAC events
     */
    removeTMACEventListener(
        events: {
            /**
             * Event label
             */
            label: TMACEventTypes | string;
            /**
             * Event callback
             */
            callback: (...args: any[]) => any;
        }[]
    ): void {
        events.forEach((evt) => {
            const label: any = evt.label;
            SDKClient.events.off(label, evt.callback);
        });
    }

    /**
     * To emit custom SDK event through subscriber
     *
     * @param {Any} evt
     * @param {Boolean} interactionEvent [OPTIONAL]
     */
    emitSDKEvent(data: {
        /**
         * Event to emit
         */
        event: any;
        /**
         * Is interaction event flag
         */
        isInteractionEvent?: boolean;
        /**
         * To log the event or not
         */
        log?: boolean;
    }): void {
        // emit via SDK
        SDKClient.events.emit(data.event.EventName, data.event);

        // emit via subject
        if (data.isInteractionEvent) {
            this.processInteractionEvents(data.event);
        } else {
            this.processNonInteractionEvents(data.event);
        }

        try {
            // check if logging is enabled
            const logEnabled = this.appConfig?.AppConfigs?.SDK?.Logging?.SDKEvents ?? false;

            // to log the event
            if (logEnabled && data.log) {
                this.logger.info(`${data.event.EventName} - ${JSON.stringify(data.event)}`);
            }
        } catch (error) {}
    }
}

/**
 * [COMMENT: 01]
 * [MS: Jun 5, '21]
 *
 * Emit and complete inorder to use rxjs 'concat' instead of 'merge'
 * Since we use 'concat' the current stream (i.e., tempSub) should be completed
 * then only it subscribes to next sequence (i.e., _interactionEvent$) and
 * passes its values on through to the resulting sequence.
 */

/**
 * [COMMENT: 02]
 * [MS: Jun 5, '21]
 *
 * Changing 'merge' to 'concat'
 * Since we merge 2 observable using 'merge' will not ensure the order of emissions
 * It is simply interested in all values coming out from multiple combined streams as if they were produced by one stream.
 *
 * Using 'concat' will ensure the order of emissions and
 * will first see values emitted by streams that you pass first to the operator (i.e., tempSub)
 * once the first stream is completed then it will start emitting second stream.
 */
