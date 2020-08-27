import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { InteractionEventService } from '@services/interaction-event.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { InteractionRef, IWidget } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';
import {
    AVChannel,
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
    Enums
} from 'tmac-sdk';
import { timer, Subject } from 'rxjs';

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
    startTime = 'NA';
    sessionID = 'NA';
    direction = 'NA';
    interactionDuration = '00:00:00';
    stopTimer = new Subject();
    last4IVR = [];
    interactionStatus = 'NA';
    isMSCall = false;
    isManualAnswer = false;
    avConns: AVChannel[] = [];
    msAudioStreams = [];
    processMediaMessages = false;
    mediaServerMessages = [];

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appDataService: AppDataService,
        private _interactionManagerService: InteractionManagerService,
        private _interactionEventService: InteractionEventService
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
            this.sessionID = interactionDetails.UCID || 'NA';
            // set the manual anser flag
            this.isManualAnswer = interactionDetails.IsManualAnswer;
            // set the process media messages flag
            this.processMediaMessages = !this.isManualAnswer;
            // set the direct
            this.direction = interactionDetails.EventName === 'IncomingCallEvent' ? 'In' : 'Out';
        }
        else {
            console.warn('Interaction details are not available for voice');
            return;
        }

        // set the status
        this.interactionStatus = 'initial';

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
                const totalSeconds = val + 1;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor(totalSeconds % 3600 / 60);
                const seconds = Math.floor(totalSeconds % 3600 % 60);
                // set the interaction duration
                this.interactionDuration =
                    (hours > 9 ? hours : '0' + hours) + ':' +
                    (minutes > 9 ? minutes : '0' + minutes) + ':'
                    + (seconds > 9 ? seconds : '0' + seconds);
            });

        // set the status
        this.interactionStatus = 'connected';
        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            'status': 'connected',
            'user': this.callerID,
            'otherData': {
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
        this._appDataService.clearAudio();

        // set the status
        this.interactionStatus = 'disconnected';
        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            'status': 'disconnected'
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
        this.interactionStatus = 'hold';
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            'status': 'hold'
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
        this.interactionStatus = 'connected';
        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            'status': 'connected'
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

            console.log('%c##### MediaServerEvent', 'background: blue; color: white;', evt.Type);

            // set the session Id if empty
            if (!this.sessionID) {
                this.sessionID = evt.SessionID;
            }

            // init the connection variable
            let connection: AVChannel = null;

            // switch the type and process
            switch (evt.Type) {
                case 'call-received':
                    // create WebRTC peer connection
                    connection = this.createAVConnection('out');
                    connection?.directCall(Enums.WrcCallTypes.Audio, 'in');
                    // play incoming call sound 
                    this._appDataService.playAudio('incoming-call', 0.5, true);
                    break;
                case 'call-connecting':
                    // create WebRTC peer connection
                    connection = this.createAVConnection('in');
                    connection?.directCall(Enums.WrcCallTypes.Audio);
                    // play incoming call sound 
                    this._appDataService.playAudio('ringing', 0.5, true);
                    break;
                case 'call-connected':
                    // clear tone of once call connected
                    this._appDataService.clearAudio();
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
            console.error(error);
        }
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
                this.sessionID,
                'voice',
                this.appConfig.AppConfigs.AV || {}
            );

            // register to all AV events
            connection?.events.on('onAVEvent', this.onAVEvent);

            // push the connection to the list
            this.avConns[this.sessionID] = connection;

            // update the interaction status and user
            this._interactionManagerService.updateInteraction(this.interactionId, {
                'otherData': {
                    avConn: this.avConns[this.sessionID]
                }
            });

            console.log('##### createAVConnection', connection);

            // return the connection
            return connection;

        } catch (error) {
            console.error(error);
        }
        return null;
    }

    private onAVEvent = (evt: any) => {
        // swtich the av events
        switch (evt.event) {
            case 'onTrace':
                console.log(evt.data);
                break;
            case 'onError':
                console.error(evt.data);
                break;
            case 'onConnected':
                console.log('onAVEvent - onConnected');
                break;
            case 'onDisconnected':
                console.log('onAVEvent - onDisconnected');
                // clear tone of disconnect on dial or incoming
                this._appDataService.clearAudio();
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
        console.log('%c##### MediaServerEvent', 'background: red; color: white;', evt);
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
                this._appDataService.playAudio('hung-up', 0.5, false);
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
            'isActive': true
        });
    }

    public closeInteraction(btn: MatButton): void {
        this.toggleButton(true, btn);
        SDKClient.closeInteraction(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                this.toggleButton(false, btn);
                if (dt.response && dt.response.ResultCode === 0) {
                    this._appDataService.showMessage('Interaction closed sucessfully');
                }
                else {
                    this._appDataService.showMessage('Close interaction failed');
                }
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
                    this._appDataService.showMessage('Answer call failed');
                }
            });
    }

    public disconnectCall(btn: MatButton): void {
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
                    this._appDataService.showMessage('Disconnect call failed');
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
            if (connection && this.interactionStatus !== 'hold') {
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
                    this._appDataService.showMessage('Hold call failed');
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
            if (connection && this.interactionStatus === 'hold') {
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
                    this._appDataService.showMessage('Unhold call failed');
                }
            });
    }
}
