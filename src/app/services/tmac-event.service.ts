import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReminderTaskDialogComponent } from '@modules/shared/components';
import {
    ACWTimerEvent,
    AgentForcedLogoffEvent,
    AgentNotificaitonEvent,
    AgentReminder,
    AgentReminderEvent,
    AgentStatusChangeEvent,
    CommandResultEvent,
    GenericInteractionEvent,
    IResponse,
    IUIEvent,
    SDKClient,
    TCMDirectAgentNotifyTimeoutEvent,
    TextChatTransferNotificationEvent,
    TMACEventTypes,
    TmacServerConnectionAborted,
    TmacServerConnectionSuccess,
    TUtils
} from '@tmac/sdk';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { CustomTMACEventTypes, IAction, IWidget, QuizEvent } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { map as lodashMap, upperFirst } from 'lodash';
import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { AOTWidgetService } from './aot-widget.service';
import { AppDataService } from './app-data.service';
import { AppUiService } from './app-ui.service';
import { InteractionManagerService } from './interaction-manager.service';

/**
 *  Componentless Event service
 */
@Injectable({
    providedIn: 'root'
})
export class TMACEventService {
    // Private
    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * App config
     */
    appConfig: any;
    /**
     * Interaction events storage array
     */
    private _interactionEventArray: any[];
    /**
     * Interaction event subject
     */
    private _interactionEventSub: Subject<any[]>;
    /**
     * TMAC events story array
     */
    private _nonInteractionEventArray: any[];
    /**
     * Non interaction event subject
     */
    private _nonInteractionEventSub: Subject<any[]>;
    /**
     * Construct and Dispose TMAC event subject
     */
    private _constructDisposeEventSubject: Subject<any>;
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
         * TCM WQ voice DAC request dialog ref
         */
        tcmWQVoice: MatDialogRef<ReminderTaskDialogComponent, any>;
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
     * @param {InteractionManagerService} _interactionManagerService
     * @param {AppUiService} _appUIService
     * @param {AOTWidgetService} _aotWidgetService
     */
    constructor(
        private _appDataService: AppDataService,
        private _interactionManagerService: InteractionManagerService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _router: Router
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // /**
    //  * getter for interaction construct/dispose events
    //  */
    // get constructDisposeEvents(): any | Observable<any> {
    //     return this._constructDisposeEventSubject.asObservable();
    // }

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
    }

    /**
     * To process interaction events
     *
     * @param {IUIEvent} evt
     */
    private processInteractionEvents(evt: IUIEvent): void {
        // add all the interaction events to the array
        this._interactionEventArray.push(evt);
        // check for construct/dispose events
        if (evt.IsInteractionConstructEvent || evt.IsInteractionDisposeEvent) {
            // for dispose event remove the reference from array
            if (evt.IsInteractionDisposeEvent) {
                // remove the events for the ID
                this.removeEvents(evt.InteractionID);
                // remove the interaction reference
                this._interactionManagerService.removeInteraction(evt.InteractionID);
            }
            // notify the observers
            this._constructDisposeEventSubject.next(evt);
        }
        // notify the subscribers
        this._interactionEventSub.next([evt]);
    }

    /**
     * To process non interaction events
     *
     * @param {IUIEvent} evt
     */
    private processNonInteractionEvents(evt: IUIEvent): void {
        let updated = false;
        // check event is already there, then update
        this._nonInteractionEventArray = lodashMap(this._nonInteractionEventArray, (tEvent: IUIEvent) => {
            if (tEvent.EventName === evt.EventName) {
                tEvent = evt;
                updated = true;
            }
            return tEvent;
        });

        // if not updated then add
        if (!updated) {
            this._nonInteractionEventArray.push(evt);
        }

        // notify the subscribers
        this._nonInteractionEventSub.next([evt]);
    }

