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
    private _unsubscribeAll: Subject<any>;
    private _tmacEventArray: any[];
    private _constructDisposeEventSubject: BehaviorSubject<any>;
    private _aotWidgets: IWidget[];
    private _remiderTaskDialog: {
        makeCall: MatDialogRef<RemiderTaskDialogComponent, any>,
        meeting: MatDialogRef<RemiderTaskDialogComponent, any>,
        changeState: MatDialogRef<RemiderTaskDialogComponent, any>
    };

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
            changeState: null
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

    private remove(interactionId: number): void {
        this._tmacEventArray = this._tmacEventArray.filter(i => i.InteractionID !== interactionId);
    }

    private onAgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        try {
            // get the type
            const type = evt.Type.toLowerCase();
            // handle alerts
            if (type === 'alert' && evt.Message) {
                this._appUIService.showAlertModal(evt.Message, 'error', 'Alert');
            }
            else if (type === 'executeaction') {
                // parse the action
                const parsedMessage: { Action: string, Data: string } = JSON.parse(evt.Message);
                // get the action
                switch (parsedMessage.Action.toLowerCase()) {
                    case 'registercallback':
                        // check if AOT cofngured for register callback
                        const widget = this._aotWidgets.filter((w: IWidget) => w.Type === 'tw-register-callback')?.[0];
                        // check if widget is found
                        if (widget) {
                            this._aotWidgetService.addWidget(widget);
                        }
                        break;
                    default:
                }
            }
            else if (type === 'executetask') {
                // parse the notification message
                const parsedMessage: AgentReminder = JSON.parse(evt.Message);
                // parse then remider message
                const remiderMessage: { Action: string, Data: string, Comment: string } = JSON.parse(parsedMessage.Message);

                // get the action
                switch (remiderMessage.Action.toLowerCase()) {
                    case 'makecall':
                        {
                            // check if the dialog is already opened
                            if (this._remiderTaskDialog.makeCall) {
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

    public unsubscribe(): void {
        TUtils.Logger.console('info', 'TMACEventService.unsubscribe');

        SDKClient.events.off('onTMACEvent', this.onTMACEvents);
        SDKClient.events.off('AgentNotificaitonEvent', this.onAgentNotificaitonEvent);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    public get(interactionId: number): any {
        // get the events based on interaction Id
        const events = this._tmacEventArray.filter(i => i.InteractionID === interactionId);
        if (events.length > 0) {
            return events;
        }
        return [];
    }
}
