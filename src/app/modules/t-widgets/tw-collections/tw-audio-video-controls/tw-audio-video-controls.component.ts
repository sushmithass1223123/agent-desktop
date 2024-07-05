import { AOTWidget, TwAudioVideoControls } from '@ad/types';
import { Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { fuseAnimations } from '@fuse/animations';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AgentFeaturesService } from '@services/agent-features.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
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
    IRemoteStreamInfo,
    IResponse,
    SDKClient,
    TEnums,
    TextChatDisconnectedEvent,
    TextChatMessageReceivedEvent,
    TextChatRemoteUserConnectedEvent,
    TUtils,
    WrcCallTypes
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_FEATURES, AV_ERRORS, AV_FAIL_CODES, PERMISSION_ERRORS } from 'app/constants';
import { SnackbarStateTypes, InteractionRef } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { throwADError } from 'app/utils';
import { map } from 'lodash';
import { from, merge, Subject, timer } from 'rxjs';
import { delay, filter, take, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { SharedService } from '@services/shared.service';

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
    // @Input() data: IWidget<IInteractionDetails, IWidgetData>;
    @Input() data: TwAudioVideoControls<IInteractionDetails>;
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
    sessionId: string;
    /**
     * Need more decription
     */
    userList: {
        stream: MediaStream;
        streamInfo: {
            id: string;
            user: string;
            type: string;
        };
    }[] = [];
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
    selfVideo: {
        type: 'audio' | 'video';
        stream: MediaStream;
    };
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
     * Call type
     */
    callType: 'audio' | 'video';
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
        /**
         * Hold
         */
        hold: boolean;
        /**
         * Snapshot
         */
        snapshot: boolean;
        /**
         * Screenshare
         */
        screenshare: boolean;
        /**
         * Request Screenshare
         */
        reqScreenshare: boolean;
        /**
         * WebRTC test
         */
        webrtcTest: boolean;
        /**
         * To toggle user view mode
         */
        toggleUserView: boolean;
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
     * Manual hold click flag
     */
    manualHold: boolean = false;

    /**
     * Flag on call hold
     */
    onCallHoldEvent: boolean;

    /**
     *
     */
    userView: 'call' | 'chat';

    /**
     * Snapshot request reference
     */
    snapshotRequested: boolean;

    /**
     * Snapshot request timeout reference
     */
    snapshotRequestTimeoutRef$: Subject<boolean>;

    /**
     * Snapshot response timeout reference
     */
    snapshotResponseTimeoutRef$: Subject<boolean>;

    /**
     * Interaction details
     */
    interactionDetails: IInteractionDetails = {} as IInteractionDetails;

    /**
     * Flag on displaying toasters
     */
    displayToasters: boolean;

    /**
     * Audio muted users
     */
    mutedRemoteUsers = {
        audio: [],
        video: []
    };

    /**
     * Whether audio mute button is allowed or not
     */
    muteAudioHidden: boolean;

    /**
     * The current interaction
     */
    myInteraction: InteractionRef;

    confirmDialogRef;

    isAgentAvRequest: boolean = false;
    isCustomerAcknowledged: boolean = false;
    agentAvRequestConsented: boolean = false;

    private _unsubscribeAll: Subject<any>;

    manualMuteFlags: { audio: boolean; video: boolean } = { audio: false, video: false };

    // Flag to end the call after screenshare disconnect
    endCallAfterScreenShareEnd: boolean = false;

    IsScreenShareDisabled: boolean;

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
        private _fuseProgressBarService: FuseProgressBarService,
        private _interactionManagerService: InteractionManagerService,
        private translocoService: TranslocoService,
        private sharedService: SharedService
    ) {
        super('TwAudioVideoControlsComponent');

        this.muteAVOnHold = {
            enabled: false,
            agentAudio: false,
            agentVideo: false,
            customerAudio: false,
            customerVideo: false
        };

        this.snapshotRequested = false;
        this.muteAudioHidden = false;
        this.displayToasters = true;

        // Set the private defaults
        this._unsubscribeAll = new Subject();
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

        // subscribe to interaction manager service
        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            //find out the current interaction
            this.myInteraction = interactions.find((i: InteractionRef) => i.interactionId === this.interactionId);
        });

        // set defaults
        this.agentFeatures = {
            audioToVideo: false,
            oneWayVideo: false,
            hold: this.data.Data.HoldInteractionAllowed ?? false,
            screenshare: this.data.Data.ScreenShareAllowed ?? false,
            reqScreenshare: this.data.Data.ReqScreenShareAllowed ?? false,
            snapshot: this.data.Data.Snapshot?.Allowed ?? false,
            toggleUserView: this.data.Data.ToggleUserViewAllowed ?? false,
            webrtcTest: this.data.Data.WebRTCTest?.Allowed ?? false
        };

        // get the agent data
        this.user = SDKClient.getAgentData();

        if (this.data.Data.Source === 'TwChatControlsComponent') {
            // check agent features
            this.checkAgentFeatures();

            this._agentFeaturesService.features.pipe(takeUntil(this.unsubscribeAll)).subscribe((change: boolean) => {
                if (change) {
                    // check agent features
                    this.checkAgentFeatures();
                }
            });
        }

        // assign the start time
        this.startTime = new Date();

        // add the widget data
        this.interactionDetails = this.data.InteractionDetails;
        this.interactionId = this.data.InteractionDetails.InteractionID;
        this.sessionId = this.data.InteractionDetails.SessionID;
        this.callType = this.data.Data.CallType;
        this.IsScreenShareDisabled = this.data.Data.IsScreenShareDisabled;

        // listen to tmac interaction events
        this._tmacEventService
            .getInteractionEventsExtended(
                [
                    { event: 'TextChatRemoteUserConnectedEvent' },
                    { event: 'DisconnectAVEvent' },
                    { event: 'AVControlMessageReceivedEvent' },
                    { event: 'TextChatMessageReceivedEvent' },
                    { event: 'ActionMessageReceivedEvent' },
                    { event: 'TextChatDisconnectedEvent' },
                    { event: 'CallHoldEvent', noRepeat: true },
                    { event: 'CallHoldReconnectEvent', noRepeat: true }
                ],
                this.interactionId
            )
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        // listen to tmac non interaction events
        this._tmacEventService
            .getNonInteractionEventsExtended([{ event: 'AgentAVMessageEvent' }])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        // if this widget is not opened as AOT, then show
        this.showUI = !this.data.Config.AOT;

        if (this.data.Data.Source === 'InstantMessagingComponent' && this.data.Data.Direction === 'out') {
            this.startAVCall();
        }

        // subscribe to interaction manager service
        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            //find out the current interaction
            this.myInteraction = interactions.find((i: InteractionRef) => i.interactionId === this.interactionId);
        });

        // listen to tmac interaction events
        // SDKClient.events.on('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        // SDKClient.events.on('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        // SDKClient.events.on('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        // SDKClient.events.on('ActionMessageReceivedEvent', this.ActionMessageReceivedEvent);
        // SDKClient.events.on('CallHoldEvent', this.CallHoldEvent);
        // SDKClient.events.on('CallHoldReconnectEvent', this.CallHoldReconnectEvent);

        // listen to tmac non interaction events
        // SDKClient.events.on('AgentAVMessageEvent', this.AgentAVMessageEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // check if the interaction is on hold
        if (this.hold) {
            this.holdUnholdCall();
        }

        // this.endCall();
        this.avConn?.close();
        this.avConn?.events.off('OnAVEvent', this.onAVEvent);

        // Close the active dialogs
        this.confirmDialogRef?.close();

        // listen to tmac interaction events
        // SDKClient.events.off('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        // SDKClient.events.off('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        // SDKClient.events.off('TextChatMessageReceivedEvent', this.TextChatMessageReceivedEvent);
        // SDKClient.events.off('ActionMessageReceivedEvent', this.ActionMessageReceivedEvent);
        // SDKClient.events.off('CallHoldEvent', this.CallHoldEvent);
        // SDKClient.events.off('CallHoldReconnectEvent', this.CallHoldReconnectEvent);

        // listen to tmac non interaction events
        // SDKClient.events.off('AgentAVMessageEvent', this.AgentAVMessageEvent);

        // remove the repeatable events from the reference
        this._tmacEventService.removeInteractionEvents(this.interactionId, ['AVControlMessageReceivedEvent', 'ActionMessageReceivedEvent']);
        this._tmacEventService.removeNonInteractionEvents(['AgentAVMessageEvent']);

        this.avConn = null;
        this._tmacEventService.emitSDKEvent({
            event: {
                EventName: this.data.Data.Source === 'TwChatControlsComponent' ? 'DisposeCallWidgetEvent' : 'DisposeIMCallWidgetEvent',
                InteractionID: this.interactionId
            },
            isInteractionEvent: this.data.Data.Source === 'TwChatControlsComponent'
        });

        // add the customer stream to interaction otherdata
        this._interactionManagerService.updateInteraction(this.interactionId, {
            otherData: {
                customerStream: undefined
            }
        });

        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // call the wrapper destroy method
        this.destroyWrapper();
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

            //TODO: Req Screenshare is not added

            // switch the feature
            switch (feature) {
                case AGENT_FEATURES.IsAudioToVideoEscalateEnabled:
                    this.agentFeatures.audioToVideo = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsOneWayVideoEnabled:
                    this.agentFeatures.oneWayVideo = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatHoldEnabled:
                    this.agentFeatures.hold = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsVideoSnapshotEnabled:
                    this.agentFeatures.snapshot = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsChatScreenshareEnabled:
                    this.agentFeatures.screenshare = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsReqScreenshareEnabled:
                    this.agentFeatures.reqScreenshare = f.IsEnabled;
                    break;
                case AGENT_FEATURES.IsToggleChatUserViewEnabled:
                    this.agentFeatures.toggleUserView = f.IsEnabled;
                    break;
                default:
            }
        });
    }

    /**
     * To start AV call
     */
    private startAVCall(): void {
        const widgetData = this.data.Data;

        this.muteAudioHidden = widgetData.MuteAudioHidden;

        // create the AV channel connection
        this.createAVConnection();

        this.wrcCallType = this.callType === 'video' ? TEnums.WrcCallTypes.Video : TEnums.WrcCallTypes.Audio;

        this.userView = 'call';

        // start call
        if (this.interactionDetails.ConferenceType === 'conf') {
            this.avConn.join(this.wrcCallType, { mode: 'conference' });
            this.showUI = true;
        } else if (this.interactionDetails.ConferenceType === 'whisper') {
            this.avConn.join(this.wrcCallType, { mode: 'wisper' as 'whisper' });
            this.showUI = true;
        } else if (this.interactionDetails.ConferenceType === 'silent') {
            this.avConn.join(this.wrcCallType, { mode: 'monitor' });
            this.showUI = true;
        } else if (this.interactionDetails.Direction === 'out') {
            this.avConn
                ?.startCall(this.wrcCallType)
                .then((dt: any) => {
                    // check the response is sucess or timed out
                    if (dt.code === TEnums.WrcCodes.RequestTimeout) {
                        // close the widget
                        this.destroyWidget();
                    }
                    // show UI
                    this.showUI = true;
                })
                .catch((error) => {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.startCallError') + error, 'failure');
                });
        }

        this.muteAVOnHold = {
            enabled:
                widgetData.MuteAVOnHold?.AgentAudio ||
                widgetData.MuteAVOnHold?.AgentVideo ||
                widgetData.MuteAVOnHold?.CustomerAudio ||
                widgetData.MuteAVOnHold?.CustomerVideo,
            agentAudio: widgetData.MuteAVOnHold?.AgentAudio,
            agentVideo: widgetData.MuteAVOnHold?.AgentVideo,
            customerAudio: widgetData.MuteAVOnHold?.CustomerAudio,
            customerVideo: widgetData.MuteAVOnHold?.CustomerVideo
        };
    }

    /**
     * Create Av connection
     * @method createAVConnection
     * @param {AVControlMessageReceivedEvent} avEvent
     */
    private createAVConnection(): void {
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
            this.sessionId.split('|')[0],
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
        // if (avEvent) {
        //     connection.onMessage(avEvent.Message);
        // }
    }

    /**
     * AVEvent Handler
     * @method onAVEvent
     * @param {AVEvent} evt
     */
    onAVEvent = (evt: AVEvent) => {
        try {
            // swtich the av events
            switch (evt.event) {
                case 'onIncoming':
                   //Check whether the type and status of myInteraction matches to 'textchat' and 'hold'
                    if (this.myInteraction?.type === 'textchat' && this.myInteraction?.status === 'hold') {
                        // reject request
                        evt.data.response(false);
                        // close the call widget
                        this.destroyWidget();
                        return;
                    }
                    // If the incoming call is done by agent, return. Because this is handled in requestav
                    // Validate this only if the call is triggered through TwChatControlsComponent
                    if (evt.data?.owner && this.data?.Data?.Source === 'TwChatControlsComponent') return;
                    // request param
                    const param = evt.data.param.charAt(0).toUpperCase() + evt.data.param.slice(1);

                    const onConfirmDialogClose = (resp: any) => {
                        if (resp) {
                            // accept request
                            evt.data.response(true);
                            // show the UI
                            this.showUI = true;
                            // notify agent accepted the call
                            this.notifyCallConfirmation(true);
                        } else {
                            // reject request
                            evt.data.response(false);
                            // close the call widget
                            this.destroyWidget();
                            // notify agent rejected the call
                            this.notifyCallConfirmation(false);
                        }
                    };
                    const dynamicLabels = [
                        {
                            key: '#callType',
                            value: this.translocoService.translate('dynamic_labels.audioVideoControls.callType.' + param)
                        },
                        {
                            key: '#customerName',
                            value:
                                evt.data?.owner && evt.data.owner
                                    ? evt.data.owner.split('_').pop()
                                    : this.translocoService.translate(
                                          'dynamic_labels.audioVideoControls.customerName.' + this.interactionDetails.CustomerName
                                      )
                        }
                    ];

                    // config incoming call
                    this.confirmDialogRef = this._appUIService.showCustomDialog(
                        'confirm',
                        this._appDataService.getUpdatedLabel(
                            this.translocoService.translate('widgets.audioVideoControls.callRequestConfirmMsg'),
                            dynamicLabels
                        ),
                        '',
                        null,
                        {
                            disableClose: true
                        }
                    );
                    this.confirmDialogRef.afterClosed().subscribe((resp) => onConfirmDialogClose(resp));
                    //this is used in order to close appconfirmdialog in twchatcontrolcomponent
                    this.sharedService.triggerAppConfirmDialogClose();
                    break;
                case 'onTrace':
                    this.logger.info('onAVEvent.onTrace: ' + evt.data);
                    break;
                case 'onError':
                    let error = evt.data?.error || this.translocoService.translate('widgets.audioVideoControls.avConnectionError');
                    if (evt.data?.code in AV_ERRORS) {
                        error = AV_ERRORS[evt.data.code];
                        this.status = `${error}`;
                    } else {
                        this.status = `Error : ${error}`;
if (error === 'Screenshare Was Cancelled') {
                            this.status = `${error}`;
                        }
                    }

                    if (error) {
                        this._appUIService.showSnackbar(error, 'failure');
                    }
                    this.logger.error('onAVEvent.onError', evt.data.code + '-' + evt.data.error);

                    if (evt.data?.code === PERMISSION_ERRORS.SCREENSHARE) {
                        return;
                    }
                    this.logger.info('onAVEvent.onError - Trying to ending call');
                    this.endCall(true, this.translocoService.translate('global.commonErrorMessage'));
                    // close the widget
                    this.destroyWidget();
                    break;
                case 'onAVStats':
                    this.status = evt.data;
                    this.sendAVStatusToServer();
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
                    const stream = evt.data[0];
                    let hasVideo = stream.getTracks().some((track: MediaStreamTrack) => track.kind === 'video');
                    this.selfVideo = {
                        type: hasVideo ? 'video' : 'audio',
                        stream
                    };
                    break;
                case 'onRemoteVideoAdded':
                    // check if the user connected is customer
                    if (evt.data.streamInfo?.user === 'customer' && evt.data.streamInfo?.type !== 'screenshare') {
                        evt.data.streamInfo.user = this.interactionDetails.CustomerName;

                        // add the customer stream to interaction otherdata
                        this._interactionManagerService.updateInteraction(this.interactionId, {
                            otherData: {
                                customerStream: evt.data
                            }
                        });
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
                        evt.data.streamInfo.user = this.interactionDetails.CustomerName + '-Presenting';
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
                    if(this.endCallAfterScreenShareEnd) this.endCall();
                    break;
                case 'onScreenshareDisconnected':
                    this.status = evt.data ? evt.data : 'ss-disconnected';
                    this.remoteScreenSharing = false;
                    this.remoateScreenshareRef = null;
                    // remove the screenshare user
                    this.userList = this.userList.filter((u) => u.streamInfo.type !== 'screenshare');
                    break;
                case 'onFail':
                    // show the error
                    this.connected = false;
                    this.status = 'failed';
                    if (evt.data.code === 'CALL_REJECTED') {
                        this._appUIService.showSnackbar(
                            this.translocoService.translate('widgets.audioVideoControls.callRejectedByRemote'),
                            'failure'
                        );
                    } else if (evt.data.code === AV_FAIL_CODES.REQUEST_TIMED_OUT) {
                        this._appUIService.showSnackbar(
                            this.translocoService.translate('widgets.audioVideoControls.remoteCallRequestTimedOut'),
                            'failure'
                        );
                    } else if (evt.data.code === 'CALL_NOT_ANSWERED') {
                        this._appUIService.showSnackbar(
                            this.translocoService.translate('widgets.audioVideoControls.callNotAnsweredByremote'),
                            'failure'
                        );
                    } else {
                        this._appUIService.showSnackbar(
                            this.translocoService.translate('widgets.audioVideoControls.callFailed') + evt.data.error,
                            'failure'
                        );
                    }
                    this.confirmDialogRef?.close();
                    // close the widget
                    this.destroyWidget();
                    break;
                case 'onDisconnected':
                    this.connected = false;
                    this.status = 'disconnected';
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.callDisconnectedError'), 'failure');
                    // close the widget
                    this.destroyWidget();
                    break;
                case 'onVoiceActivity':
                    map(this.userList, (user: any) => {
                        let level = 0;
                        // set the level to 0
                        user.level = 0;
                        // check for matching stream id and change the level
                        if (user.stream.id === evt.data.streamId) {
                            level = evt.data.level;
                            if (level > 300) {
                                level = 300 / 10;
                            } else {
                                level = level / 10;
                            }
                            user.level = level;
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
                    this._appUIService.showSnackbar(this.translocoService.translate(`widgets.audioVideoControls.${this.genericMessageMapper(evt?.data)}`), 'info');
                    // close the widget
                    this.destroyWidget();
                    this.confirmDialogRef?.close();
                    break;
                case 'onUserLeft':
                    this.userList = this.userList.filter((u) => u.streamInfo.id !== evt.data?.userId);
                    break;
                case 'onReconnecting':
                    break;
                case 'onReconnected':
                    break;
                case 'onStreamStatusChanged':
                    // 1: connected
                    // 2: disconnected
                    if (evt.data.status === 2) {
                    } else if (evt.data.status === 1) {
                    }
                    break;
                case 'onStreamChanged':
                    // evt.data.local: ILocalStreamInfo
                    // evt.data.remote: IRemoteStreamInfo[]

                    const remote: IRemoteStreamInfo[] = evt.data.remote;
                    remote?.forEach((r, i) => {
                        if (r.state !== 'changed') return;

                        this.userList.forEach((f) => {
                            if (f.stream.id !== r.stream.id) return;
                            f.stream = r.stream;
                            f.streamInfo.type = r.type;
                            remote.splice(i, 1);
                        });
                    });

                    if(remote?.length) {
                        remote.forEach((r) => {
                            if (this.userList.some((ul) => ul.stream.id == r.stream.id) || r?.state === 'deleted') return;

                            let newStreamObj = {
                                stream: r.stream,
                                streamInfo: {
                                    id: '',
                                    type: r.type,
                                    user: r.user === '0' ? 'Customer' : r.user
                                }
                            };
                            this.userList.push(newStreamObj);
                        })
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
     * Method to normalize messages which are not defined by application labels
     * @param message Message from MS/CallSDK/User
     * @returns A generic application lable key
     */
    genericMessageMapper (message: string): string {
        let messageKey = '';
        const lcMessage = message.toLowerCase();
        switch(lcMessage) {
            case 'expected behaviour : call hangup by user while media was being established':
            case 'call failed due to internal error': {
                messageKey = 'callEndedByRemoteDueToInternalError'
                break;
            }
            default: {
                messageKey = 'callEndedByRemote'
                break;
            }
        }

        return messageKey;
    }

    /**
     * To send av status to the server for logging & reporting purpose
     */

    sendAVStatusToServer() {
        try {
            const requestArgs = {
                interactionId: this.interactionId.toString(),
                type: 'avcallstatus',
                message: JSON.stringify({
                    param: this.status,
                    callType: this.callType
                })
            };
            SDKClient.sendAVControlMessage(requestArgs);
        } catch (e) {
            this.logger.error('Error occured on sending AV status to server', e, true);
        }
    }

    /**
     * To handles custom DisconnectAVEvent
     * @param evt
     */
    DisconnectAVEvent = async (evt: { Reason: string }) => {
        await this.endCall(true);

        this._tmacEventService.emitSDKEvent({
            event: {
                EventName: 'AVDisconnectedEvent',
                InteractionID: this.interactionId,
                Reason: evt.Reason
            },
            isInteractionEvent: true
        });
    };

    /**
     * AVControlMessageReceivedEvent Handler
     *
     * @param {TextChatRemoteUserConnectedEvent} evt
     */
    TextChatRemoteUserConnectedEvent = (evt: TextChatRemoteUserConnectedEvent) => {
        // update the session ID
        this.sessionId = evt.TextChatSessionID;
        this.interactionDetails.NRIC = evt.NRIC;
        this.interactionDetails.RegNo1 = evt.RegNo1;
        this.interactionDetails.ConferenceType = evt.ConferenceType;
        this.interactionDetails.CustomerName = evt.ScreenName || 'Customer';
        this.interactionDetails.Direction = this.data.Data.Direction || 'out';

        // if CallType is provided, then auto start the call
        if (this.data.Data.CallType && this.interactionDetails.Direction === 'out') {
            this.callType = this.data.Data.CallType;
            this.startAVCall();
        }
    };

    /**
     * AVControlMessageReceivedEvent Handler
     * @method AVControlMessageReceivedEvent
     * @param {AVControlMessageReceivedEvent} evt
     */
    AVControlMessageReceivedEvent = (evt: AVControlMessageReceivedEvent) => {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interactionId) {
                return;
            }

            const requestType = JSON.parse(evt.Message).param;
            switch (evt.Type) {
                case 'requestav':
                    this.handleAvRequestFromAgent(evt);
                    break;
                case 'addscreenshare':
                    this.displayToasters = false;
                    break;
                case 'endscreenshare':
                    this.displayToasters = false;
                    break;
                case 'eventav':
                    if (this.isAgentAvRequest && JSON.parse(evt.Message).event == 'connected' && JSON.parse(evt.Message).owner == 'customer') {
                        this.isAgentAvRequest = false;
                        this.isCustomerAcknowledged = true;
                        if (this.agentAvRequestConsented) {
                            this.showUI = true;
                            this.startAVCall();
                        }
                    }
                    break;
                case 'avtstatus':
                    if (evt.User == 'customer' && this.isAgentAvRequest && JSON.parse(evt.Message)?.errorCode == 'CALL_REJECTED') {
                        this._appUIService.showSnackbar(
                            this.translocoService.translate('widgets.audioVideoControls.callRejectedByRemote'),
                            'failure'
                        );
                        this.destroyWidget();
                        this.confirmDialogRef?.close();
                    }
                    break;
                case 'mute':
                case 'unmute':
                    this.updateMuteUnmuteUserList(requestType, evt);
                    break;
            }

            // forward the av messages to av channel
            this.avConn?.onMessage(
                evt.Type === 'addscreenshare'
                    ? JSON.stringify({ ...JSON.parse(evt.Message), isConferenceAgent: this.interactionDetails.ConferenceType === 'conf' })
                    : evt.Message
            );
        } catch (e) {
            this.logger.error('error occured in AVControlMessageReceivedEvent', e, false);
        }
    };

    /**
     * Method to handle agent av call requests when customer is in conference
     * @param {AVControlMessageReceivedEvent} evt - AV control message object
     */
    handleAvRequestFromAgent(evt: AVControlMessageReceivedEvent): void {
        try {
            let requestType = JSON.parse(evt.Message).param;
            requestType = requestType.charAt(0).toUpperCase() + requestType.slice(1);

            if (evt.User == 'customer') {
                this.isAgentAvRequest = false;
                this.interactionDetails.Direction = 'in';
                this.callType = requestType;
                this.startAVCall();
            } else {
                this.isAgentAvRequest = true;
                const dynamicLabels = [
                    {
                        key: '#callType',
                        value: this.translocoService.translate('dynamic_labels.audioVideoControls.callType.' + requestType)
                    },
                    {
                        key: '#customerName',
                        value: JSON.parse(evt.Message)?.owner?.split('_')?.pop() ?? 'Agent'
                    }
                ];

                this.confirmDialogRef = this._appUIService.showCustomDialog(
                    'confirm',
                    this._appDataService.getUpdatedLabel(
                        this.translocoService.translate('widgets.audioVideoControls.callRequestConfirmMsg'),
                        dynamicLabels
                    ),
                    '',
                    null,
                    {
                        disableClose: true
                    }
                );
                this.confirmDialogRef.afterClosed().subscribe((resp) => {
                    if (resp) {
                        this.showUI = true;
                        this.agentAvRequestConsented = true;
                        if (this.isCustomerAcknowledged) this.startAVCall();
                    } else this.destroyWidget();
                });
            }
        } catch (e) {
            this.logger.error('error occured in handleAvRequestFromAgent', e, false);
        }
    }

    /**
     *
     * @param type - type of mute [i.e 'audio' | 'video']
     * @param data - mute/unmute event data to show relevant notification
     */
    updateMuteUnmuteUserList(type, data) {
        let userName = JSON.parse(data.Message).owner;
        userName = userName.split('_').pop() !== '' ? userName.split('_').pop() : data.User;
        switch (type) {
            case 'audio':
                if (data.Type === 'mute') {
                    this.mutedRemoteUsers.audio.push(data.User.toLowerCase());
                } else {
                    this.mutedRemoteUsers.audio.splice(this.mutedRemoteUsers.audio.indexOf(data.User), 1);
                }
                break;
            case 'video':
                if (data.Type === 'mute') {
                    this.mutedRemoteUsers.video.push(data.User.toLowerCase());
                } else {
                    this.mutedRemoteUsers.video.splice(this.mutedRemoteUsers.video.indexOf(data.User), 1);
                }
                break;
        }

        const muteDisplayTextTypes = this._appDataService.getUpdatedLabel(this.translocoService.translate('widgets.audioVideoControls.muteDisplayText'))?.split(',');

        const dynamicLabels = [
            {
                key: '#userName',
                value: userName
            },
            {
                key: '#muteType',
                value: data.Type
            },
            {
                key: '#muteDisplayText',
                value: muteDisplayTextTypes?.length ? (data.Type === 'mute' ? muteDisplayTextTypes[0] : muteDisplayTextTypes[1]) : data.Type
            },
            {
                key: '#streamType',
                value: type
            }
        ];
        if (this.displayToasters) {
            this._appUIService.showSnackbar(
                this._appDataService.getUpdatedLabel(this.translocoService.translate('widgets.audioVideoControls.remoteMuteTypeMsg'), dynamicLabels),
                'warning'
            );
        }
        this.displayToasters = true;
    }

    /**
     * AgentAVMessageEvent Handler
     * @method AgentAVMessageEvent
     * @param {AgentAVMessageEvent} evt
     */
    AgentAVMessageEvent = (evt: AgentAVMessageEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check if its a av request
        if (evt.Type === 'requestav') {
            this.interactionDetails.Direction = 'in';
            this.callType = JSON.parse(evt.Message).param;
            this.startAVCall();
        }

        // forward the av messages to av channel
        this.avConn?.onMessage(evt.Message);
    };

    /**
     * TextChatDisconnectedEvent Handler
     * @method TextChatDisconnectedEvent
     * @param {TextChatDisconnectedEvent} evt
     */
    TextChatDisconnectedEvent = (evt: TextChatDisconnectedEvent) => {
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
    TextChatMessageReceivedEvent = (evt: TextChatMessageReceivedEvent) => {
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
            const type = msg.type.toLowerCase();

            switch (type) {
                case 'snapshot':
                    {
if(evt.User !== this.user.agentId && evt.User !== 'customer') return;
                        let message = '';
                        const msgStatus = msg.status.toLowerCase();
                        let status: SnackbarStateTypes = 'success';

                        switch (msgStatus) {
                            case 'ack':
                                message = this.translocoService.translate('widgets.audioVideoControls.snapshotRequestSuccess');
                                status = 'success';
                                break;
                            case 'snapshotrequestack':
                            case 'accept':
                                message = this.translocoService.translate('widgets.audioVideoControls.snapshotLoading');
                                status = 'loading';
                                break;
                            case 'reject':
                                message = this.translocoService.translate('widgets.audioVideoControls.snapshotRequestRejectedByRemote');
                                status = 'failure';
                                break;
                            case 'response':
                            case 'success':
                                message = this.translocoService.translate('widgets.audioVideoControls.snapshotSuccess');
                                status = 'success';
                                break;
                            default:
                                message = this.translocoService.translate('widgets.audioVideoControls.snapshotFailed');
                                status = 'failure';
                                break;
                        }

                        // clear the request timeout ref if any response is received from customer
                        this.clearSnapshotTimeout(true);

                        // check if the response from remote is not accept/ack
                        // then we need to clear the flag and clear request timeout
                        if (!['ack', 'snapshotrequestack', 'accept'].includes(msgStatus)) {
                            this.snapshotRequested = false;
                            // clear the response timeout ref
                            this.clearSnapshotTimeout(false);
                        }

                        if (message) {
                            const snapshotMatRef = this._appUIService.showSnackbar(message, status);
                            if (status === 'loading') {
                                // if there a reference of timer then return
                                if (this.snapshotResponseTimeoutRef$ && !this.snapshotResponseTimeoutRef$.isStopped) return;

                                this.snapshotResponseTimeoutRef$ = new Subject<boolean>();

                                from([0])
                                    .pipe(
                                        delay(this.data.Data.Snapshot?.RemoteResponseTimeout * 1000 || 10000),
                                        takeUntil(merge(this.snapshotResponseTimeoutRef$, this.unsubscribeAll))
                                    )
                                    .subscribe(() => {
                                        snapshotMatRef.dismiss();
                                        this.snapshotRequested = false;
                                        console.error('Snapshot response timed out');
                                    });
                            }
                        }
                    }
                    break;
                case 'camerachange':
                    {
                        if (msg.status === 'action') {
                            this.setCameraSelected(msg.data.deviceId);
                        }
                    }
                    break;
                case 'request_screenshare':
                    {
                        if (msg.status === 'accepted') {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.requestScreenShareAccepted'));
                        } else if (msg.status === 'rejected') {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.requestScreenShareRejected'));
                        }
                    }
                    break;
                case 'togglecamera':
                case 'toggleview':
                    {
                        const dynamicLabels = [
                            {
                                key: '#toggleViewType',
                                value: type.replace('toggle', '')
                            }
                        ];
                        switch (msg.status) {
                            case 'ack':
                                break;
                            case 'accepted':
                                this._appUIService.showSnackbar(
                                    this._appDataService.getUpdatedLabel(
                                        this.translocoService.translate('widgets.audioVideoControls.toggleViewRequestAccepted'),
                                        dynamicLabels
                                    )
                                );
                                break;
                            case 'rejected':
                                this._appUIService.showSnackbar(
                                    this._appDataService.getUpdatedLabel(
                                        this.translocoService.translate('widgets.audioVideoControls.toggleViewRequestRejected'),
                                        dynamicLabels
                                    ),
                                    'failure'
                                );
                                break;
                            case 'success':
                                this._appUIService.showSnackbar(
                                    this._appDataService.getUpdatedLabel(
                                        this.translocoService.translate('widgets.audioVideoControls.toggleViewSuccess'),
                                        dynamicLabels
                                    )
                                );
                                // set camera selected for 'togglecamera'
                                if (type === 'togglecamera') this.setCameraSelected(msg.data.deviceId);
                                // set user view for 'toggleview'
                                else if (type === 'toggleview') this.userView = msg.data.view;
                                break;
                            case 'failed':
                                this._appUIService.showSnackbar(
                                    this._appDataService.getUpdatedLabel(
                                        this.translocoService.translate('widgets.audioVideoControls.toggleViewFailed'),
                                        dynamicLabels
                                    ),
                                    'failure'
                                );
                                break;
                        }
                    }
                    break;
                case 'viewchange':
                    {
                        if (msg.status === 'action') {
                            this.userView = msg.data.view;
                        }
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
        if (evt.InteractionID !== this.interactionId || !this.connected) {
            return;
        }

        this.onCallHoldEvent = true;
        this._appUIService.setAvInteractionHoldFlag(this.interactionId, this.onCallHoldEvent)

        if (this.muteAVOnHold.enabled) {
            setTimeout(() => {
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
            }, 1000);

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
            } else {
                return;
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
        if ((evt.InteractionID !== this.interactionId) || this.manualHold || !this.connected) {
            return;
        }

        this.onCallHoldEvent = false;
        this._appUIService.setAvInteractionHoldFlag(this.interactionId, this.onCallHoldEvent)

        if (this.muteAVOnHold.enabled) {
            setTimeout(() => {
                if (this.muteAVOnHold.agentAudio && this.muteAVOnHold.agentVideo && this.audioMuted && this.videoMuted && !this.manualMuteFlags.audio && !this.manualMuteFlags.video) {
                    this.avConn.unMute(true, true);
                    this.audioMuted = false;
                    this.videoMuted = false;
                } else if (this.muteAVOnHold.agentAudio && this.audioMuted && !this.manualMuteFlags.audio) {
                    this.avConn.unMute(true, false);
                    this.audioMuted = false;
                } else if (this.muteAVOnHold.agentVideo && this.videoMuted && !this.manualMuteFlags.video) {
                    this.avConn.unMute(false, true);
                    this.videoMuted = false;
                }
            }, 1000);

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
        if (!this.data.Config.AOT) return;

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

    /**
     * To clear snapshot request/response timeout ref
     * @param {Boolean} request
     */
    private clearSnapshotTimeout(request: boolean) {
        // clear request timeout
        if (request) {
            if (this.snapshotRequestTimeoutRef$ && !this.snapshotRequestTimeoutRef$.isStopped) {
                this.snapshotRequestTimeoutRef$.next(true);
                this.snapshotRequestTimeoutRef$.complete();
            }
        }

        // clear response timeout
        if (this.snapshotResponseTimeoutRef$ && !this.snapshotResponseTimeoutRef$.isStopped) {
            this.snapshotResponseTimeoutRef$.next(true);
            this.snapshotResponseTimeoutRef$.complete();
        }
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
        this.manualMuteFlags.audio = (this.audioMuted === true);
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
        this.manualMuteFlags.video = (this.videoMuted === true);
    }

    /**
     * Request To Share Screen
     * @method requestToShareScreen
     */
    public requestToShareScreen(): void {
        // check if there is an ongoing screenshare already
        if (this.screenSharing) {
            // screen share already in progress - send warning popup
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.screenshareAlreadyInProgress'), 'warning');
        } else {
            // request customer to initiate screenshare
            SDKClient.sendActionMessage({
                interactionId: this.interactionId as any,
                message: JSON.stringify({
                    source: 'agent',
                    options: {},
                    data: {
                        interactionId: this.interactionId
                    },
                    status: 'request',
                    type: 'request_screenshare',
                    eventName: 'ActionMessage',
                    id: TUtils.Generic.uuid()
                })
            })
                .then((res) => {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.screenshareReqSent'));
                })
                .catch((ex) => {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.screenshareReqError'), 'failure');
                });
        }
    }

    /**
     * Share Screen
     * @method shareScreen
     */
    public shareScreen(endCallAfterScreenShareEnd?: boolean): void {
        this.endCallAfterScreenShareEnd = endCallAfterScreenShareEnd;
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
        if (this.data.Data.Snapshot?.Source?.toLowerCase() === 'local') {
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
                        this.translocoService.translate('widgets.audioVideoControls.confirmSnapshotTitle'),
                        null,
                        {
                            disableClose: false
                        }
                    );
                    confirmDialogRef.afterClosed().subscribe((resp) => {
                        if (resp) {
                            this._appUIService.showSnackbar(
                                this.translocoService.translate('widgets.audioVideoControls.saveSnapshotLoading'),
                                'loading'
                            );
                            // send snapshot
                            SDKClient.saveVideoSnap(
                                {
                                    base64,
                                    email: '',
                                    interactionId: this.interactionId.toString(),
                                    name: this.interactionDetails.CustomerName,
                                    nric: this.interactionDetails.NRIC || '',
                                    phone: this.interactionDetails.RegNo1 || '',
                                    sessionId: this.sessionId
                                },
                                { base64 }
                            )
                                .then((result: IResponse) => {
                                    if (result.response && result.response.ImageUrl) {
                                        // snapsot saved sucessfully
                                        this._appUIService.showSnackbar(
                                            this.translocoService.translate('widgets.audioVideoControls.snapshotSaveSuccess'),
                                            'success'
                                        );

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
                                        this._appUIService.showSnackbar(
                                            this.translocoService.translate('widgets.audioVideoControls.snapshotSaveFailed'),
                                            'failure'
                                        );
                                    }
                                })
                                .catch(() => {
                                    this._appUIService.showSnackbar(
                                        this.translocoService.translate('widgets.audioVideoControls.snapshotSaveFailed'),
                                        'failure'
                                    );
                                });
                        }
                    });
                }
            });
        } else if (this.data.Data.Snapshot?.Source?.toLowerCase() === 'remote') {
            try {
                const snackRef = this._appUIService.showSnackbar(
                    this.translocoService.translate('widgets.audioVideoControls.snapshotRequestLoading'),
                    'loading'
                );

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

                this.snapshotRequested = true;

                // if the RemoteRequestTimeout is not configured, then do not wait for ack or request timeout
                if (!this.data.Data.Snapshot?.RemoteRequestTimeout) {
                    snackRef.dismiss();
                    return;
                }

                this.snapshotRequestTimeoutRef$ = new Subject<boolean>();

                from([0])
                    .pipe(
                        delay(this.data.Data.Snapshot?.RemoteRequestTimeout * 1000 || 30000),
                        takeUntil(merge(this.snapshotRequestTimeoutRef$, this.unsubscribeAll))
                    )
                    .subscribe(async () => {
                        this.snapshotRequested = false;

                        try {
                            await SDKClient.sendActionMessage({
                                interactionId: this.interactionId as any,
                                message: JSON.stringify({
                                    source: 'agent',
                                    options: {},
                                    data: {
                                        interactionId: this.interactionId
                                    },
                                    status: 'request-timeout',
                                    type: 'snapshot',
                                    eventName: 'ActionMessage',
                                    id: TUtils.Generic.uuid()
                                })
                            });
                        } catch (error) {}

                        this._appUIService.showSnackbar(
                            this.translocoService.translate('widgets.audioVideoControls.snapshotRequestTimeout'),
                            'failure'
                        );
                        console.error('Snapshot request timed out');
                    });
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
        this.manualHold = !this.manualHold;

        // check the hold flag
        if (this.hold) {
            // un hold the call
            this.avConn.unHold();
            if (this.data.Data.Source === 'TwChatControlsComponent') {
                // if (typeof this.data.Data.Opener.unHoldInteraction === 'function') {
                //     this.data.Data.Opener.unHoldInteraction();
                // }

                this._tmacEventService.emitSDKEvent({
                    event: {
                        EventName: 'UnholdInteractionEvent',
                        InteractionID: this.interactionId
                    },
                    isInteractionEvent: true
                });
            }
        } else {
            // hold the call
            this.avConn.hold();
            if (this.data.Data.Source === 'TwChatControlsComponent') {
                // if (typeof this.data.Data.Opener.holdInteraction === 'function') {
                //     this.data.Data.Opener.holdInteraction();
                // }

                this._tmacEventService.emitSDKEvent({
                    event: {
                        EventName: 'HoldInteractionEvent',
                        InteractionID: this.interactionId
                    },
                    isInteractionEvent: true
                });
            }
        }
        // set the reference varaible
        this.hold = !this.hold;
    }

    async confirmDialogForEndInteraction()
    {
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('endInteraction');
        const dialogResult = await confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)).pipe(take(1)).toPromise();
        if (dialogResult) {
            this.endCall(true);
            this.destroyWidget();
            this.endInteraction();
        }  
        else {
            this.endCall(true);
            this.destroyWidget();
        }
    }

    endInteraction()
    {    
        this._tmacEventService.emitSDKEvent({
        event: {
            EventName: 'EndInteractionEvent',
            InteractionID: this.interactionId
        },
        isInteractionEvent: true
        });
    }

    /**
     * pre End Call when confirmation box is needed
     * @method endCallClicked
     */
    public async endAVCallClicked()
    {
        if(this.data.Data.EndInteractionOnAVEnd && this.data.Data.Source === 'TwChatControlsComponent'){
            this.confirmDialogForEndInteraction();
        }
        else {
            this.endCall(true);
            this.destroyWidget();
        }
    }


    /**
     * End Call
     * @method endCall
     */
    public async endCall(endOnly = false, reason = '', errorCode?: string): Promise<boolean> {
        // if there is only customer then endCall else dropCall
        if (this.userList.filter((u) => u.streamInfo.type !== 'screenshare').length > 1) {
            this.logger.info('endCall - droping call');
            this.avConn.dropCall(reason);
        } else {
            this.logger.info('endCall - ending call');
            this.avConn.endCall(this.wrcCallType, reason, errorCode);
        }

        // of endOnly then return
        if (endOnly) {
            return true;
        }

         // to confirm end call
         if (this.data.Data.EndInteractionOnAVEnd 
            && this.data.Data.Source === 'TwChatControlsComponent') {
            // this.data.Data.Opener.confirmEndChat(null);

            this._tmacEventService.emitSDKEvent({
                event: {
                    EventName: 'ConfirmEndInteractionEvent',
                    InteractionID: this.interactionId
                },
                isInteractionEvent: true
            });
        }

        // close the widget
        this.destroyWidget();

        return true;
    }


    /**
     * Opens webrtc stats inside an iframe
     */
    async showWebRTCStats(): Promise<void> {
        try {
            if (this.data.Data.WebRTCTest.Allowed) {
                const { Url, Customer } = this.data.Data.WebRTCTest;
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

                this._aotWidgetService.addWidget(widget as AOTWidget);

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
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.upgradeToVideoFailed'), 'failure');
        } else {
            this.selfVideo.type = 'video';
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
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.toggleCamRequestSuccess'));
            } else {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.toggleCamRequestFailed'), 'failure');
            }
        } catch (error) {
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.toggleCamRequestError'), 'failure');
            throwADError('Error in TwAudioVideoControlsComponent.toggleUserCamera', error);
        } finally {
            this._fuseProgressBarService.hide();
        }
    }

    /**
     * To toggle user view
     */
    public async toggleUserView(): Promise<void> {
        try {
            this._fuseProgressBarService.show();

            const { response } = await SDKClient.sendActionMessage({
                interactionId: this.interactionId.toString(),
                message: JSON.stringify({
                    source: 'agent',
                    options: {},
                    data: {
                        view: this.userView === 'call' ? 'chat' : 'call'
                    },
                    status: 'request',
                    type: 'toggleview',
                    eventName: 'ActionMessage',
                    id: TUtils.Generic.uuid()
                })
            });

            if (response.ResultCode === 1) {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.toggleViewRequestSuccess'));
            } else {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.toggleViewRequestFailed'), 'failure');
            }
        } catch (error) {
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.audioVideoControls.toggleViewRequestError'), 'failure');
            throwADError('Error in TwAudioVideoControlsComponent.toggleUserView', error);
        } finally {
            this._fuseProgressBarService.hide();
        }
    }

    /**
     * To send action message to mute/unmute customer AV
     * @param message
     */
    public async requestMuteUnmuteCustomerAV(source: 'AV' | 'audio' | 'video', type: 'mute' | 'unmute', message: any): Promise<void> {
        const dynamicLabels = [
            {
                key: '#streamType',
                value: source
            },
            {
                key: '#muteType',
                value: type
            }
        ];
        try {
            this._fuseProgressBarService.show();

            const { response } = await SDKClient.sendActionMessage({
                interactionId: this.interactionId.toString(),
                message: JSON.stringify(message)
            });

            if (response.ResultCode !== 1) {
                this._appUIService.showSnackbar(
                    this._appDataService.getUpdatedLabel(
                        this.translocoService.translate('widgets.audioVideoControls.remoteMuteTypeRequestFailed'),
                        dynamicLabels
                    ),
                    'failure'
                );
            }
        } catch (error) {
            this._appUIService.showSnackbar(
                this._appDataService.getUpdatedLabel(
                    this.translocoService.translate('widgets.audioVideoControls.remoteMuteTypeRequestError'),
                    dynamicLabels
                ),
                'failure'
            );
            throwADError('Error in TwAudioVideoControlsComponent.requestMuteUnmuteCustomerAV', error);
        } finally {
            this._fuseProgressBarService.hide();
        }
    }

    /**
     * To send action message to notify agent accepted/rejected the AV call
     */
    public notifyCallConfirmation(response: boolean) {
        try{
            const messageType = response ? 'accepted_call' : 'rejected_call';
            SDKClient.sendActionMessage({
            interactionId: this.interactionId as any,
            message: JSON.stringify({
                source: 'agent',
                options: {},
                data: {
                    interactionId: this.interactionId
                },
                status: 'action',
                type: messageType,
                eventName: 'ActionMessage',
                id: TUtils.Generic.uuid()
                })
            })
        }
        catch(error){}
    }

    ifMuted(data, type) {
        return this.mutedRemoteUsers[type].includes(data.id) || this.mutedRemoteUsers[type].includes(data.user.toLowerCase());
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

interface IInteractionDetails {
    /**
     * Customer NRIC
     */
    NRIC: string;
    /**
     * Customer registered phone number
     */
    RegNo1: string;
    /**
     * Interaction id
     */
    InteractionID: number;
    /**
     * Conference type
     */
    ConferenceType: string;
    /**
     * Customer name
     */
    CustomerName: string;
    /**
     * Direction of AV
     */
    Direction: 'in' | 'out';
    /**
     * Session id of chat
     */
    SessionID: string;
    /**
     * Type of call
     */
    CallType: 'audio' | 'video';
}

// for more info visit - https://angular.io/api/core

