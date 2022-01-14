import { Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { fuseAnimations } from '@fuse/animations';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    ActionMessageReceivedEvent,
    AgentAVMessageEvent,
    AVApiConfig,
    AVChannel,
    AVControlMessageReceivedEvent,
    AVEvent,
    CallHoldEvent,
    CallHoldReconnectEvent,
    IAgentData,
    IResponse,
    SDKClient,
    TEnums,
    TextChatDisconnectedEvent,
    TextChatMessageReceivedEvent,
    TUtils,
    WrcCallTypes
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_FEATURES, AV_ERRORS } from 'app/constants';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { throwADError } from 'app/utils';
import { map } from 'lodash';
import { timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TwChatControlsComponent } from '../tw-chat-controls/tw-chat-controls.component';

/**
 * Audio Video Controls
 */
@Component({
    selector: 'tw-audio-video-controls',
    templateUrl: './tw-audio-video-controls.component.html',
    styleUrls: ['./tw-audio-video-controls.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAudioVideoControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };
    /**
     * App Config
     */
    appConfig: any;
    /**
     * Maximized State
     */
    maximized: boolean;
    /**
     * Widget Data
     */
    widgetData: {
        /**
         * Customer Name
         */
        customerName: string;
        /**
         * Direction
         * Need more description
         */
        direction: 'in' | 'out';
        /**
         * Type of call
         */
        callType: 'audio' | 'video';
        /**
         * Need more description
         */
        opener: TwChatControlsComponent;
    };
    /**
     * User Info
     */
    user: IAgentData;
    /**
     * AV connection
     */
    avConn: AVChannel;
    /**
     * Interaction Id
     */
    interactionId: number;
    /**
     * Session Id
     */
    sessionID: string;
    /**
     * Need more decription
     */
    userList = [];
    /**
     * Start time
     */
    startTime: Date;
    /**
     * Duration
     */
    duration: number;
    /**
     * Need More description
     */
    mos = '0.00';
    /**
     * Need more description
     */
    status = 'initial';
    /**
     * Connection Flag
     */
    connected: boolean;
    /**
     * Need more description
     */
    showUI: boolean;
    /**
     * Self cam stream visibility flag
     */
    selfVideo: MediaStream;
    /**
     * Self view stram size
     */
    selfViewSmall: boolean;
    /**
     * Audio flag
     */
    audioMuted: boolean;
    /**
     * Video Flag
     */
    videoMuted: boolean;
    /**
     * Hold flag
     */
    hold: boolean;
    /**
     * Local Screensharng flag
     */
    screenSharing: boolean;
    /**
     * Remote Screen sharing flag
     */
    remoteScreenSharing: boolean;
    /**
     * Remote screenshare stream ref
     */
    remoateScreenshareRef: any;
    /**
     * Wrc call type
     */
    wrcCallType: WrcCallTypes;
    /**
     * Remote Video Elements Ref
     */
    @ViewChildren('remoteVideo') remoteVideoElements: QueryList<ElementRef>;
    /**
     * List of user camera list
     */
    userCameraList: CustomMediaDeviceInfo[];
    /**
     * Agent action features
     */
    agentFeatures: {
        /**
         * One way video
         */
        oneWayVideo: boolean;
        /**
         * Audio to video escalation
         */
        audioToVideo: boolean;
    };
    /**
     * To mute agent/customer audio/video on hold
     */
    muteAVOnHold: {
        /**
         * Enabled
         */
        enabled: boolean;
        /**
         * Agent audio
         */
        agentAudio: boolean;
        /**
         * Agent video
         */
        agentVideo: boolean;
        /**
         * Customer audio
         */
        customerAudio: boolean;
        /**
         * Customer video
         */
        customerVideo: boolean;
    };

    /**
     * Constructor
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private _appDataService: AppDataService,
        private _aotWidgetService: AOTWidgetService,
        private _appUIService: AppUiService,
        private _tmacEventService: TMACEventService,
        private _agentFeaturesService: AgentFeaturesService,
        private _fuseProgressBarService: FuseProgressBarService
    ) {
        super();

        // set defaults
        this.agentFeatures = {
            audioToVideo: false,
            oneWayVideo: false
        };

        this.muteAVOnHold = {
            enabled: false,
            agentAudio: false,
            agentVideo: false,
            customerAudio: false,
            customerVideo: false
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        // get the agent data
        this.user = SDKClient.getAgentData();

        // check agent features
        this.checkAgentFeatures();

        this._agentFeaturesService.features.pipe(takeUntil(this.unsubscribeAll)).subscribe((change: boolean) => {
            if (change) {
                // check agent features
                this.checkAgentFeatures();
            }
        });

        // assign the start time
        this.startTime = new Date();

        // add the widget data
        this.interactionId = this.data.Data.InteractionID;
        this.sessionID = this.data.Data.SessionID;
        this.widgetData = {
            customerName: this.data.Data.CustomerName,
            opener: this.data.Data.Opener,
            direction: this.data.Data.Direction,
            callType: this.data.Data.CallType
        };

        // listen to tmac events
        SDKClient.events.on('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.on('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        SDKClient.events.on('AgentAVMessageEvent', this.AgentAVMessageEvent);
        SDKClient.events.on('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        SDKClient.events.on('ActionMessageReceivedEvent', this.ActionMessageReceivedEvent);
        SDKClient.events.on('CallHoldEvent', this.CallHoldEvent);
        SDKClient.events.on('CallHoldReconnectEvent', this.CallHoldReconnectEvent);

        // check for the avEvent
        const avEvent = this.data.Data.AVEvent || null;

        // create the AV channel connection
        this.createAVConnection(avEvent);

        this.wrcCallType = this.widgetData.callType === 'video' ? TEnums.WrcCallTypes.Video : TEnums.WrcCallTypes.Audio;

        // start call
        if (this.data.Data.ConferenceType === 'conf') {
            this.avConn.join(this.wrcCallType, { mode: 'conference' });
            // show UI
            this.showUI = true;
        } else if (this.data.Data.Direction === 'out') {
            this.avConn
                ?.startCall(this.wrcCallType)
                .then((dt: any) => {
                    // check the response is sucess or timed out
                    if (dt.code === TEnums.WrcCodes.RequestTimeout) {
                        // close the call widget
                        this._aotWidgetService.destroyWidget(this.data.ID);
                    }
                    // show UI
                    this.showUI = true;
                })
                .catch((error) => {
                    this._appUIService.showSnackbar('Error in starting the call: ' + error, 'failure');
                });
        }

        this.muteAVOnHold = {
            enabled:
                this.widgetData.opener.agentFeatures.muteAgentAudioOnHold ||
                this.widgetData.opener.agentFeatures.muteAgentVideoOnHold ||
                this.widgetData.opener.agentFeatures.muteCustomerAudioOnHold ||
                this.widgetData.opener.agentFeatures.muteCustomerVideoOnHold,
            agentAudio: this.widgetData.opener.agentFeatures.muteAgentAudioOnHold,
            agentVideo: this.widgetData.opener.agentFeatures.muteAgentVideoOnHold,
            customerAudio: this.widgetData.opener.agentFeatures.muteCustomerAudioOnHold,
            customerVideo: this.widgetData.opener.agentFeatures.muteCustomerVideoOnHold
        };
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // check if the interaction is on hold
        if (this.hold) {
            this.holdUnholdCall();
        }

        // this.endCall();
        this.avConn?.close();
        this.avConn?.events.off('OnAVEvent', this.onAVEvent);
        SDKClient.events.off('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.off('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        SDKClient.events.off('AgentAVMessageEvent', this.AgentAVMessageEvent);
        SDKClient.events.off('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        SDKClient.events.off('ActionMessageReceivedEvent', this.ActionMessageReceivedEvent);
        SDKClient.events.off('CallHoldEvent', this.CallHoldEvent);
        SDKClient.events.off('CallHoldReconnectEvent', this.CallHoldReconnectEvent);

        this.widgetData.opener?.disposeCallWidget();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To check agent features for One Way Video
     */
    private checkAgentFeatures(): void {
        // check the agent features to enable/disable
        SDKClient.getAgentData().featuresList.forEach((f) => {
            // get the featue
            const feature = f.Feature.toLowerCase();

            // switch the feature
            switch (feature) {
                case AGENT_FEATURES.IsAudioToVideoEscalateEnabled:
                    this.agentFeatures.audioToVideo = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsOneWayVideoEnabled:
                    this.agentFeatures.oneWayVideo = f.IsEnabled;
                    break;
                default:
            }
        });
    }

    /**
     * Create Av connection
     * @method createAVConnection
     * @param {AVControlMessageReceivedEvent} avEvent
     */
    private createAVConnection(avEvent: AVControlMessageReceivedEvent): void {
        // create a AV channel connection

        // Set AV Config
        const AV: AVApiConfig = this.appConfig.AppConfigs.AV || {};

        // override the av config media constrain
        if (this.agentFeatures.oneWayVideo) {
            AV.mediaConstraints.type = 'onewayvideo';
        }

        // create a AV channel connection
        const connection = new AVChannel(
            SDKClient,
            this.interactionId.toString(),
            this.user.agentId,
            this.user.agentName,
            this.sessionID.split('|')[0],
            'chat',
            AV
        );

        // check if the connection is created
        if (!connection) {
            this.logger.error('Error in createAVConnection.AVChannel', 'Could not create AV channel instance!');
            return null;
        }

        if (typeof this.data.Data?.SendMessage === 'function') {
            connection.sendMessage = this.data.Data?.SendMessage;
        }

        // this.data.Data.OnMessage = (msg: string) => {
        //     connection.onMessage(msg);
        // };

        // listen to AV events
        connection.events.on('OnAVEvent', this.onAVEvent);

        // assign the av connection
        this.avConn = connection;

        // if the direction is in, then this widget can be opened on av request.
        // so once after creating the widget, process it
        if (avEvent) {
            connection.onMessage(avEvent.Message);
        }
    }

    /**
     * AVEvent Handler
     * @method onAVEvent
     * @param {AVEvent} evt
     */
    private onAVEvent = (evt: AVEvent) => {
        try {
            // swtich the av events
            switch (evt.event) {
                case 'onIncoming':
                    // request param
                    const param = evt.data.param.charAt(0).toUpperCase() + evt.data.param.slice(1);

                    const onConfirmDialogClose = (resp: any) => {
                        if (resp) {
                            // accept request
                            evt.data.response(true);
                            // show the UI
                            this.showUI = true;
                        } else {
                            // reject request
                            evt.data.response(false);
                            // close the call widget
                            this._aotWidgetService.destroyWidget(this.data.ID);
                        }
                    };

                    // config incoming call
                    const confirmDialogRef = this._appUIService.showCustomDialog(
                        'confirm',
                        `${param} call requested by ${this.widgetData.customerName}, Do you want to accept it?`
                    );

                    confirmDialogRef.afterClosed().subscribe((resp) => onConfirmDialogClose(resp));

                    break;
                case 'onTrace':
                    this.logger.info('onAVEvent.onTrace: ' + evt.data);
                    break;
                case 'onError':
                    let error = evt.data?.error || 'Error occured in AV connection';
                    if (evt.data?.code in AV_ERRORS) {
                        error = AV_ERRORS[evt.data.code];
                    }
                    this.status = `Error : ${error}`;
                    this._appUIService.showSnackbar(error, 'failure');
                    this.logger.error('onAVEvent.onError', evt.data.code + '-' + evt.data.error);
                    // close the widget
                    this.destroyWidget();
                    break;
                case 'onAVStats':
                    this.status = evt.data;
                    break;
                case 'onConnected':
                    this.connected = true;
                    this.status = 'connected';
                    // subscribe to the timer
                    timer(1000, 1000)
                        .pipe(takeUntil(this.unsubscribeAll), takeUntil(this.unsubscribeAll))
                        .subscribe((val) => {
                            this.duration = (val + 1) * 1000;
                        });
                    break;
                case 'onSourceVideoAdded':
                    // assign the local stream
                    this.selfVideo = evt.data[0];
                    break;
                case 'onRemoteVideoAdded':
                    // check if the user connected is customer
                    if (evt.data.streamInfo?.user === 'customer' && evt.data.streamInfo?.type !== 'screenshare') {
                        evt.data.streamInfo.user = this.widgetData.customerName;
                    } else {
                        // other agent connected
                    }
                    // add the level
                    evt.data.level = 0;
                    // push to the list
                    this.userList.push(evt.data);
                    break;
                case 'onScreenshareStarted':
                    this.screenSharing = true;
                    this.status = 'ss-started';
                    break;
                case 'onScreenshareConnected':
                    this.remoteScreenSharing = true;
                    this.status = 'ss-connected';
                    // check if the user connected is customer
                    if (evt.data.streamInfo?.user === 'customer') {
                        evt.data.streamInfo.user = this.widgetData.customerName + '-Presenting';
                        this.remoateScreenshareRef = evt.data;
                    } else {
                        // other agent connected
                    }
                    // push to the list
                    this.userList.push(evt.data);
                    break;
                case 'onScreenshareEnded':
                    this.status = 'screenshare-ended';
                    this.screenSharing = false;
                    break;
                case 'onScreenshareDisconnected':
                    this.status = 'ss-disconnected';
                    this.remoteScreenSharing = false;
                    this.remoateScreenshareRef = null;
                    // remove the screenshare user
                    this.userList = this.userList.filter((u) => u.streamInfo.type !== 'screenshare');
                    break;
                case 'onFail':
                    // show the error
                    this.connected = false;
                    this.status = 'failed';
                    if (evt.data.code === TEnums.WrcCodes.Rejected) {
                        this._appUIService.showSnackbar('User has rejected your request', 'failure');
                    } else {
                        this._appUIService.showSnackbar('Call failed: ' + evt.data.error, 'failure');
                    }
                    // close the widget
                    this.destroyWidget();
                    break;
                case 'onDisconnected':
                    this.connected = false;
                    this.status = 'disconnected';
                    this._appUIService.showSnackbar('Call disconnected, unexpected end!', 'failure');
                    // close the widget
                    this.destroyWidget();
                    break;
                case 'onVoiceActivity':
                    map(this.userList, (user: any) => {
                        // set the level to 0
                        user.level = 0;
                        // check for matching stream id and change the level
                        if (user.stream.id === evt.data.streamId) {
                            user.level = evt.data.level;
                        }
                    });
                    break;
                case 'onCollectorStats':
                    // update the mos value
                    this.mos = evt.data.stats.audio.local.mos.toFixed(2);
                    break;
                case 'onEnd':
                    this.connected = false;
                    this.status = 'ended';
                    this._appUIService.showSnackbar('User has ended the call', 'info');
                    // close the widget
                    this.destroyWidget();
                    break;
                case 'onUserLeft':
                    this.userList = this.userList.filter((u) => u.streamInfo.id !== evt.data?.userId);
                    break;
                case 'onReconnecting':
                    break;
                case 'onReconnected':
                    break;
                case 'onStreamStatusChanged':
                    // 1 : connected
                    // 2  :disconnected
                    if (evt.data.status === 2) {
                    } else if (evt.data.status === 1) {
                    }
                    break;
                default:
                // console.log(`unhandled:: [${evt.event}]`, evt);
            }
        } catch (error) {
            this.logger.error('Error in onAVEvent', error);
        }
    };

    /**
     * AVControlMessageReceivedEvent Handler
     * @method AVControlMessageReceivedEvent
     * @param {AVControlMessageReceivedEvent} evt
     */
    private AVControlMessageReceivedEvent = (evt: AVControlMessageReceivedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // forward the av messages to av channel
        this.avConn?.onMessage(evt.Message);
    };

    /**
     * AgentAVMessageEvent Handler
     * @method AgentAVMessageEvent
     * @param {AgentAVMessageEvent} evt
     */
    private AgentAVMessageEvent = (evt: AgentAVMessageEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // forward the av messages to av channel
        this.avConn?.onMessage(evt.Message);
    };

    /**
     * TextChatDisconnectedEvent Handler
     * @method TextChatDisconnectedEvent
     * @param {TextChatDisconnectedEvent} evt
     */
    private TextChatDisconnectedEvent = (evt: TextChatDisconnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // close the widget
        this.destroyWidget();
    };

    /**
     * TextChatMessageReceivedEvent Handler
     * @param evt
     */
    private TextChatMessageReceivedEvent = (evt: TextChatMessageReceivedEvent) => {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // we need to catch only app message here to get the list of camera sent from VIVR
            if (evt.IsAppMessage) {
                const msg = JSON.parse(evt.Message);
                if (msg.type?.toLowerCase() === 'camerainfo') {
                    this.userCameraList = msg.deviceList;
                }
            }
        } catch (error) {
            throwADError('Error in TwAudioVideoControlsComponent.TextChatMessageReceivedEvent', error);
        }
    };

    /**
     * To handles ActionMessageReceivedEvent
     * @param evt ActionMessageReceivedEvent evt
     */
    ActionMessageReceivedEvent = (evt: ActionMessageReceivedEvent) => {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            // mark the device as selected if VIVR send "camerachange"  with action
            // or if we get ack from VIVR for the request "togglecamera"
            const msg = JSON.parse(evt.Message);

            switch (msg.type.toLowerCase()) {
                case 'camerachange':
                    if (msg.status === 'action') {
                        this.setCameraSelected(msg.data.deviceId);
                    }
                    break;
                case 'togglecamera':
                    switch (msg.status) {
                        case 'ack':
                            break;
                        case 'accepted':
                            this._appUIService.showSnackbar('Toggle camera request is accepted by customer');
                            break;
                        case 'rejected':
                            this._appUIService.showSnackbar('Toggle camera request is rejected by customer!', 'failure');
                            break;
                        case 'success':
                            this._appUIService.showSnackbar('Customer camera toggled successfully');
                            this.setCameraSelected(msg.data.deviceId);
                            break;
                        case 'failed':
                            this._appUIService.showSnackbar('Customer camera toggle failed!', 'failure');
                            break;
                    }
                    break;
            }
        } catch (error) {
            throwADError('Error in TwAudioVideoControlsComponent.ActionMessageReceivedEvent', error);
        }
    };

    /**
     * To handles CallHoldEvent
     * @param {CallHoldEvent} evt
     */
    CallHoldEvent = (evt: CallHoldEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        if (this.muteAVOnHold.enabled) {
            if (this.muteAVOnHold.agentAudio && this.muteAVOnHold.agentVideo && !this.audioMuted && !this.videoMuted) {
                this.avConn.mute(true, true);
                this.audioMuted = true;
                this.videoMuted = true;
            } else if (this.muteAVOnHold.agentAudio && !this.audioMuted) {
                this.avConn.mute(true, false);
                this.audioMuted = true;
            } else if (this.muteAVOnHold.agentVideo && !this.videoMuted) {
                this.avConn.mute(false, true);
                this.videoMuted = true;
            }

            let type = 'AV' as any;
            const actionMessage = {
                source: 'agent',
                options: {},
                data: {
                    interactionId: this.interactionId
                },
                status: 'request',
                type: 'muteAudioVideo',
                eventName: 'ActionMessage',
                id: TUtils.Generic.uuid()
            };

            if (this.muteAVOnHold.customerAudio && this.muteAVOnHold.customerVideo) {
                type = 'AV';
                actionMessage.type = 'muteAudioVideo';
            } else if (this.muteAVOnHold.customerAudio) {
                type = 'audio';
                actionMessage.type = 'muteAudio';
            } else if (this.muteAVOnHold.customerVideo) {
                type = 'video';
                actionMessage.type = 'muteVideo';
            }

            this.requestMuteUnmuteCustomerAV(type, 'mute', actionMessage);
            return;
        }

        // hold the call
        this.avConn.hold();
        this.hold = true;
    };

    /**
     * To handles CallHoldReconnectEvent
     * @param evt IUIEvent evt
     */
    CallHoldReconnectEvent = (evt: CallHoldReconnectEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        if (this.muteAVOnHold.enabled) {
            if (this.muteAVOnHold.agentAudio && this.muteAVOnHold.agentVideo && this.audioMuted && this.videoMuted) {
                this.avConn.unMute(true, true);
                this.audioMuted = false;
                this.videoMuted = false;
            } else if (this.muteAVOnHold.agentAudio && this.audioMuted) {
                this.avConn.unMute(true, false);
                this.audioMuted = false;
            } else if (this.muteAVOnHold.agentVideo && this.videoMuted) {
                this.avConn.unMute(false, true);
                this.videoMuted = false;
            }

            let type = 'AV' as any;
            const actionMessage = {
                source: 'agent',
                options: {},
                data: {
                    interactionId: this.interactionId
                },
                status: 'request',
                type: 'unmuteAudioVideo',
                eventName: 'ActionMessage',
                id: TUtils.Generic.uuid()
            };

            if (this.muteAVOnHold.customerAudio && this.muteAVOnHold.customerVideo) {
                type = 'AV';
                actionMessage.type = 'unmuteAudioVideo';
            } else if (this.muteAVOnHold.customerAudio) {
                type = 'audio';
                actionMessage.type = 'unmuteAudio';
            } else if (this.muteAVOnHold.customerVideo) {
                type = 'video';
                actionMessage.type = 'unmuteVideo';
            }

            this.requestMuteUnmuteCustomerAV(type, 'unmute', actionMessage);
            return;
        }

        // un hold the call
        this.avConn.unHold();
        this.hold = false;
    };

    /**
     * Widget Cleanup
     * @method destroyWidget
     */
    private destroyWidget(): void {
        // close the audio call widget
        this._aotWidgetService.destroyWidget(this.data.ID);
    }

    /**
     * To set the user camera selected
     * @param {String} deviceId
     */
    private setCameraSelected(deviceId: string): void {
        // mark all selected as false
        this.userCameraList.map((c) => (c.selected = false));
        // select the camera device by deviceId
        this.userCameraList.map((c) => {
            if (c.deviceId === deviceId) {
                c.selected = true;
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Minimize video
     * @method minimizeVideo
     */
    public minimizeVideo(): void {
        this.selfViewSmall = !this.selfViewSmall;
    }

    /**
     * Mute/Unmute Audio Call
     * @method muteUnmuteAudioCall
     */
    public muteUnmuteAudioCall(): void {
        // check the muted flag
        if (this.audioMuted) {
            // un mute the call
            this.avConn.unMute(true, false);
        } else {
            // mute the call
            this.avConn.mute(true, false);
        }
        // set the reference varaible
        this.audioMuted = !this.audioMuted;
    }

    /**
     * Mute/Unmute Video Call
     * @method muteUnmuteVideoCall
     */
    public muteUnmuteVideoCall(): void {
        // check the muted flag
        if (this.videoMuted) {
            // un mute the call
            this.avConn.unMute(false, true);
        } else {
            // mute the call
            this.avConn.mute(false, true);
        }
        // set the reference varaible
        this.videoMuted = !this.videoMuted;
    }

    /**
     * Share Screen
     * @method shareScreen
     */
    public shareScreen(): void {
        // check if to start or stop
        if (this.screenSharing) {
            // stop screen sharing
            this.avConn.stopScreenshare();
        } else {
            // start screen sharing
            this.avConn.startScreenshare();
        }
    }

    /**
     * Take Snap shot
     * @method takeSnapShot
     * @param {any} user
     */
    public async takeSnapShot(user: any): Promise<void> {
        if (this.widgetData.opener.data.Data.Snapshot?.Source?.toLowerCase() === 'local') {
            this.remoteVideoElements?.forEach((element: ElementRef) => {
                if (element.nativeElement.id === user.stream.id) {
                    // create a canvas
                    const canvas = document.createElement('canvas');
                    // scale the canvas accordingly
                    canvas.width = element.nativeElement.videoWidth;
                    canvas.height = element.nativeElement.videoHeight;
                    // get the context
                    const ctx = canvas.getContext('2d');
                    // draw the canvas
                    ctx.drawImage(element.nativeElement, 0, 0, canvas.width, canvas.height);
                    // get base64 url
                    const base64 = canvas.toDataURL();
                    // config force login
                    const confirmDialogRef = this._appUIService.showCustomDialog(
                        'confirm',
                        `<img src="${base64}" width="640" height="320" />`,
                        'Confirm Snapshot'
                    );
                    confirmDialogRef.afterClosed().subscribe((resp) => {
                        if (resp) {
                            this._appUIService.showSnackbar('Saving ...', 'loading');
                            // send snapshot
                            SDKClient.saveVideoSnap(
                                {
                                    base64,
                                    email: '',
                                    interactionId: this.interactionId.toString(),
                                    name: this.widgetData.customerName,
                                    nric: this.data.InteractionDetails.NRIC || '',
                                    phone: this.data.InteractionDetails.RegNo1 || '',
                                    sessionId: this.sessionID
                                },
                                { base64 }
                            )
                                .then((result: IResponse) => {
                                    if (result.response && result.response.ImageUrl) {
                                        // snapsot saved sucessfully
                                        this._appUIService.showSnackbar('Snapshot saved successfully!', 'success');

                                        // create the message to emit
                                        const message = JSON.stringify({
                                            messageId: TUtils.Generic.uuid(),
                                            message: '',
                                            type: 'image',
                                            attachment: {
                                                src: result.userObject.base64,
                                                type: 'image',
                                                name: ''
                                            }
                                        });

                                        const customEvent = {
                                            Message: message,
                                            InteractionID: this.interactionId,
                                            CreatedTime: new Date(),
                                            EventName: 'TextChatMessageTemplateSentEvent',
                                            Result: true
                                        };

                                        // emit a template message sent event to show in UI
                                        this._tmacEventService.emitSDKEvent({
                                            event: customEvent,
                                            isInteractionEvent: true,
                                            log: true
                                        });
                                    } else {
                                        this._appUIService.showSnackbar('Snapshot save failed!', 'failure');
                                    }
                                })
                                .catch(() => {
                                    this._appUIService.showSnackbar('Snapshot save failed', 'failure');
                                });
                        }
                    });
                }
            });
        } else if (this.widgetData.opener.data.Data.Snapshot?.Source?.toLowerCase() === 'remote') {
            try {
                const matRef = this._appUIService.showSnackbar('Requesting customer for snapshot', 'loading');

                try {
                    await SDKClient.sendActionMessage({
                        interactionId: this.interactionId as any,
                        message: JSON.stringify({
                            source: 'agent',
                            options: {},
                            data: {
                                interactionId: this.interactionId
                            },
                            status: 'request',
                            type: 'snapshot',
                            eventName: 'ActionMessage',
                            id: TUtils.Generic.uuid()
                        })
                    });
                } catch (error) {}

                matRef.dismiss();
            } catch (e) {
                console.error(e);
            }
        }
    }

    /**
     * Hold/Unhold call
     * @method holdCall
     */
    public holdUnholdCall(): void {
        // check the hold flag
        if (this.hold) {
            // un hold the call
            this.avConn.unHold();
            if (typeof this.widgetData.opener.unHoldInteraction === 'function') {
                this.widgetData.opener.unHoldInteraction();
            }
        } else {
            // hold the call
            this.avConn.hold();
            if (typeof this.widgetData.opener.holdInteraction === 'function') {
                this.widgetData.opener.holdInteraction();
            }
        }
        // set the reference varaible
        this.hold = !this.hold;
    }

    /**
     * End Call
     * @method endCall
     */
    public endCall(): void {
        // end the call
        // if there is only customer then endCall else dropCall
        if (this.userList.filter((u) => u.streamInfo.type !== 'screenshare').length > 1) {
            this.avConn.dropCall('');
        } else {
            this.avConn.endCall(this.wrcCallType, '');
        }

        if (this.widgetData.opener.widgetData.EndInteractionOnAVEnd) {
            this.widgetData.opener.confirmEndChat(null);
        }

        // close the widget
        this.destroyWidget();
    }

    /**
     * Opens webrtc stats inside an iframe
     */
    async showWebRTCStats(): Promise<void> {
        try {
            if (this.data.Data.Config.WebRTCTest.Allowed) {
                const { Url, Customer } = this.data.Data.Config.WebRTCTest;
                // create a call AOT widget
                const widget = new TwWidgetModel('WebRTC Stats', 'tw-custom', 'event_note');
                widget.Config.Anchor = false;
                widget.Config.Position.W = 640;
                widget.Config.Position.H = 480;
                widget.Config.Actions = ['collapse', 'maximize', 'destroy'];

                widget.Data = {
                    AutoOpen: false,
                    OpenInNew: false,
                    Url
                };

                this._aotWidgetService.addWidget(widget);

                if (Customer) {
                    await SDKClient.sendActionMessage({
                        interactionId: this.interactionId as any,
                        message: JSON.stringify({
                            source: 'agent',
                            options: {},
                            data: { webRTCUrl: Url },
                            status: 'request',
                            type: 'webrtcTroubleshoot',
                            eventName: 'ActionMessage',
                            id: TUtils.Generic.uuid()
                        })
                    });
                }
            } else {
                throw new Error('WebRTC Url missing in app config');
            }
        } catch (err) {
            this._appUIService.showSnackbar(err, 'failure');
        }
    }

    /**
     * To change from one way video to 2 way video
     */
    public async changeToVideo(btn: MatButton): Promise<void> {
        btn.disabled = true;
        if (!(await this.avConn.upgradeToVideo())) {
            this._appUIService.showSnackbar('Upgrade to Video failed!', 'failure');
        } else {
            this.agentFeatures.oneWayVideo = false;
        }
        btn.disabled = false;
    }

    /**
     * To toggle user camera
     * @param {CustomMediaDeviceInfo} item
     */
    public async toggleUserCamera(item: CustomMediaDeviceInfo): Promise<void> {
        try {
            this._fuseProgressBarService.show();

            const { response } = await SDKClient.sendActionMessage({
                interactionId: this.interactionId.toString(),
                message: JSON.stringify({
                    source: 'agent',
                    options: {},
                    data: {
                        deviceId: item.deviceId
                    },
                    status: 'request',
                    type: 'togglecamera',
                    eventName: 'ActionMessage',
                    id: TUtils.Generic.uuid()
                })
            });

            if (response.ResultCode === 1) {
                this._appUIService.showSnackbar('Toggle camera request sent successfully');
            } else {
                this._appUIService.showSnackbar('Toggle camera request failed!', 'failure');
            }
        } catch (error) {
            this._appUIService.showSnackbar('Toggle camera request error!', 'failure');
            throwADError('Error in TwAudioVideoControlsComponent.toggleUserCamera', error);
        } finally {
            this._fuseProgressBarService.hide();
        }
    }

    /**
     * To send action message to mute/unmute customer AV
     * @param message
     */
    public async requestMuteUnmuteCustomerAV(source: 'AV' | 'audio' | 'video', type: 'mute' | 'unmute', message: any): Promise<void> {
        try {
            this._fuseProgressBarService.show();

            const { response } = await SDKClient.sendActionMessage({
                interactionId: this.interactionId.toString(),
                message: JSON.stringify(message)
            });

            if (response.ResultCode !== 1) {
                this._appUIService.showSnackbar(`Customer ${source} ${type} request failed!`, 'failure');
            }
        } catch (error) {
            this._appUIService.showSnackbar(`Customer ${source} ${type} request error!`, 'failure');
            throwADError('Error in TwAudioVideoControlsComponent.requestMuteUnmuteCustomerAV', error);
        } finally {
            this._fuseProgressBarService.hide();
        }
    }
}

interface CustomMediaDeviceInfo {
    /**
     * Id of the device
     */
    deviceId: string;
    /**
     * Group Id of the device
     */
    groupId: string;
    /**
     * Name of the device
     */
    label: string;
    /**
     * To know which media device is selected
     */
    selected: boolean;
}

// for more info visit - https://angular.io/api/core
