import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AgentSkillListComponent } from '@modules/shared/components';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AgentSkillListData, InteractionRef, IWidget } from 'app/interfaces';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
    AgentInteractionTemplate,
    AVChannel,
    AVEvent,
    CallConferenceCompletedEvent,
    CallConferenceInitiatedEvent,
    CallConferenceLineDisconnectEvent,
    CallConferenceRemoteConnectedEvent,
    CallConnectedEvent,
    CallDisconnectedEvent,
    CallerIntentEvent, CallHoldEvent,
    CallHoldReconnectEvent,
    CallTransferInitiatedEvent,
    CallTransferLineDisconnectEvent,
    CallTransferRemoteConnectedEvent,
    IAgentData,
    IResponse,
    IUIEvent,
    IVRDataEvent,
    MediaServerEvent,
    SDKClient,
    TEnums, TUtils
} from 'tmac-sdk';

/**
 * Voice Controls Component
 */
@Component({
    selector: 'tw-voice-controls',
    templateUrl: './tw-voice-controls.component.html',
    styleUrls: ['./tw-voice-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoiceControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Daat from App config
     */
    @Input() data: IWidget;
    /**
     * Maximise event emitter
     */
    @Output() maximizeEvent = new EventEmitter();
    /**
     * Float event emitter
     */
    @Output() floatEvent = new EventEmitter();
    /**
     * Collapse event emitter
     */
    @Output() collapseEvent = new EventEmitter();
    /**
     * Fuse Config
     */
    fuseConfig: FuseConfig;
    /**
     * App config
     */
    appConfig: any;
    /**
     * Interaction Id
     */
    interactionId: number;
    /**
     * Interaction List
     */
    interactionList: InteractionRef[] = [];
    /**
     * Agent info
     */
    user: IAgentData;
    /**
     * Need more description
     */
    callerID = 'NA';
    /**
     * Interaction Start time
     */
    startTime = '00:00:00';
    /**
     * Interaction session ID
     */
    sessionID = 'NA';
    /**
     * Interaction intent
     */
    intent = 'NA';
    /**
     * Interaction direction
     */
    direction = 'NA';
    /**
     * Interaction duration
     */
    duration: any;
    /**
     * Subject to stop duration timer
     */
    stopTimer = new Subject();
    /**
     * Last 4 IVR menu ref
     */
    last4IVR = [];
    /**
     * Interaction status
     */
    status = 'NA';
    /**
     * MS call flag
     */
    isMSCall = false;
    /**
     * Manual or auto answer for the interaction flag
     */
    isManualAnswer = false;
    /**
     * AV channel connection ref for webphone
     */
    avConns: AVChannel[] = [];
    /**
     * Media server audio streams for MS calls
     */
    msAudioStreams = [];
    /**
     * To process media messages flag
     */
    processMediaMessages = false;
    /**
     * Media server messages ref
     */
    mediaServerMessages = [];
    /**
     * Audio player for webphone ref
     */
    audioPlayer: any;
    /**
     * MS call muted flag
     */
    muted: boolean;
    /**
     * Transfer/Conference widgetf
     */
    tranfConfWidget: IWidget;
    /**
     * To confirm transfer/conference call
     */
    confirmCall: boolean;
    /**
     * Confirm call type
     */
    confirmCallType: '' | 'transfer' | 'conference';
    /**
     * Call lines ref
     */
    callLines = [];

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appDataService: AppDataService,
        private _interactionManagerService: InteractionManagerService,
        private _tmacEventService: TMACEventService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _matDialog: MatDialog
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * Lifecycle hook
     * @method OnInit
     */
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


    /**
     * Lifecycle hook
     * @method OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this.deRegisterFromEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register to SDK events
     * @method registerToEvents
     */
    private registerToEvents(): void {
        // get the event from event bag to make sure no events are missed
        const eventBag = this._tmacEventService.get(this.interactionId);

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


    /**
     * Clear event listeners
     * @method deRegisterFromEvents
     */
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

    /**
     * CallConnectedEvent handler
     * @param {CallConnectedEvent} evt 
     */
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

    /**
     * CallDisconnectedEvent handler
     * @param {CallDisconnectedEvent} evt 
     */
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

        // clear confirm
        this.confirmCall = false;
        this.confirmCallType = '';

        // destroy the transfer/conf widget
        if (this.tranfConfWidget) {
            this._aotWidgetService.destroyWidget(this.tranfConfWidget.ID);
            this.tranfConfWidget = null;
        }
    }

    /**
     * CallHoldEvent Handler
     * @param {CallHoldEvent} evt 
     */
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

    /**
     * CallHoldReconnectEvent handler
     * @param {CallHoldReconnectEvent} evt 
     */
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

    /**
     * CallTransferInitiatedEvent handler
     * @param {CallTransferInitiatedEvent} evt 
     */
    private CallTransferInitiatedEvent = (evt: CallTransferInitiatedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    /**
     * CallTransferRemoteConnectedEvent Handler
     * @param {CallTransferRemoteConnectedEvent} evt 
     */
    private CallTransferRemoteConnectedEvent = (evt: CallTransferRemoteConnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // show confirm/cancel buttons
        this.confirmCall = true;
        this.confirmCallType = 'transfer';
    }

    /**
     * CallTransferLineDisconnectEvent handler
     * @param {CallTransferLineDisconnectEvent} evt 
     */
    private CallTransferLineDisconnectEvent = (evt: CallTransferLineDisconnectEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // show confirm/cancel buttons
        this.confirmCall = false;
        this.confirmCallType = 'conference';
    }

    /**
     * CallConferenceInitiatedEvent Handler
     * @param {CallConferenceInitiatedEvent} evt 
     */
    private CallConferenceInitiatedEvent = (evt: CallConferenceInitiatedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    /**
     * CallConferenceRemoteConnectedEvent Handler
     * @param {CallConferenceRemoteConnectedEvent} evt 
     */
    private CallConferenceRemoteConnectedEvent = (evt: CallConferenceRemoteConnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    /**
     * CallConferenceLineDisconnectEvent Handler
     * @param {CallConferenceLineDisconnectEvent} evt 
     */
    private CallConferenceLineDisconnectEvent = (evt: CallConferenceLineDisconnectEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    /**
     * CallConferenceCompletedEvent Handler
     * @param {CallConferenceCompletedEvent} evt 
     */
    private CallConferenceCompletedEvent = (evt: CallConferenceCompletedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
    }

    /**
     * MediaServerEvent Handler
     * @param {MediaServerEvent} evt 
     */
    private MediaServerEvent = (evt: MediaServerEvent) => {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // init the connection variable
            let connection: AVChannel = null;

            // switch the type and process
            switch (evt.Type) {
                case 'call-received':
                    // create WebRTC peer connection
                    connection = this.createAVConnection(evt.SessionID, 'in');
                    connection?.directCall(TEnums.WrcCallTypes.Audio, 'in');
                    // play incoming call sound 
                    this._appUIService.playAudio('incoming-call', 0.5, true);
                    break;
                case 'call-connecting':
                    // create WebRTC peer connection
                    connection = this.createAVConnection(evt.SessionID, 'out');
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

    /**
     * VoiceCannedResponseEvent Handler
     * @param {VoiceCannedResponseEvent} evt 
     */
    private VoiceCannedResponseEvent = (evt:
        {
            /**
             * Audio buffer from template
             */
            AudioBuffer: ArrayBuffer,
            /**
             * Interaction ID
             */
            InteractionID: number,
            /**
             * Agent interaction template ref
             */
            Item: AgentInteractionTemplate
        }) => {
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

    /**
     * CallerIntentEvent Handler
     * @param {CallerIntentEvent} evt 
     */
    private CallerIntentEvent = (evt: CallerIntentEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // assign the intent name
        this.intent = evt.IntentName;
    }

    /**
     * IVRDataEvent Handler
     * @param {IVRDataEvent} evt 
     */
    private IVRDataEvent = (evt: IVRDataEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        this.last4IVR = [evt.LastMenu_4, evt.LastMenu_3, evt.LastMenu_2, evt.LastMenu];
    }

    /**
     * Create AV connection
     * @method createAVConnection
     * 
     * @param {string} sessionId
     * @param {string} direction 
     */
    private createAVConnection(sessionId: string, direction: string): AVChannel {
        try {
            // set MS call to true
            this.isMSCall = true;

            // check if the direction is out and check if this is a consult transfer call
            if (direction === 'out' && this.callLines.length > 0) {
                // its a conf/trasnfer call

            }

            // create a AV channel connection
            const connection = new AVChannel(
                SDKClient,
                this.interactionId.toString(),
                this.user.agentId,
                '',
                sessionId,
                'voice',
                this.appConfig.AppConfigs.AV || {}
            );

            // register to all AV events
            connection?.events.on('onAVEvent', this.onAVEvent);

            // push the connection to the list
            this.avConns[sessionId] = connection;

            // add to call lines
            this.callLines.push(sessionId);

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

    /**
     * AVEvent Handler
     * @param {AVEvent} evt 
     */
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
                break;
            case 'onDisconnected':
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
            // console.log(`unhandled:: [${evt.event}]`, evt);
        }
    }

    /**
     * Process AV event
     * @method processEventAV
     * @param {any} evt 
     */
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

    /**
     * Toggle Button
     * Need More description
     * @method toggleButton
     * @param {Boolean} show 
     * @param {MatButton} btn 
     */
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

    /**
     * Close interaction
     * @method closeInteraction
     * @param {MatButton} btn 
     */
    private closeInteraction(btn: MatButton): void {
        this.toggleButton(true, btn);
        SDKClient.closeInteraction(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                this.toggleButton(false, btn);
                if (dt.response && dt.response.ResultCode === 0) {
                    this._appUIService.showSnackbar('Interaction closed successfully');
                    // remove the interaction reference
                    this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                }
                else {
                    this._appUIService.showSnackbar('Close interaction failed', 'failure');
                    this.toggleButton(false, btn);
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Close interaction failed', 'failure');
                this.toggleButton(false, btn);
            });
    }

    /**
     * Disconnect Call
     * @method disconnectCall
     * @param {MatButton} btn 
     */
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
                    this.toggleButton(false, btn);
                    this._appUIService.showSnackbar('Disconnect call failed', 'failure');
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Disconnect call failed', 'failure');
                this.toggleButton(false, btn);
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Select Interaction
     * @method selectInteraction
     * @param {InteractionRef} item 
     */
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

    /**
     * Answer call
     * @method answerCall
     * @param {MatButton} btn 
     */
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

    /**
     * Confirm Call Disconnection
     * @method confirmDisconnectCall
     * @param {MatButton} btn 
     */
    public confirmDisconnectCall(btn: MatButton): void {
        // config force login
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('endInteraction');
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server 
                this.disconnectCall(btn);
            }
        });
    }

    /**
     * Hold Call
     * @method holdCall
     * @param {MatButton} btn 
     */
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

    /**
     * To mute/un mute MS call
     * @method muteUnMuteCall
     */
    public muteUnMuteCall(): void {
        // check if ms call then only process
        if (!this.isMSCall) {
            return;
        }
        // get the connection variable
        const connection: AVChannel = this.avConns[this.sessionID];
        // check the muted flag
        if (this.muted) {
            // un mute the call
            connection.unMute(true, false);
        }
        else {
            // mute the call
            connection.mute(true, false);
        }
        // set the reference varaible
        this.muted = !this.muted;
    }

    /**
     * Unhold Call
     * @param {MatButton} btn 
     */
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

    /**
     * Player Action
     * Need More Description
     * @method playerAction
     * @param {Number} action 
     */
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

    /**
     * Confirm Close Interaction
     * @method confirmCloseInteraction
     * @param {MatButton} btn 
     */
    public confirmCloseInteraction(btn: MatButton): void {
        // config force login
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server 
                this.closeInteraction(btn);
            }
        });
    }

    /**
     * To save interaction comments to server
     */
    public saveInteractionComments(): void {
        const dialogRef = this._appUIService.showCustomDialog('prompt', 'Enter the comments', 'Interaction Comment');
        dialogRef.afterClosed().subscribe((resp1) => {
            if (resp1) {
                this._fuseProgressBarService.show();
                SDKClient.saveInteractionComment({
                    comment: resp1,
                    interactionId: this.interactionId.toString()
                })
                    .then((resp2) => {
                        if (resp2.response > 0) {
                            this._appUIService.showSnackbar('Interaction comment saved successfully');
                        }
                        else {
                            this._appUIService.showSnackbar('Interaction comment save failed', 'failure');
                        }

                        this._fuseProgressBarService.hide();
                    })
                    .catch(() => {
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar('Error in saving interaction comment', 'failure');
                    });
            }
        });
    }

    /**
     * To open transfer/conference dialog
     * 
     * @param type 
     */
    public openTransferConferenceDialog(type: string): void {
        // get data based on type
        const data: AgentSkillListData = type === 'transfer' ? {
            title: 'Transfer Call',
            type: 'transferCall',
            interactionId: this.interactionId,
            agent: {
                allowed: this.data.Data.Transfer.Agent.Allowed,
                blind: this.data.Data.Transfer.Agent.Allowed,
                allowedStates: this.data.Data.Transfer.Agent.AllowedStates
            },
            skill: {
                allowed: this.data.Data.Transfer.Skil.Allowed,
                blind: this.data.Data.Transfer.Skil.Allowed
            }
        } : {
                title: 'Conference Call',
                type: 'conferenceCall',
                agent: {
                    allowed: this.data.Data.Conference.Agent.Allowed,
                    blind: this.data.Data.Conference.Agent.Allowed,
                    allowedStates: this.data.Data.Conference.Agent.AllowedStates
                },
                skill: {
                    allowed: this.data.Data.Conference.Skil.Allowed,
                    blind: this.data.Data.Conference.Skil.Allowed
                }
            };
        // open agent skill list component in dialog
        this._matDialog.open(AgentSkillListComponent, {
            data,
            panelClass: 'agent-skill-dialog',
            minWidth: '30%',
            maxWidth: '100%',
            height: '60%',
            disableClose: true
        });
    }

    /**
     * To confirm or cancel transfer/conference call
     * 
     * @param {boolean} confirm
     * @param {MatButton} btn
     */
    confirmCallFn(confirm: boolean, btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // confirm voice transfer
        if (this.confirmCallType === 'transfer') {
            if (confirm) {
                // complete transfer in server
                SDKClient.transferComplete(this.interactionId.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction transfer completed successfully');
                        }
                        else {
                            this._appUIService.showSnackbar('Interaction transfer completion failed');
                        }
                    })
                    .catch(() => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        this._appUIService.showSnackbar('Error in interaction transfer complete', 'failure');
                    });
            }
            else {
                SDKClient.transferCancel(this.interactionId.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction transfer cancel successful');
                        }
                        else {
                            this._appUIService.showSnackbar('Interaction transfer cancel failed');
                        }
                    })
                    .catch(() => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        this._appUIService.showSnackbar('Error in interaction transfer cancel', 'failure');
                    });
            }
        }
        // confirm voice conference
        else {
            if (confirm) {
                // handle conference mixer for MS calls
                if (this.isMSCall) {

                }
                // complete conference in server
                SDKClient.conferenceComplete(this.interactionId.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction conference completed successfully');
                        }
                        else {
                            this._appUIService.showSnackbar('Interaction conference completion failed');
                        }
                    })
                    .catch(() => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        this._appUIService.showSnackbar('Error in interaction conference complete', 'failure');
                    });
            }
            else {
                SDKClient.conferenceCancel(this.interactionId.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction conference cancel successful');
                        }
                        else {
                            this._appUIService.showSnackbar('Interaction conference cancel failed');
                        }
                    })
                    .catch(() => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        this._appUIService.showSnackbar('Error in interaction conference cancel', 'failure');
                    });
            }
        }
    }
}
