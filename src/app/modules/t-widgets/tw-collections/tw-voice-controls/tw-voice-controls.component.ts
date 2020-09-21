import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { TMACEventService } from '@services/tmac-event.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { InteractionRef, IWidget } from 'app/interfaces';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
    AVChannel,
    AVEvent,
    CallConferenceCompletedEvent,
    CallConferenceInitiatedEvent,
    CallConferenceLineDisconnectEvent,
    CallConferenceRemoteConnectedEvent,
    CallConnectedEvent,
    CallDisconnectedEvent,
    CallHoldEvent,
    CallHoldReconnectEvent,
    CallTransferInitiatedEvent,
    CallTransferLineDisconnectEvent,
    CallTransferRemoteConnectedEvent,
    IAgentData,
    IResponse,
    IUIEvent,
    MediaServerEvent,
    SDKClient,
    TUtils,
    TEnums,
    IVRDataEvent,
    CallerIntentEvent,
    AgentInteractionTemplate
} from 'tmac-sdk';
import { AppUiService } from '@services/app-ui.service';
import { arch } from 'os';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@modules/shared/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'tw-voice-controls',
    templateUrl: './tw-voice-controls.component.html',
    styleUrls: ['./tw-voice-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoiceControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    fuseConfig: FuseConfig;
    appConfig: any;

    interactionId: number;
    interactionList: InteractionRef[] = [];

    user: IAgentData;
    callerID = 'NA';
    startTime = '00:00:00';
    sessionID = 'NA';
    intent = 'NA';
    direction = 'NA';
    duration: any;
    stopTimer = new Subject();
    last4IVR = [];
    status = 'NA';
    isMSCall = false;
    isManualAnswer = false;
    avConns: AVChannel[] = [];
    msAudioStreams = [];
    processMediaMessages = false;
    mediaServerMessages = [];
    audioPlayer: any;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appDataService: AppDataService,
        private _interactionManagerService: InteractionManagerService,
        private _interactionEventService: TMACEventService,
        private _appUIService: AppUiService,
        private _dialog: MatDialog
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the user info
        this.user = SDKClient.getAgentData() || null;

        // subscribe to fuse
        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.fuseConfig = config;
                });

        // subscribe to app data config
        this._appDataService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.appConfig = config;
                });

        // subscribe to interaction manager service
        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                // filter out the textchat interaction
                this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'voice');
            });

        if (this.data.InteractionDetails) {
            const interactionDetails = this.data.InteractionDetails;
            // set the interaction id from data
            this.interactionId = interactionDetails.InteractionID;
            // set the start time
            this.startTime = new Date(Date.parse(interactionDetails.CreatedTime.toString())).toLocaleString();
            // assign the caller id
            this.callerID = interactionDetails.PhoneNumber || 'NA';
            // update the session ID
            this.sessionID = (interactionDetails.UCID || 'NA') + '|' + this.interactionId;
            // set the manual anser flag
            this.isManualAnswer = interactionDetails.IsManualAnswer || false;
            // set the process media messages flag
            this.processMediaMessages = !this.isManualAnswer;
            // check the event name
            if (interactionDetails.EventName === 'IncomingCallEvent') {
                // set the direction
                this.direction = 'In';
                // set the status
                this.status = 'incoming';

                // assign the last 4 IVR, if default is configured
                this.last4IVR = this.data.Data.IVR?.DefaultMenu || [];
            }
            else {
                // set direction
                this.direction = 'Out';
                // set status
                this.status = 'outgoing';
            }
        }
        else {
            console.warn('Interaction details are not available for voice');
            return;
        }

        // listen to TMAC events
        this.registerToEvents();
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this.deRegisterFromEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private registerToEvents(): void {
        // get the event from event bag to make sure no events are missed
        const eventBag = this._interactionEventService.get(this.interactionId);

        // process the events if any
        eventBag.forEach((evt: IUIEvent) => {
            this[evt.EventName]?.(evt);
        });

        // register to tmac events
        SDKClient.events.on('CallConnectedEvent', this.CallConnectedEvent);
        SDKClient.events.on('CallDisconnectedEvent', this.CallDisconnectedEvent);
        SDKClient.events.on('CallHoldEvent', this.CallHoldEvent);
        SDKClient.events.on('CallHoldReconnectEvent', this.CallHoldReconnectEvent);

        SDKClient.events.on('CallTransferInitiatedEvent', this.CallTransferInitiatedEvent);
        SDKClient.events.on('CallTransferLineDisconnectEvent', this.CallTransferLineDisconnectEvent);
        SDKClient.events.on('CallTransferRemoteConnectedEvent', this.CallTransferRemoteConnectedEvent);

        SDKClient.events.on('CallConferenceInitiatedEvent', this.CallConferenceInitiatedEvent);
        SDKClient.events.on('CallConferenceCompletedEvent', this.CallConferenceCompletedEvent);
        SDKClient.events.on('CallConferenceLineDisconnectEvent', this.CallConferenceLineDisconnectEvent);
        SDKClient.events.on('CallConferenceRemoteConnectedEvent', this.CallConferenceRemoteConnectedEvent);

        SDKClient.events.on('MediaServerEvent', this.MediaServerEvent);
        SDKClient.events.on('VoiceCannedResponseEvent', this.VoiceCannedResponseEvent);

        SDKClient.events.on('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.on('IVRDataEvent', this.IVRDataEvent);
    }

    private deRegisterFromEvents(): void {
        // deregister from tmac events
        SDKClient.events.off('CallConnectedEvent', this.CallConnectedEvent);
        SDKClient.events.off('CallDisconnectedEvent', this.CallDisconnectedEvent);
        SDKClient.events.off('CallHoldEvent', this.CallHoldEvent);
        SDKClient.events.off('CallHoldReconnectEvent', this.CallHoldReconnectEvent);

        SDKClient.events.off('CallTransferInitiatedEvent', this.CallTransferInitiatedEvent);
        SDKClient.events.off('CallTransferLineDisconnectEvent', this.CallTransferLineDisconnectEvent);
        SDKClient.events.off('CallTransferRemoteConnectedEvent', this.CallTransferRemoteConnectedEvent);

        SDKClient.events.off('CallConferenceInitiatedEvent', this.CallConferenceInitiatedEvent);
        SDKClient.events.off('CallConferenceCompletedEvent', this.CallConferenceCompletedEvent);
        SDKClient.events.off('CallConferenceLineDisconnectEvent', this.CallConferenceLineDisconnectEvent);
        SDKClient.events.off('CallConferenceRemoteConnectedEvent', this.CallConferenceRemoteConnectedEvent);

        SDKClient.events.off('MediaServerEvent', this.MediaServerEvent);
        SDKClient.events.off('VoiceCannedResponseEvent', this.VoiceCannedResponseEvent);

        SDKClient.events.off('CallerIntentEvent', this.CallerIntentEvent);
        SDKClient.events.off('IVRDataEvent', this.IVRDataEvent);

    }

    private CallConnectedEvent = (evt: CallConnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // subscribe to the timer
        timer(1000, 1000)
            .pipe(takeUntil(this.unsubscribeAll), takeUntil(this.stopTimer))
            .subscribe(val => {
                this.duration = (val + 1) * 1000;
            });

        // set the status
        this.status = 'connected';
        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'connected',
            user: this.callerID,
            otherData: {
                isMSCall: this.isMSCall
            }
        });
    }

    private CallDisconnectedEvent = (evt: CallDisconnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // clear audio if any
        this._appUIService.clearAudio();

        // set the status
        this.status = 'disconnected';
        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'disconnected'
        });

        // stop duration timer
        this.stopTimer.next();
    }

    private CallHoldEvent = (evt: CallHoldEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // set the status
        this.status = 'hold';
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'hold'
        });

        // hide the progress bar
        this._fuseProgressBarService.hide();
    }

    private CallHoldReconnectEvent = (evt: CallHoldReconnectEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // set the status
        this.status = 'connected';
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'connected'
        });

        // hide the progress bar
        this._fuseProgressBarService.hide();
    }

    private CallTransferInitiatedEvent = (evt: CallTransferInitiatedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    private CallTransferLineDisconnectEvent = (evt: CallTransferLineDisconnectEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    private CallTransferRemoteConnectedEvent = (evt: CallTransferRemoteConnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    private CallConferenceInitiatedEvent = (evt: CallConferenceInitiatedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    private CallConferenceCompletedEvent = (evt: CallConferenceCompletedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    private CallConferenceLineDisconnectEvent = (evt: CallConferenceLineDisconnectEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    private CallConferenceRemoteConnectedEvent = (evt: CallConferenceRemoteConnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    private MediaServerEvent = (evt: MediaServerEvent) => {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // ReviewCodeLine: to check if this is needed
            // // set the session Id if empty
            // if (!this.sessionID) {
            //     this.sessionID = evt.SessionID;
            // }

            // init the connection variable
            let connection: AVChannel = null;

            // switch the type and process
            switch (evt.Type) {
                case 'call-received':
                    // create WebRTC peer connection
                    connection = this.createAVConnection('in');
                    connection?.directCall(TEnums.WrcCallTypes.Audio, 'in');
                    // play incoming call sound 
                    this._appUIService.playAudio('incoming-call', 0.5, true);
                    break;
                case 'call-connecting':
                    // create WebRTC peer connection
                    connection = this.createAVConnection('out');
                    connection?.directCall(TEnums.WrcCallTypes.Audio);
                    // play incoming call sound 
                    this._appUIService.playAudio('ringing', 0.5, true);
                    break;
                case 'call-connected':
                    // clear tone of once call connected
                    this._appUIService.clearAudio();
                    break;
                case 'eventav':
                    // process event av
                    this.processEventAV(JSON.parse(evt.Message));
                    break;
                default:
            }

            // get the connection based on session id
            connection = this.avConns[this.sessionID];

            // check if the connection is added
            if (connection) {
                // check if the messages can be processed by WebRTC API, if not add to the reference and process after answer call
                if (this.processMediaMessages) {
                    // send the message to webclient api to process the av messages
                    connection.onMessage(evt.Message);
                }
                else {
                    this.mediaServerMessages.push(evt.Message);
                }
            }
        } catch (error) {
            TUtils.Logger.log('Exception in TwVoiceControlsComponent.MediaServerEvent', error);
        }
    }

    private VoiceCannedResponseEvent = (evt: { AudioBuffer: ArrayBuffer, InteractionID: number, Item: AgentInteractionTemplate }) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check if audio is playing already
        this.audioPlayer?.stop();

        // check the status of call
        if (this.status !== 'connected') {
            this._appUIService.showSnackbar(`Cannot play canned audio in ${this.status} state`, 'failure');
            return;
        }

        // get the connection based on session id and play the buffer
        this.audioPlayer = this.avConns[this.sessionID]?.playAudio(evt.AudioBuffer);

        // check if played
        if (!this.audioPlayer) {
            this._appUIService.showSnackbar(`Error in playing canned audio '${evt.Item.Name}'`, 'failure');
            return;
        }

        // append the name to audio player
        this.audioPlayer.fileName = evt.Item.Name;

        // set the state to playing
        this.audioPlayer._adpState = 'playing';

        // listen to onEnd
        this.audioPlayer.onEnd = () => {
            this.audioPlayer = null;
        };

        // show a success alert
        this._appUIService.showSnackbar(`Canned audio '${evt.Item.Name}' started playing`);

        // create custom event and send  
        SDKClient.events.emit('VoiceCannedResponseAckEvent', {
            SAudioPlayer: this.audioPlayer,
            Item: evt.Item
        });
    }

    private CallerIntentEvent = (evt: CallerIntentEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // assign the intent name
        this.intent = evt.IntentName;
    }

    private IVRDataEvent = (evt: IVRDataEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        this.last4IVR = [evt.LastMenu_4, evt.LastMenu_3, evt.LastMenu_2, evt.LastMenu];
    }

    private createAVConnection(direction: string): AVChannel {
        try {
            // set MS call to true
            this.isMSCall = true;

            // TODO:: check for transfer call via direction

            // create a AV channel connection
            const connection = new AVChannel(
                SDKClient,
                this.interactionId.toString(),
                this.user.agentId,
                '',
                this.sessionID.split('|')[0],
                'voice',
                this.appConfig.AppConfigs.AV || {}
            );

            // register to all AV events
            connection?.events.on('onAVEvent', this.onAVEvent);

            // push the connection to the list
            this.avConns[this.sessionID] = connection;

            // update the interaction status and user
            this._interactionManagerService.updateInteraction(this.interactionId, {
                otherData: {
                    avConn: this.avConns[this.sessionID]
                }
            });

            // return the connection
            return connection;

        } catch (error) {
            TUtils.Logger.log('Exception in TwVoiceControlsComponent.createAVConnection', error);
        }
        return null;
    }

    private onAVEvent = (evt: AVEvent) => {
        // swtich the av events
        switch (evt.event) {
            case 'onTrace':
                TUtils.Logger.log(evt.data);
                break;
            case 'onError':
                TUtils.Logger.log('Exception in TwVoiceControlsComponent.onAVEvent', evt.data);
                break;
            case 'onConnected':
                console.log('onAVEvent - onConnected');
                break;
            case 'onDisconnected':
                console.log('onAVEvent - onDisconnected');
                // clear tone of disconnect on dial or incoming
                this._appUIService.clearAudio();
                break;
            case 'onCollectorStats':
                // TODO:: handle MOS
                break;
            case 'onRemoteVideoAdded':
                // add the stream to reference
                this.msAudioStreams.push(evt.data);
                break;
            case 'onRemoteStreamEnded':
                // remove the stream from the reference
                this.msAudioStreams = this.msAudioStreams.filter(a => a.streamInfo.id !== evt.data.streamInfo.id);
                break;
            case 'onEnd':
                // remove the av reference on end
                delete this.avConns[this.sessionID];
                break;
            default:
                console.log(`unhandled:: [${evt.event}]`, evt);
        }
    }

    private processEventAV(evt: any): void {
        switch (evt.event) {
            case 'connected':
                break;
            case 'call-held':
                break;
            case 'call-resumed':
                break;
            case 'disconnected':
                break;
            case 'call-ended':
                // play call ended tone
                this._appUIService.playAudio('hung-up', 0.5, false);
                // close the av connection
                this.avConns[this.sessionID]?.close();
                break;
            default:
        }
    }

    private toggleButton(show: boolean, btn: MatButton): void {
        if (show) {
            // show the progress bar 
            this._fuseProgressBarService.show();
            // disable the button
            btn.disabled = true;
        }
        else {
            // enable button after response
            btn.disabled = true;
            // hide the progress bar
            this._fuseProgressBarService.hide();
        }
    }

    private closeInteraction(btn: MatButton): void {
        this.toggleButton(true, btn);
        SDKClient.closeInteraction(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                this.toggleButton(false, btn);
                if (dt.response && dt.response.ResultCode === 0) {
                    this._appUIService.showSnackbar('Interaction closed successfully');
                }
                else {
                    this._appUIService.showSnackbar('Close interaction failed', 'failure');
                }
            });
    }

    private disconnectCall(btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        SDKClient.disconnectCall(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                }
                else {
                    this._appUIService.showSnackbar('Disconnect call failed', 'failure');
                }
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    public selectInteraction(item: InteractionRef): void {
        // if same interaction is seleted then return
        if (this.interactionId === item.interactionId) {
            return;
        }
        // update is active
        this._interactionManagerService.updateInteraction(item.interactionId, {
            isActive: true
        });
    }

    public answerCall(btn: MatButton): void {
        // check if ms call then do not call api, just process the media server messages
        if (this.isMSCall) {
            // get the connection variable
            const connection: AVChannel = this.avConns[this.sessionID];
            // check if the connection is there and media server messages are there
            if (connection && this.mediaServerMessages.length > 0) {
                // process the media server messages
                this.mediaServerMessages.forEach((item: string) => {
                    connection.onMessage(item);
                });
                // clear the array after processing
                this.mediaServerMessages = [];
            }
            // set the process media message to true for further messages
            this.processMediaMessages = true;
            return;
        }
        // toggle the button
        this.toggleButton(true, btn);
        SDKClient.answerCall(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // answer call success
                }
                else {
                    this._appUIService.showSnackbar('Answer call failed', 'failure');
                }
            });
    }

    public confirmDisconnectCall(btn: MatButton): void {
        // config force login
        const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
            disableClose: false
        });
        confirmDialogRef.componentInstance.message = 'Are you sure to end this call?';
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server 
                this.disconnectCall(btn);
            }
        });
    }

    public holdCall(btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // check if ms call then do not call api, invoke webclient api hold
        if (this.isMSCall) {
            // get the connection variable
            const connection: AVChannel = this.avConns[this.sessionID];
            // check if the connection is there and interaction is not on hold
            if (connection && this.status !== 'hold') {
                connection.hold();
            }
            return;
        }
        SDKClient.holdCall(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                }
                else {
                    this._appUIService.showSnackbar('Hold call failed', 'failure');
                }
            });
    }

    public unHoldCall(btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // check if ms call then do not call api, invoke webclient api hold
        if (this.isMSCall) {
            // get the connection variable
            const connection: AVChannel = this.avConns[this.sessionID];
            // check if the connection is there and interaction is on hold
            if (connection && this.status === 'hold') {
                connection.unHold();
            }
            return;
        }
        SDKClient.unHoldCall(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                }
                else {
                    this._appUIService.showSnackbar('Unhold call failed', 'failure');
                }
            });
    }

    public playerAction(action: number): void {
        if (action === 1) {
            // play
            this.audioPlayer.resume();
            this.audioPlayer._adpState = 'playing';
        }
        else if (action === 2) {
            // pause
            this.audioPlayer.pause();
            this.audioPlayer._adpState = 'paused';
        }
        else {
            // stop
            this.audioPlayer.stop();
            this.audioPlayer = null;
        }
    }

    public confirmCloseInteraction(btn: MatButton): void {
        // config force login
        const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
            disableClose: false
        });
        confirmDialogRef.componentInstance.message = 'Are you sure to close this interaction?';
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server 
                this.closeInteraction(btn);
            }
        });
    }
}
