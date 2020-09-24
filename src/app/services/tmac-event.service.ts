import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RemiderTaskDialogComponent } from '@modules/shared/remider-task-dialog/remider-task-dialog.component';
import { IWidget } from 'app/interfaces';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentNotificaitonEvent, AgentReminder, AgentStatusChangeEvent, CommandResultEvent, IResponse, IUIEvent, SDKClient, TUtils } from 'tmac-sdk';
import { AOTWidgetService } from './aot-widget.service';
import { AppDataService } from './app-data.service';
import { AppUiService } from './app-ui.service';
import { InteractionManagerService } from './interaction-manager.service';

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
     * TMAC events storage array 
     */
    private _tmacEventArray: any[];

    /**
     * Construct and Dispose TMAC event subject
     */
    private _constructDisposeEventSubject: BehaviorSubject<any>;

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
        makeCall: MatDialogRef<RemiderTaskDialogComponent, any>,
        /**
         * Meeting task dialog ref
         */
        meeting: MatDialogRef<RemiderTaskDialogComponent, any>,
        /**
         * Change status task dialog ref
         */
        changeState: MatDialogRef<RemiderTaskDialogComponent, any>
        /**
         * DAC request dialog ref
         */
        dacRequest: MatDialogRef<RemiderTaskDialogComponent, any>
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
        private _aotWidgetService: AOTWidgetService
    ) {
        // intialize all the subject
        this._unsubscribeAll = new Subject();
        this._constructDisposeEventSubject = new BehaviorSubject({});
        this._tmacEventArray = new Array();
        this._remiderTaskDialog = {
            makeCall: null,
            meeting: null,
            changeState: null,
            dacRequest: null
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * getter for interaction construct/dispose events
     */
    get constructDisposeEvents(): any | Observable<any[]> {
        return this._constructDisposeEventSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private Methods
    // -----------------------------------------------------------------------------------------------------    

    /**
     * TMAC event listener function
     * @param evt TMAC event
     */
    private onTMACEvents = (evt: IUIEvent) => {
        if (evt.InteractionID > 0) {
            // add all the interaction events to the array
            this._tmacEventArray.push(evt);
            // check for construct/dispose events
            if (evt.IsInteractionConstructEvent || evt.IsInteractionDisposeEvent) {
                // for dispose event remove the reference from array
                if (evt.IsInteractionDisposeEvent) {
                    // remove the events for the ID
                    this.remove(evt.InteractionID);
                    // remove the interaction reference 
                    this._interactionManagerService.removeInteraction(evt.InteractionID);
                }
                // notify the observers
                this._constructDisposeEventSubject.next(evt);
            }
        }
    }

    /**
     * To remove all the events from reference which related to an interaction
     */
    private remove(interactionId: number): void {
        this._tmacEventArray = this._tmacEventArray.filter(i => i.InteractionID !== interactionId);
    }

    /**
     * To process AgentNotificaitonEvent
     */
    private onAgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        try {
            // check if the interaction id is there then return
            if (evt.InteractionID > 0) {
                TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: event for an interaction, return');
                return;
            }

            // get the type
            const type = evt.Type.toLowerCase();

            // handle alerts
            if (type === 'alert' && evt.Message) {
                this._appUIService.showAlertModal(evt.Message, 'error', 'Alert');
            }
            else if (type === 'executeaction') {
                // parse the action
                const parsedMessage: {
                    /**
                     * Type of action
                     */
                    Action: string,
                    /**
                     * Data for the notification
                     */
                    Data: string,
                    /**
                     * Mandatory action to be taken
                     */
                    IsMandatory: boolean,
                    /**
                     * [OPTIONAL] Work queue ID for DacRequest action
                     */
                    WQId?: string,
                    /**
                     * [OPTIONAL] Request Id for DacRequest action
                     */
                    RequestId?: string;
                } = JSON.parse(evt.Message);

                // get the action
                switch (parsedMessage.Action.toLowerCase()) {
                    case 'registercallback':
                        {
                            // check if AOT cofngured for register callback
                            const widget = this._aotWidgets.filter((w: IWidget) => w.Type === 'tw-register-callback')?.[0];
                            // check if widget is found
                            if (widget) {
                                this._aotWidgetService.addWidget(widget);
                            }
                            break;
                        }
                    case 'dacrequest':
                        {
                            // check if the dialog is already opened
                            if (this._remiderTaskDialog.dacRequest) {
                                TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: dacRequest dialog is already opened!');
                                return;
                            }

                            // parse the data and get info
                            const {
                                ItemID,
                                CustomerIdentifier,
                                Channel,
                                Key
                            } = JSON.parse(parsedMessage.Data);

                            this._remiderTaskDialog.dacRequest =
                                this._appUIService.showRemiderTaskModal(
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
                    default:
                }
            }
            else if (type === 'executetask') {
                // parse the notification message
                const parsedMessage: AgentReminder = JSON.parse(evt.Message);
                // parse then remider message
                const remiderMessage: {
                    /**
                     * Type of action
                     */
                    Action: string,
                    /**
                     * Data for the reminder
                     */
                    Data: string,
                    /**
                     * Comment to be alerted
                     */
                    Comment: string
                } = JSON.parse(parsedMessage.Message);

                // get the action
                switch (remiderMessage.Action.toLowerCase()) {
                    case 'makecall':
                        {
                            // check if the dialog is already opened
                            if (this._remiderTaskDialog.makeCall) {
                                TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: makeCall dialog is already opened!');
                                return;
                            }

                            this._remiderTaskDialog.makeCall = this._appUIService.showRemiderTaskModal('makecall', remiderMessage.Comment || null);
                            this._remiderTaskDialog.makeCall.afterClosed().subscribe((resp) => {
                                if (resp === 'accept') {
                                    // make call to the provided number and complete the reminder
                                    SDKClient.makeCall({
                                        interactionId: '0',
                                        number: remiderMessage.Data,
                                        source: '',
                                        sourceId: ''
                                    })
                                        .then((dt: IResponse) => {
                                            // get the response
                                            const result: CommandResultEvent = dt.response;
                                            // check the response
                                            if (result.ResultCode === 0) {
                                                // make call success
                                                this._appUIService.showSnackbar(`Make call to ${remiderMessage.Data} successful`);
                                            }
                                            else {
                                                // make call failed
                                                this._appUIService.showSnackbar('Make call failed, please try manually', 'failure');
                                            }
                                        })
                                        .catch(() => {
                                            // make call error
                                            this._appUIService.showSnackbar('Make call error, please try manually', 'failure');
                                        });

                                    // complete the reminder
                                    this.reminderActionExecuted('Completed', parsedMessage.ID);
                                }
                                else if (resp === 'reject') {
                                    // reject the reminder
                                    this.reminderActionExecuted('Rejected', parsedMessage.ID);
                                }
                                else {
                                    // show an alert for auto snooze
                                    this._appUIService.showSnackbar('Make call task is snoozed', 'info');
                                }

                                // set the dialogRef to null
                                this._remiderTaskDialog.makeCall = null;
                            });
                            break;
                        }
                    case 'meeting':
                        {
                            // TODO:: handle meeting task
                            break;
                        }
                    case 'changestate':
                        {
                            // check if the dialog is already opened
                            if (this._remiderTaskDialog.changeState) {
                                TUtils.Logger.console('info', 'TMACEventService.AgentNotificaitonEvent: changeState dialog is already opened!');
                                return;
                            }

                            this._remiderTaskDialog.changeState = this._appUIService.showRemiderTaskModal('changestate', remiderMessage.Comment || null);
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
                                            }
                                            else {
                                                // make call failed
                                                this._appUIService.showSnackbar('Change status failed, please try manually', 'failure');
                                            }
                                        })
                                        .catch(() => {
                                            // make call error
                                            this._appUIService.showSnackbar('Error in change status, please try manually', 'failure');
                                        });

                                    // complete the reminder 
                                    this.reminderActionExecuted('Completed', parsedMessage.ID);
                                }
                                else if (resp === 'reject') {
                                    // reject the reminder
                                    this.reminderActionExecuted('Rejected', parsedMessage.ID);
                                }
                                else {
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
            }
        } catch (error) {
            TUtils.Logger.log('Exception in AgentNotificaitonEvent', error);
        }
    }

    /**
     * Remider action executed method to update agent reminder
     */
    private reminderActionExecuted(status: string, id: string): void {
        // check if completed or rejected
        SDKClient.updateAgentReminder(
            {
                id,
                message: '',
                status
            }
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To subscribe to TMACEventService service
     */
    public subscribe(): void {
        TUtils.Logger.console('info', 'TMACEventService.subscribe');

        // subscribe to app config
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (config: any) => {
                    // get the AOT widgets
                    this._aotWidgets = config.Main.AOT.Widgets;
                }
            );

        SDKClient.events.on('onTMACEvent', this.onTMACEvents);
        SDKClient.events.on('AgentNotificaitonEvent', this.onAgentNotificaitonEvent);
    }

    /**
     * To unsubscribe to TMACEventService service
     */
    public unsubscribe(): void {
        TUtils.Logger.console('info', 'TMACEventService.unsubscribe');

        SDKClient.events.off('onTMACEvent', this.onTMACEvents);
        SDKClient.events.off('AgentNotificaitonEvent', this.onAgentNotificaitonEvent);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * To get all the received events for an interaction.
     * Sometimes interaction events may be received by SDK before
     * app is finishing up with components creation.
     * @param interactionId ID of the interaction
     */
    public get(interactionId: number): any {
        // get the events based on interaction Id
        const events = this._tmacEventArray.filter(i => i.InteractionID === interactionId);
        if (events.length > 0) {
            return events;
        }
        return [];
    }
}