    /**
     * To remove all the events from reference which related to an interaction
     */
    private removeEvents(interactionId: number): void {
        this._interactionEventArray = this._interactionEventArray.filter((i) => i.InteractionID !== interactionId);
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
            //     TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: event for an interaction, return');
            //     return;
            // }

            // get the type
            const type = evt.Type?.toLowerCase() || '';

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
                            this._aotWidgetService.addWidget(widget);
                        }
                        break;
                    }
                    case 'dacrequest': {
                        // check if the dialog is already opened
                        if (this._remiderTaskDialog.dacRequest) {
                            TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: dacRequest dialog is already opened!');
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
                            this._aotWidgetService.addWidget(widget);
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
                            TUtils.Logger.console('warn', 'TMACEventService.AgentNotificaitonEvent: makeCall dialog is already opened!');
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
                                // snooze the reminder
                                this.updateReminderStatus('Snooze', parsedMessage.ID);
                                // show an alert for auto snooze
                                this._appUIService.showSnackbar('Make call task is snoozed', 'info');
                            }

                            // set the dialogRef to null
                            this._remiderTaskDialog.makeCall = null;
                        });
                        break;
                    }
                    case 'meeting': {
                        // check if the dialog is already opened
                        if (this._remiderTaskDialog.meeting) {
                            TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: meeting dialog is already opened!');
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
                                // show an alert for auto snooze
                                this._appUIService.showSnackbar('Meeting task is snoozed', 'info');
                            }

                            // set the dialogRef to null
                            this._remiderTaskDialog.meeting = null;
                        });
                        break;
                    }
                    case 'changestate': {
                        // check if the dialog is already opened
                        if (this._remiderTaskDialog.changeState) {
                            TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: changeState dialog is already opened!');
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
                                // show an alert for auto snooze
                                this._appUIService.showSnackbar('Change status task is snoozed', 'info');
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
                                this._appUIService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
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
            TUtils.Logger.error('Exception in AgentNotificaitonEvent', error);
        }
    }

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
    }

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
        const actions: IAction[] = data.Actions || ['destroy', 'maximize'];
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

        this._aotWidgetService.addWidget(widget);
    }

    /**
     * Tp process GenericInteractionEvent
     * @param {GenericInteractionEvent} evt
     */
    private GenericInteractionEvent = (evt: GenericInteractionEvent) => {
        // check the type for TCMVoiceWQ
        if (evt.Item.Type.toLowerCase() !== 'tcmvoicewq') {
            return;
        }
        const { PhoneNumber } = evt.Item;
        const { agentId, deviceId } = SDKClient.getAgentData();
        // inform TCM proxy about the assignment
        const tcmClientUrl = this.appConfig.Main.Urls.TCMClient || '';
        // only notify that callback request is assigned if it was assigned the first time and not if the UI is reloaded or re-login
        if (!evt.RecoveryEvent) {
            if (tcmClientUrl) {
                TUtils.HttpClient.sendRequest({
                    url: tcmClientUrl + '/OnDacNotificationEvent',
                    header: {
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    responseType: 'json',
                    requestArgs: {
                        fromAddr: PhoneNumber,
                        response: 'assigned',
                        agentID: agentId,
                        extension: deviceId,
                        scheduletime: '',
                        interactionId: evt.InteractionID
                    }
                })
                    .then((dt: IResponse) => {
                        if (dt.response.d === 1) {
                            this.promptTCMWQDACRequest(evt);
                        } else {
                            this.tcwWQDACRequestError(evt.InteractionID.toString());
                        }
                    })
                    .catch(() => {
                        this.tcwWQDACRequestError(evt.InteractionID.toString());
                    });
            } else {
                this.tcwWQDACRequestError(evt.InteractionID.toString());
                return;
            }
        } else {
            this.promptTCMWQDACRequest(evt);
        }
    }

    /**
     * To process TCM WQ DAC request
     *
     * @param {GenericInteractionEvent} evt
     */
    private promptTCMWQDACRequest(evt: GenericInteractionEvent): void {
        const { PhoneNumber, Skill, ID } = evt.Item;
        const { agentId, deviceId } = SDKClient.getAgentData();
        this._remiderTaskDialog.tcmWQVoice = this._appUIService.showRemiderTaskModal('tcmwqvoice', `Dial-out to customer ${PhoneNumber}?`);
        this._remiderTaskDialog.tcmWQVoice.afterClosed().subscribe((resp) => {
            // if agent accept the callback
            if (resp === 'accept') {
                // prepare query string
                const queryParams = `fromAddr=${PhoneNumber}&agentID=${agentId}&extension=${deviceId}&ucid=''&skill=${Skill}&intid=${evt.InteractionID}&ID=${ID}`;
                // make call to the provided number and complete the reminder
                SDKClient.makeCall({
                    interactionId: '0',
                    number: PhoneNumber,
                    source: 'tcamp',
                    sourceId: queryParams
                })
                    .then((dt) => {
                        // check the response
                        if (dt.response.ResultCode === 0) {
                            // make call success
                            this._appUIService.showSnackbar(`Make call to ${PhoneNumber} successful`);
                        } else {
                            // make call failed
                            this._appUIService.showSnackbar(`Make call failed, ${dt.response.ResultMessage}`, 'failure');
                        }
                    })
                    .catch(() => {
                        // make call error
                        this._appUIService.showSnackbar('Make call error', 'failure');
                    });
            }
            // close the dialog
            this._remiderTaskDialog.tcmWQVoice = null;
        });
    }

    /**
     * To handle TCM WQ DAC request error
     */
    private tcwWQDACRequestError(interactionId: string): void {
        this._appUIService.addNotification({
            message: 'Error in assigning DAC item, Please contact administrator',
            status: 'new',
            icon: 'error',
            showAlert: true
        });
        // close the dialog
        this._remiderTaskDialog.tcmWQVoice = null;
        // close the generic interaction in server
        SDKClient.closeInteraction(interactionId);
    }

    /**
     * To process TCM_DirectAgentNotifyTimeoutEvent
     * @param {TCMDirectAgentNotifyTimeoutEvent} evt
     */
    private TCMDirectAgentNotifyTimeoutEvent = (evt: TCMDirectAgentNotifyTimeoutEvent) => {
        const obj = JSON.parse(evt.JsonData);
        const contact = JSON.parse(obj.Contact);

        // show an alert
        this._appUIService.addNotification({
            message: 'Callback request for ' + contact.Name + ' number ' + contact.PhoneNumber + ' timed out.',
            status: 'new',
            showAlert: true
        });
        // close the dialog
        this._remiderTaskDialog.tcmWQVoice = null;
        // close the generic interaction in server
        SDKClient.closeInteraction(evt.InteractionID.toString());
    }

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
                if (item.Type === 'event') {
                    const jsonMsg = JSON.parse(message);
                    message = `<b>Title:</b> ${jsonMsg.Title}<br />,
                                <b>Location:</b> ${jsonMsg.Meta.Location || 'NA'}<br />
                                <b>Notes:</b> ${jsonMsg.Meta.Notes || 'NA'}<br />`;
                }
                const dialogRef = this._appUIService.showRemiderTaskModal(
                    'reminder',
                    message,
                    `Reminder @ ${item.RemindDate} ${item.RemindTime}`
                );

                this._remiderTaskDialog.reminder.push({
                    id: item.ID,
                    ref: dialogRef
                });

                dialogRef.afterClosed().subscribe((resp) => {
                    if (resp === 'accept') {
                        this.updateReminderStatus('Completed', item.ID);
                    } else if (resp.includes('snooze')) {
                        const time = resp.split(':')[1];
                        this._appUIService.showSnackbar(`Reminder is snoozed for ${time} mins`, 'info');
                        this.updateReminderStatus(`Snooze:${time}`, item.ID);
                    }

                    // remove the dialog from ref
                    this._remiderTaskDialog.reminder = this._remiderTaskDialog.reminder.filter((r) => r.id !== item.ID);
                });
            }
        });
    }

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
            queryParamsHandling: 'preserve'
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
    }

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
    }

    /**
     * To process TmacServerConnectionSuccess
     *
     * @param {TmacServerConnectionSuccess} evt
     */
    private TmacServerConnectionSuccess = (evt: TmacServerConnectionSuccess) => {
        this._appUIService.showAppSnackbar({
            message: `New TMAC server [(${evt.ResultMessage})] connection established`
        });
    }

    /**
     * To process TmacServerConnectionAborted
     *
     * @param {TmacServerConnectionAborted} evt
     */
    private TmacServerConnectionAborted = (evt: TmacServerConnectionAborted) => {
        // we will route to login page
        this._router.navigate(['login'], { queryParamsHandling: 'preserve' });
        this._appUIService.showSnackbar('TMAC Server connection closed, Please relogin!');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To subscribe to TMACEventService service
     */
    public subscribe(): void {
        TUtils.Logger.console('info', 'TMACEventService.subscribe');

        // intialize all the subject
        this._unsubscribeAll = new Subject();
        this._constructDisposeEventSubject = new BehaviorSubject({});
        this._interactionEventArray = new Array();
        this._nonInteractionEventArray = new Array();
        this._nonInteractionEventSub = new Subject();
        this._interactionEventSub = new Subject();
        this._remiderTaskDialog = {
            makeCall: null,
            meeting: null,
            changeState: null,
            dacRequest: null,
            tcmWQVoice: null,
            reminder: []
        };

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
                label: 'GenericInteractionEvent',
                callback: this.GenericInteractionEvent
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
            }
        ]);

        // subscribe to InteractionManagerService
        this._interactionManagerService.subscribe();
    }

    /**
     * To unsubscribe to TMACEventService service
     */
    public unsubscribe(): void {
        TUtils.Logger.console('info', 'TMACEventService.unsubscribe');

        // this.removeTMACEventListener([
        //     {
        //         label: 'OnTMACEvent',
        //         callback: this.OnTMACEvent
        //     }
        // ]);

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
                label: 'GenericInteractionEvent',
                callback: this.GenericInteractionEvent
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
            }
        ]);


        // unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        this._constructDisposeEventSubject.next();
        this._constructDisposeEventSubject.complete();

        this._nonInteractionEventSub.next();
        this._nonInteractionEventSub.complete();

        this._nonInteractionEventSub.next();
        this._nonInteractionEventSub.complete();

        this._interactionEventArray = new Array();
        this._nonInteractionEventArray = new Array();

        this._remiderTaskDialog = {
            makeCall: null,
            meeting: null,
            changeState: null,
            dacRequest: null,
            tcmWQVoice: null,
            reminder: []
        };

        // unsubscribe from InteractionManagerService
        this._interactionManagerService.unsubscribe();
    }

    /**
     * To get all the existing interaction events.
     *
     * @param interactionId ID of the interaction
     */
    public interactionEvents(interactionId: number): any[] {
        // get the events based on interaction Id
        const events = this._interactionEventArray.filter((i) => i.InteractionID === interactionId);
        if (events.length > 0) {
            return events;
        }
        return [];
    }

    /**
     * To get all the existing non interaction events.
     */
    public nonInteractionEvents(): any[] {
        // get the events based on interaction Id
        const events = this._nonInteractionEventArray;
        if (events.length > 0) {
            return events;
        }
        return [];
    }

    /**
     * To get non-interaction TMAC event with event name
     *
     * @param eventName Name of the event
     */
    public getEvents<T = any>(eventNames: CustomTMACEventTypes[]): Observable<T[]> {
        // get the event based on interaction Id
        const events = this._nonInteractionEventArray.filter((i: IUIEvent) => eventNames.includes(i.EventName));

        // create a new temp subject
        const tempSub = new Subject<any[]>();

        // check if anything exist, then send
        if (events.length) {
            setTimeout(() => {
                tempSub.next(events);
            });
        }

        // return all non interaction events for provided event names
        return merge(tempSub, this._nonInteractionEventSub).pipe(
            map((evts) => evts?.filter((evt) => evt && eventNames.includes(evt.EventName))),
            filter((evts) => evts.length > 0)
        );
    }

    /**
     * To get non-interaction TMAC event with event name
     *
     * @param eventName Name of the event
     */
    public getAllEvents<T = any>(): Observable<T[]> {
        // get the event based on interaction Id
        const events = this._nonInteractionEventArray;
        // create a new temp subject
        const tempSub = new Subject<any[]>();

        // check if anything exist, then send
        if (events.length) {
            setTimeout(() => {
                tempSub.next(events);
            });
        }

        // return all non interaction events
        return merge(tempSub, this._nonInteractionEventSub)
            .pipe(filter((evts) => evts.length > 0));
    }

    /**
     * To get interaction TMAC event by event names and interaction id
     *
     * @param {String[]} eventNames Names of the event
     * @param {Number} interactionId InteractionId to filter
     */
    public getInteractionEvents<T = any>(eventNames: CustomTMACEventTypes[], interactionId: number): Observable<T[]> {
        // get the event based on interaction Id
        const events = this._interactionEventArray.filter((i: IUIEvent) => i.InteractionID === interactionId && eventNames.includes(i.EventName));

        // create a new temp subject
        const tempSub = new Subject<any[]>();

        // check if anything exist, then send
        if (events.length) {
            setTimeout(() => {
                tempSub.next(events);
            });
        }

        // return all interaction events for that interaction id and event names
        return merge(tempSub, this._interactionEventSub)
            .pipe(
                map((evts) => evts?.filter((evt) => evt && evt.InteractionID === interactionId && eventNames.includes(evt.EventName))),
                filter((evts) => evts.length > 0)
            );
    }

    /**
     * To get interaction TMAC event with event names
     *
     * @param {String[]} eventNames Names of the event
     */
    public getInteractionEventsByName<T = any>(eventNames: CustomTMACEventTypes[]): Observable<T[]> {
        // get the event based on interaction Id
        const events = this._interactionEventArray.filter((i: IUIEvent) => eventNames.includes(i.EventName));

        // create a new temp subject
        const tempSub = new Subject<any[]>();

        // check if anything exist, then send
        if (events.length) {
            setTimeout(() => {
                tempSub.next(events);
            });
        }

        // return all interaction events for that interaction id and event names
        return merge(tempSub, this._interactionEventSub)
            .pipe(
                map((evts) => evts?.filter((evt) => evt && eventNames.includes(evt.EventName))),
                filter((evts) => evts.length > 0)
            );
    }

    /**
     * To get interaction TMAC event with event by ID
     *
     * @param {Number} interactionId InteractionId to filter
     */
    public getInteractionEventsById<T = any>(interactionId: number): Observable<T[]> {
        // get the event based on interaction Id
        const events = this._interactionEventArray.filter((i: IUIEvent) => i.InteractionID === interactionId);

        // create a new temp subject
        const tempSub = new Subject<any[]>();

        // check if anything exist, then send
        if (events.length) {
            setTimeout(() => {
                tempSub.next(events);
            });
        }

        // return all interaction events for that interaction id
        return merge(tempSub, this._interactionEventSub)
            .pipe(
                map((evts) => evts?.filter((evt) => evt && evt.InteractionID === interactionId)),
                filter((evts) => evts.length > 0)
            );
    }

    /**
     * To get construct/dispose events
     *
     * @param {String[]} eventNames Names of the event
     */
    public getConstructDisposeEvents<T = any>(eventNames: CustomTMACEventTypes[]): Observable<T[]> {
        // get the event based on interaction Id
        const events = this._interactionEventArray.filter(
            (i: IUIEvent) => (i.IsInteractionConstructEvent || i.IsInteractionDisposeEvent) && eventNames.includes(i.EventName)
        );

        // create a new temp subject
        const tempSub = new Subject<any[]>();

        // check if anything exist, then send
        if (events.length) {
            setTimeout(() => {
                tempSub.next(events);
            });
        }

        // return all interaction events for that interaction id and event names
        return merge(tempSub, this._interactionEventSub)
            .pipe(
                map((evts) =>
                    evts?.filter((evt) => evt && (evt.IsInteractionConstructEvent || evt.IsInteractionDisposeEvent) && eventNames.includes(evt.EventName))
                ),
                filter((evts) => evts.length > 0)
            );
    }

    /**
     * To register to TMAC events
     */
    public addTMACEventListener(events: {
        /**
         * Event label
         */
        label: TMACEventTypes | string,
        /**
         * Event callback
         */
        callback: (...args: any[]) => any
    }[]): void {
        events.forEach(evt => {
            const label: any = evt.label;
            SDKClient.events.on(label, evt.callback);
        });
    }

    /**
     * To de-register from TMAC events
     */
    public removeTMACEventListener(events: {
        /**
         * Event label
         */
        label: TMACEventTypes | string,
        /**
         * Event callback
         */
        callback: (...args: any[]) => any
    }[]): void {
        events.forEach(evt => {
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
    public emitSDKEvent(evt: any, interactionEvent: boolean = false): void {
        // emit via SDK
        SDKClient.events.emit(evt.EventName, evt);
        // emit via subject
        if (interactionEvent) {
            this.processInteractionEvents(evt);
        } else {
            this.processNonInteractionEvents(evt);
        }
    }
}
