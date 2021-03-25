import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { map } from 'lodash';
import { timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AVChannel, AVControlMessageReceivedEvent, AVEvent, IAgentData, SDKClient, TEnums, TextChatDisconnectedEvent, TUtils } from 'tmac-sdk';
import { TwChatControlsComponent } from '../tw-chat-controls/tw-chat-controls.component';

/**
 * Audo controls Component
 */
@Component({
    selector: 'tw-audio-controls',
    templateUrl: './tw-audio-controls.component.html',
    styleUrls: ['./tw-audio-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAudioControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Fuse config
     */
    // fuseConfig: any;
    /**
     * App config
     */
    appConfig: any;

    /**
     * Widget Data
     */
    widgetData: {
        /**
         * Customer Name
         */
        customerName: string;
        /**
         * Chat config
         */
        chatConfig: any;
        /**
         * Direction
         * Need more description
         */
        direction: string;
        /**
         * Need more description
         */
        opener: TwChatControlsComponent;
    };
    /**
     * User info
     */
    user: IAgentData;
    /**
     * AV info
     */
    avConn: AVChannel;
    /**
     * Interaction ID
     */
    interactionId: number;
    /**
     * Session Id
     */
    sessionID: string;
    /**
     * User list
     */
    userList: any[] = [];
    /**
     * Start time
     */
    startTime: Date;
    /**
     * Call Duration
     */
    duration: number;
    /**
     * Need more description
     */
    mos = '0.00';
    /**
     * Need more description
     */
    status = 'initial';
    /**
     * Connected Flag
     */
    connected: boolean;
    /**
     * Need more description
     */
    showUI: boolean;
    /**
     * Mute flag
     */
    muted: boolean;
    /**
     * Hold flag
     */
    hold: boolean;
    /**
     * Local Screen Sharing flag
     */
    screenSharing: boolean;
    /**
     * Remote Screenshare flag
     */
    remoteScreenSharing: boolean;
    /**
     * Remote screenshare stream ref
     */
    remoateScreenshareRef: any;

    /**
     * Fuse custom background colors
     */
    customFuseColor = {
        anchor$: this.fusefacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this.fusefacadeService.widgetBgClasses$
    };

    /**
     * Constructor
     */
    constructor(
        // private _fuseConfigService: FuseConfigService,
        private _appDataService: AppDataService,
        private _aotWidgetService: AOTWidgetService,
        private _appUIService: AppUiService,
        private fusefacadeService: FuseFacadeService
    ) {
        super();
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

        // this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
        //     this.fuseConfig = config;
        // });

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        // listen to tmac events
        SDKClient.events.on('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.on('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);

        // get the agent data
        this.user = SDKClient.getAgentData();

        // assign the start time
        this.startTime = new Date();

        // add the widget data
        this.interactionId = this.data.InteractionDetails?.InteractionID;
        this.sessionID = this.data.InteractionDetails?.TextChatSessionID;
        this.widgetData = {
            customerName: this.data.Data.CustomerName,
            chatConfig: this.data.Data.Config || new Object(),
            opener: this.data.Data.Opener,
            direction: this.data.Data.direction
        };
        const avEvent = this.data.Data.AVEvent || null;
        // create the AV channel connection
        this.createAVConnection(avEvent);
        // start call

        if (this.data.Data.DirectCall) {
            this.avConn?.directCall(TEnums.WrcCallTypes.Audio);
        } else {
            this.avConn
                ?.startCall(TEnums.WrcCallTypes.Audio, null)
                .then((dt: any) => {
                    this.showUI = true;
                    // check the response is sucess or timed out
                    if (dt.code === TEnums.WrcCodes.RequestTimeout) {
                        // close the call widget
                        this._aotWidgetService.destroyWidget(this.data.ID);
                    }
                })
                .catch((error) => {
                    this._appUIService.showSnackbar('Error in starting the call: ' + error, 'failure');
                });
        }

        this.showUI = true;
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.avConn?.close();
        this.avConn?.events.off('onAVEvent', this.onAVEvent);
        SDKClient.events.off('AVControlMessageReceivedEvent', this.AVControlMessageReceivedEvent);
        SDKClient.events.off('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
        this.widgetData.opener.disposeCallWidget();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create AV connection
     * @method createAVConnection
     * @param {AVControlMessageReceivedEvent} avEvent
     */
    private createAVConnection(avEvent: AVControlMessageReceivedEvent): void {
        if (!this.interactionId) {
            TUtils.Logger.debug('Error in AVChannel: Could not create AV channel instance!');
            return;
        }

        // Set AV Config
        const AV: any = this.appConfig.AppConfigs.AV || {};

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
            TUtils.Logger.debug('Error in AVChannel: Could not create AV channel instance!');
            return null;
        }

        // listen to AV events
        connection.events.on('onAVEvent', this.onAVEvent);

        // assign the av connection
        this.avConn = connection;

        // if the direction is in, then this widget can be opened on av request.
        // so once after creating the widget, process it
        if (avEvent) {
            connection.onMessage(avEvent.Message);
        }
    }

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
     * AVEvent Handler
     * @method onAVEvent
     * @param {AVEvent} evt
     */
    private onAVEvent = (evt: AVEvent) => {
        // swtich the av events
        switch (evt.event) {
            case 'onIncoming':
                // request param
                const param = evt.data.param.charAt(0).toUpperCase() + evt.data.param.slice(1);

                const onConfirmDialogClose = (resp) => {
                    if (resp) {
                        // accept request
                        evt.data.response(true);
                        // show the UI
                        this.showUI = true;
                    } else {
                        if (param !== 'Screenshare') {
                            // reject request
                            evt.data.response(false);
                            // close the call widget
                            this._aotWidgetService.destroyWidget(this.data.ID);
                        }
                    }
                };

                if (param === 'Screenshare' && this.widgetData.opener.allowCustomerScreenShare) {
                    onConfirmDialogClose(true);
                } else {
                    // config incoming call
                    const confirmDialogRef = this._appUIService.showCustomDialog(
                        'confirm',
                        param + ' call requested by customer, Do you want to accept it?'
                    );
                    confirmDialogRef.afterClosed().subscribe((resp) => onConfirmDialogClose(resp));
                }
                break;
            case 'onTrace':
                TUtils.Logger.info('TwAudioControlsComponent.onAVEvent.onTrace' + evt.data);
                break;
            case 'onError':
                TUtils.Logger.error('TwAudioControlsComponent.onAVEvent.onError', evt.data);
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
                    this._appUIService.showSnackbar('Customer has rejected your request', 'failure');
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
                this._appUIService.showSnackbar('Customer has ended the call', 'info');
                // close the widget
                this.destroyWidget();
                break;
            default:
            // console.log(`unhandled:: [${evt.event}]`, evt);
        }
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
     * Widget Cleanup
     * @method destroyWidget
     */
    private destroyWidget(): void {
        // close the audio call widget
        this._aotWidgetService.destroyWidget(this.data.ID);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Mute call
     * @method muteCall
     */
    public muteCall(): void {
        // check the muted flag
        if (this.muted) {
            // un mute the call
            this.avConn.unMute(true, false);
        } else {
            // mute the call
            this.avConn.mute(true, false);
        }
        // set the reference varaible
        this.muted = !this.muted;
    }

    /**
     * Hold call
     * @method holdCall
     */
    public holdCall(): void {
        // check the muted flag
        if (this.hold) {
            // un hold the call
            this.avConn.unHold();
        } else {
            // hold the call
            this.avConn.hold();
        }
        // set the reference varaible
        this.hold = !this.hold;
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
     * End call
     * @method endCall
     */
    public endCall(): void {
        // end the call
        // if there is only customer then endCall else dropCall
        if (this.userList.length > 1) {
            this.avConn.dropCall('');
        } else {
            this.avConn.endCall(TEnums.WrcCallTypes.Audio, '');
        }
        // close the widget
        this.destroyWidget();
    }
}

// for more info visit - https://angular.io/api/core
