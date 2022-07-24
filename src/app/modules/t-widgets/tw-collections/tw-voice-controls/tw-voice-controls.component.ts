import { AgentSkillListData, IVRTransferMenu, TwVoiceControls, TwVoiceControlsData } from '@ad/types';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AgentSkillListComponent } from '@modules/shared/components';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    AgentInteractionTemplate,
    AVApiConfig,
    AVChannel,
    AVEvent,
    CallConferenceCompletedEvent,
    CallConferenceInitiatedEvent,
    CallConferenceLineDisconnectEvent,
    CallConferenceRemoteConnectedEvent,
    CallConnectedEvent,
    CallDisconnectedEvent,
    CallerIntentEvent,
    CallHoldEvent,
    CallHoldReconnectEvent,
    CallTransferInitiatedEvent,
    CallTransferLineDisconnectEvent,
    CallTransferRemoteConnectedEvent,
    HoldTimerEvent,
    IAgentData,
    IncomingCallEvent,
    IncomingCallUpdateEvent,
    InteractionDataEvent,
    IResponse,
    IVRDataEvent,
    MediaServerEvent,
    OutgoingCallEvent,
    SDKClient,
    TEnums,
    TMACEventTypes,
    UUIDataEvent
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { InteractionComment, InteractionRef, IWidget } from 'app/interfaces';
import { AgentSkillListDataModel, TwWidgetModel } from 'app/models';
import { Subject, timer } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { TwComposeMessagingComponent } from '../tw-compose-messaging/tw-compose-messaging.component';
import { TwVoiceControlsService } from './tw-voice-controls.service';

/**
 * Voice Controls Component
 */
@Component({
    selector: 'tw-voice-controls',
    templateUrl: './tw-voice-controls.component.html',
    styleUrls: ['./tw-voice-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoiceControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy, AfterViewInit {
    /**
     * Daat from App config
     */
    @Input() data: TwVoiceControls<IncomingCallEvent | OutgoingCallEvent>;
    /**
     * Widget data
     */
    widgetData: TwVoiceControlsData;
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
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };
    /**
     * To store av api configs
     */
    avConfig: AVApiConfig;
    /**
     * Interaction ref
     */
    interaction: IncomingCallEvent | OutgoingCallEvent;
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
    startTime: Date;
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
    duration: number;
    /**
     * Subject to stop duration timer
     */
    stopTimer = new Subject();
    /**
     * Last 4 IVR menu ref
     */
    last4IVR = ['NA', 'NA', 'NA', 'NA'];
    /**
     * IVR menus
     */
    ivrMenus: IVRTransferMenu[] = [];
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
     * MS call muted flag
     */
    muted: boolean;
    /**
     * Transfer/Conference widgetf
     */
    tranfConfWidget: IWidget;
    /**
     * Temporary call reference for transfer/conference
     */
    tempCallRef: {
        /**
         * Call status
         */
        status: string;
        /**
         * Call sessionId
         */
        sessionID: string;
        /**
         * Type of call
         */
        type: '' | 'transfer' | 'conference';
        /**
         * Is consult transfer/conference
         */
        isConsult?: boolean;
        /**
         * Source of transfer/conference
         */
        source?: string;
    } = null;
    /**
     * Call lines ref
     */
    callLines = [];
    /**
     * Confirm dialog ref
     */
    dialogRef: MatDialogRef<any, any>;
    /**
     * Saved interaction comments
     */
    savedComments: InteractionComment[] = [];
    /**
     * Flag to blink comments button when added from server
     */
    commentsAdded: boolean;
    /**
     * Dial pad numbers
     */
    dialpadNumbers = [
        {
            key: '1',
            value: TEnums.WrsDtmfTones.NUM_1
        },
        {
            key: '2',
            value: TEnums.WrsDtmfTones.NUM_2
        },
        {
            key: '3',
            value: TEnums.WrsDtmfTones.NUM_3
        },
        {
            key: '4',
            value: TEnums.WrsDtmfTones.NUM_4
        },
        {
            key: '5',
            value: TEnums.WrsDtmfTones.NUM_5
        },
        {
            key: '6',
            value: TEnums.WrsDtmfTones.NUM_6
        },
        {
            key: '7',
            value: TEnums.WrsDtmfTones.NUM_7
        },
        {
            key: '8',
            value: TEnums.WrsDtmfTones.NUM_8
        },
        {
            key: '9',
            value: TEnums.WrsDtmfTones.NUM_9
        },
        {
            key: '*',
            value: TEnums.WrsDtmfTones.Star
        },
        {
            key: '0',
            value: TEnums.WrsDtmfTones.NUM_0
        },
        {
            key: '#',
            value: TEnums.WrsDtmfTones.Pound
        }
    ];
    /**
     * To open/close add dialpad
     */
    openDialpad: boolean;
    /**
     * Dialed number ref
     */
    dialedNumbers = '';
    /**
     * IVR langauge
     */
    language = '';
    /**
     * Sub type reference
     */
    subType: string;
    /**
     * Make call dialog
     */
    @ViewChild('makeCallDialog')
    MakeCallDialog: TemplateRef<any>;
    /**
     * Flag to identify if the call is updated
     */
    callUpdated: boolean;
    /**
     * Make call dialog ref
     */
    makeCallDialogRef: MatDialogRef<any>;
    /**
     * Last 4 IVR menu timeline color
     */
    timelineItemColors = ['tl-purple', 'tl-blue', 'tl-teal', 'tl-turquoise'];
    /**
     * Need More description
     */
    mos = '0.00';
    /**
     * Call connected flag
     */
    callConnected: boolean;

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appDataService: AppDataService,
        private _interactionManagerService: InteractionManagerService,
        private _tmacEventService: TMACEventService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private _matDialog: MatDialog,
        private _contentPageService: ContentPageService,
        public voiceControlsService: TwVoiceControlsService
    ) {
        super('TwVoiceControlsComponent');
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

        this.widgetData = this.data.Data;

        // get the user info
        this.user = SDKClient.getAgentData() || null;

        this._appDataService
            .getConfig({ AV: 'AppConfigs.AV' })
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((config) => {
                this.avConfig = config.AV ?? {};
            });

        // subscribe to interaction manager service
        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            // filter out the textchat interaction
            this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'voice');
        });

        this.interaction = this.data.InteractionDetails;

        if (this.interaction) {
            // set the start time
            this.startTime = new Date(this.data.InteractionDetails.CreatedTime) ?? new Date();
            // assign the caller id
            this.callerID = this.interaction.PhoneNumber || 'NA';
            // update the session ID
            this.sessionID = this.interaction.UCID || 'NA';
            // set the process media messages flag
            this.processMediaMessages = !this.isManualAnswer;

            // check the event name
            if (this.interaction.EventName === 'IncomingCallEvent') {
                this.interaction = this.data.InteractionDetails as IncomingCallEvent;
                // set the manual anser flag
                this.isManualAnswer = this.interaction.IsManualAnswer || false;
                // set the direction
                this.direction = this.interaction.Direction ?? 'In';
                // set the status
                this.status = 'incoming';
                // assign the last 4 IVR, if default is configured
                this.last4IVR = this.widgetData.IVR?.DefaultMenu || this.last4IVR;
                this._appUIService.showDesktopAlert('Incoming Call', `You have a new incoming call from ${this.interaction.PhoneNumber}`, false);
                // add the subtype
                this.subType = this.interaction.SubType?.toLowerCase();
            } else {
                this.interaction = this.data.InteractionDetails as OutgoingCallEvent;
                // set direction
                this.direction = 'Out';
                // set status
                this.status = 'outgoing';
                // set the callflow
                this.setCallflow('OutgoingCallEvent');
            }

            // assign the IVR menus if enabled
            if (this.widgetData.IVR?.Transfer?.Allowed) {
                this.ivrMenus = this.widgetData.IVR?.Transfer?.Menu || [];
            }
        } else {
            console.warn('Interaction details are not available for voice');
            return;
        }

        // set duration to 0 initially
        this.duration = 0;

        // set call connected to false initially
        this.callConnected = false;

        // listen to TMAC events
        this._tmacEventService
            .getInteractionEvents(
                [
                    'IncomingCallUpdateEvent',
                    'OutgoingCallEvent',
                    'CallConnectedEvent',
                    'CallDisconnectedEvent',
                    'CallHoldEvent',
                    'CallHoldReconnectEvent',
                    'CallTransferInitiatedEvent',
                    'CallTransferLineDisconnectEvent',
                    'CallTransferRemoteConnectedEvent',
                    'CallConferenceInitiatedEvent',
                    'CallConferenceCompletedEvent',
                    'CallConferenceLineDisconnectEvent',
                    'CallConferenceRemoteConnectedEvent',
                    'MediaServerEvent',
                    'VoiceCannedResponseEvent',
                    'CallerIntentEvent',
                    'IVRDataEvent',
                    'InteractionDataEvent',
                    'UUIDataEvent',
                    'HoldTimerEvent'
                ],
                this.interaction.InteractionID
            )
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngAfterViewInit(): void {
        // if route to page is enabled
        let route = false;

        // check if auto route is needed
        if (this.interaction.EventName === 'OutgoingCallEvent') {
            route = true;
        }

        // check if the current page is voice page
        if (route || (this.widgetData.RouteOnInteraction && this._interactionManagerService.getInteractionCount().active <= 1)) {
            setTimeout(
                (r) => {
                    let inPage = true;
                    // navigate if not same page
                    if (this._contentPageService.getCurrentMode() !== this.widgetData.Path) {
                        inPage = false;
                        this._contentPageService.mode = this.widgetData.Path;
                    }

                    // if we do outgoing/no active we need to select that particular interaction
                    if (!inPage || r) {
                        const interaction = this.interactionList.filter((i) => i.interactionId === this.interaction?.InteractionID)[0];
                        if (interaction && !interaction?.isActive) {
                            this.selectInteraction(interaction, true);
                        }
                    }
                },
                500,
                route
            );
        }
    }

    /**
     * Lifecycle hook
     * @method OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // stop duration timer
        this.stopTimer.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

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

            // create a AV channel connection
            const connection = new AVChannel(
                SDKClient,
                this.interaction.InteractionID.toString(),
                this.user.agentId,
                '',
                sessionId,
                'voice',
                this.avConfig
            );

            if (!connection) {
                this.logger.warn(`Unable to create AVChannel for MS call: ${sessionId}`);
                return;
            }

            // check if the direction is out and check if this is a consult transfer/conference call
            if (direction === 'out' && this.callLines.length > 0) {
                // its a conf/trasnfer call, store the sessionId ref
                this.tempCallRef = {
                    ...this.tempCallRef,
                    status: 'init',
                    sessionID: sessionId,
                    type: ''
                };
            }

            // register to all AV events
            connection.events.on('OnAVEvent', this.onAVEvent);

            // push the connection to the list
            this.avConns[sessionId] = connection;

            // add to call lines
            this.callLines.push(sessionId);

            // update the interaction status and user
            this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
                otherData: {
                    avConns: this.avConns,
                    callLines: this.callLines,
                    tempCallRef: this.tempCallRef
                }
            });

            // return the connection
            return connection;
        } catch (error) {
            this.logger.error('Error in createAVConnection', error);
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
                this.logger.info('onAVEvent.onTrace: ' + evt.data);
                break;
            case 'onError':
                this.logger.error('onAVEvent.onError', evt.data.code + '-' + evt.data.error);
                break;
            case 'onConnected':
                break;
            case 'onHoldUnhold':
                if (evt.data) {
                    // hold
                } else {
                    // unhold
                }
                break;
            case 'onDisconnected':
                // clear tone of disconnect on dial or incoming
                this._appUIService.clearAudio();
                break;
            case 'onCollectorStats':
                // update the mos value
                this.mos = evt.data.stats.audio.local.mos.toFixed(2);
                break;
            case 'onRemoteVideoAdded':
                // add the stream to reference
                this.msAudioStreams.push(evt.data);
                break;
            case 'onRemoteStreamEnded':
                // remove the stream from the reference
                this.msAudioStreams = this.msAudioStreams.filter((a) => a.streamInfo.id !== evt.data.streamInfo.id);
                break;
            case 'onEnd':
                // remove the av reference on end
                delete this.avConns[evt.sessionId];
                // get the index of session id from call line list
                const index = this.callLines.indexOf(evt.sessionId);
                // if found, then remove
                if (index > -1) {
                    this.callLines.splice(index, 1);
                }
                break;
            default:
            // console.log(`unhandled:: [${evt.event}]`, evt);
        }
    };

    /**
     * Process AV event
     * @method processEventAV
     *
     * @param {string} sessionId
     * @param {any} evt
     */
    private processEventAV(sessionId: string, evt: any): void {
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
                // get the index of session id from call line list
                const index = this.callLines.indexOf(sessionId);
                // if found, then remove
                if (index > -1) {
                    this.callLines.splice(index, 1);
                }
                // close the av connection
                this.avConns[sessionId]?.close();
                // check if the disconnect is for transfer/conference call
                if (sessionId === this.tempCallRef?.sessionID) {
                    this.tempCallRef = null;
                    // update the interaction manger
                    this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
                        otherData: {
                            tempCallRef: null,
                            callLines: this.callLines
                        }
                    });
                } else {
                    // update the interaction manger
                    this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
                        otherData: {
                            callLines: this.callLines
                        }
                    });
                }
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
            if (btn) {
                btn.disabled = true;
            }
        } else {
            // hide the progress bar
            this._fuseProgressBarService.hide();
            // enable button after response
            if (btn) {
                btn.disabled = false;
            }
        }
    }

    /**
     * Close interaction
     * @method closeInteraction
     * @param {MatButton} btn
     */
    private closeInteraction(btn: MatButton): void {
        this.toggleButton(true, btn);
        SDKClient.closeInteraction(this.interaction.InteractionID.toString(), null)
            .then((dt: IResponse) => {
                this.toggleButton(false, btn);
                if (dt.response && dt.response.ResultCode === 0) {
                    this._appUIService.showSnackbar('Interaction closed successfully');
                    // remove the interaction reference
                    this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                } else {
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
        SDKClient.disconnectCall(this.interaction.InteractionID.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                    if (this.widgetData.CloseInteractionOnEnd) {
                        this.closeInteraction(null);
                    }
                } else {
                    this.toggleButton(false, btn);
                    this._appUIService.showSnackbar('Disconnect call failed', 'failure');
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Disconnect call failed', 'failure');
                this.toggleButton(false, btn);
            });
    }

    /**
     * To handle conference mixer
     */
    private handleConferenceMixer(): void {
        // get the main line and conference line
        const mainLine = this.avConns[this.callLines[0]];
        const conferenceLine = this.avConns[this.tempCallRef.sessionID];

        // check if the referece is found, else return
        if (!mainLine || !conferenceLine) {
            this._appUIService.showSnackbar('Error in conference confirm, call lines are not available!');
            return;
        }

        // add the conference peer connection to the conference
        mainLine.addConference(conferenceLine.getPeerConnection());
    }

    /**
     * To set call flow
     * @param {TMACEventTypes} eventName
     */
    private setCallflow(eventName: TMACEventTypes): void {
        // for incoming or updated call ignore
        if (this.direction !== 'Out' || this.callUpdated) {
            return;
        }

        // set initial callflow for outgoing call event
        if (eventName === 'OutgoingCallEvent') {
            this.last4IVR[0] = 'Outbound';
            this.last4IVR[1] = this.callerID;
            this.last4IVR[2] = 'Ringing';
        }
        // set call connected for the last menu
        else if (eventName === 'CallConnectedEvent') {
            this.last4IVR[3] = 'Connected';
        }
        // call disconnected without connecting
        else if (!this.callConnected && eventName === 'CallDisconnectedEvent') {
            this.last4IVR[3] = 'Disconnected';
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * IncomingCallUpdateEvent handler
     * @param {IncomingCallUpdateEvent} evt
     */
    IncomingCallUpdateEvent(evt: IncomingCallUpdateEvent): void {
        // set the status
        this.status = 'incoming';

        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'incoming',
            user: this.callerID
        });

        /**
         * Set call updated to true
         */
        this.callUpdated = true;
    }

    /**
     * OutgoingCallEvent handler
     * @param {OutgoingCallEvent} evt
     */
    OutgoingCallEvent(evt: OutgoingCallEvent): void {
        // stop duration timer
        this.duration = 0;

        // set direction
        this.direction = 'Out';

        // set status
        this.status = 'outgoing';

        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'outgoing',
            user: this.callerID
        });

        // update the session id
        this.sessionID = evt.UCID;

        // if the phone number is changed to redial, update the number
        this.callerID = evt.PhoneNumber;

        // set the callflow
        this.setCallflow('OutgoingCallEvent');

        // set call connected to false for redial
        if (this.callConnected) {
            this.callConnected = false;
        }
    }

    /**
     * CallConnectedEvent handler
     * @param {CallConnectedEvent} evt
     */
    CallConnectedEvent(evt: CallConnectedEvent): void {
        // stop duration timer
        this.stopTimer.next(null);

        // subscribe to the timer
        timer(1000, 1000)
            .pipe(
                takeUntil(this.stopTimer),
                map(() => this.duration + 1)
            )
            .subscribe((val) => {
                this.duration = val;
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

        this.callConnected = true;

        // set the callflow
        this.setCallflow('CallConnectedEvent');
    }

    /**
     * CallDisconnectedEvent handler
     * @param {CallDisconnectedEvent} evt
     */
    CallDisconnectedEvent(evt: CallDisconnectedEvent): void {
        // clear audio if any
        this._appUIService.clearAudio();

        // set the status
        this.status = 'disconnected';

        // update the interaction status and user
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'disconnected'
        });

        // stop duration timer
        this.stopTimer.next(null);

        // clear confirm
        this.tempCallRef = null;

        // destroy the transfer/conf widget
        if (this.tranfConfWidget) {
            this._aotWidgetService.destroyWidget(this.tranfConfWidget.ID);
            this.tranfConfWidget = null;
        }

        // close all confirm dialogs
        this.dialogRef?.close();

        // set the call updated to false
        this.callUpdated = false;

        // set the callflow
        this.setCallflow('CallDisconnectedEvent');

        // set call connected to false
        this.callConnected = false;

        // close the av connections
        if (this.avConns?.length) {
            this.avConns.forEach((a) => {
                a.close();
            });
            this.avConns = [];
        }
    }

    /**
     * CallHoldEvent Handler
     * @param {CallHoldEvent} evt
     */
    CallHoldEvent(evt: CallHoldEvent): void {
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
    CallHoldReconnectEvent(evt: CallHoldReconnectEvent): void {
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
    CallTransferInitiatedEvent(evt: CallTransferInitiatedEvent): void {
        // show confirm/cancel buttons
        this.tempCallRef = {
            ...this.tempCallRef,
            status: 'init',
            type: 'transfer'
        };

        // update the interaction status and user
        this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
            otherData: {
                tempCallRef: this.tempCallRef
            }
        });

        // [MS: Jun 24, '21] commenting since we are calling transferBlind now
        // // for blind transfer to agent
        // if (!this.tempCallRef?.isConsult && this.tempCallRef?.source === 'agent') {
        //     this.confirmCallFn(true, null);
        // }
    }

    /**
     * CallTransferRemoteConnectedEvent Handler
     * @param {CallTransferRemoteConnectedEvent} evt
     */
    CallTransferRemoteConnectedEvent(evt: CallTransferRemoteConnectedEvent): void {
        // show confirm/cancel buttons
        this.tempCallRef = {
            ...this.tempCallRef,
            status: 'connected',
            type: 'transfer'
        };

        // update the interaction status and user
        this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
            otherData: {
                tempCallRef: this.tempCallRef
            }
        });
    }

    /**
     * CallTransferLineDisconnectEvent handler
     * @param {CallTransferLineDisconnectEvent} evt
     */
    CallTransferLineDisconnectEvent(evt: CallTransferLineDisconnectEvent): void {
        this.tempCallRef = null;

        // update the interaction status and user
        this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
            otherData: {
                tempCallRef: this.tempCallRef
            }
        });
    }

    /**
     * CallConferenceInitiatedEvent Handler
     * @param {CallConferenceInitiatedEvent} evt
     */
    CallConferenceInitiatedEvent(evt: CallConferenceInitiatedEvent): void {
        // show confirm/cancel buttons
        this.tempCallRef = {
            ...this.tempCallRef,
            status: 'init',
            type: 'conference'
        };

        // update the interaction status and user
        this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
            otherData: {
                tempCallRef: this.tempCallRef
            }
        });
    }

    /**
     * CallConferenceRemoteConnectedEvent Handler
     * @param {CallConferenceRemoteConnectedEvent} evt
     */
    CallConferenceRemoteConnectedEvent(evt: CallConferenceRemoteConnectedEvent): void {
        // show confirm/cancel buttons
        this.tempCallRef = {
            ...this.tempCallRef,
            status: 'connected',
            type: 'conference'
        };

        // for MS call and blind conference, do complete when conference line connected
        if (this.isMSCall && !this.tempCallRef?.isConsult) {
            this.confirmCallFn(true, null);
        }
    }

    /**
     * CallConferenceLineDisconnectEvent Handler
     * @param {CallConferenceLineDisconnectEvent} evt
     */
    CallConferenceLineDisconnectEvent(evt: CallConferenceLineDisconnectEvent): void {
        // remove the temp call reference
        this.tempCallRef = null;

        // for ms we need to change to connected state
        // and for mainline disconnect we need to change to connected sate
        if (this.isMSCall || evt.IsMainLine) {
            // since conference is handled in UI for MS calls, we cannot hold the call and unhold as it will cause state issue in UI
            // so we use mute/unmute instead

            // check if muted then unmute
            if (this.muted) {
                // get the connection
                const connection: AVChannel = this.avConns[this.callLines[0]];
                // un mute the call
                connection.unMute(true, false);
                // change the mute flag
                this.muted = false;
            }
            // set the status
            this.status = 'connected';
            // update the interaction status
            this._interactionManagerService.updateInteraction(evt.InteractionID, {
                status: 'connected'
            });
        }
    }

    /**
     * CallConferenceCompletedEvent Handler
     * @param {CallConferenceCompletedEvent} evt
     */
    CallConferenceCompletedEvent(evt: CallConferenceCompletedEvent): void {
        // for ms call
        if (this.isMSCall) {
            // get the connection variable for main line
            // since conference is handled in UI for MS calls, we cannot hold the call and unhold as it will cause state issue in UI
            // so we use mute/unmute instead

            // check if muted then unmute
            if (this.muted) {
                // so we use mute/unmute instead
                const connection: AVChannel = this.avConns[this.callLines[0]];
                // un mute the call
                connection.unMute(true, false);
                // change the mute flag
                this.muted = false;
            }
            // // do conference mixing
            this.handleConferenceMixer();
        }
        // else {
        // set the status
        this.status = 'connected';

        // update the interaction status
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            status: 'connected'
        });
        // }

        // set the temp call reference to null
        this.tempCallRef = null;
    }

    /**
     * MediaServerEvent Handler
     * @param {MediaServerEvent} evt
     */
    MediaServerEvent(evt: MediaServerEvent): void {
        try {
            // check the interaction
            if (evt.InteractionID !== this.interaction.InteractionID) {
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
                    this.processEventAV(evt.SessionID, JSON.parse(evt.Message));
                    break;
                default:
            }

            // get the connection based on session id
            connection = this.avConns[evt.SessionID];

            // check if the connection is added
            if (connection) {
                // check if the messages can be processed by WebRTC API, if not add to the reference and process after answer call
                if (this.processMediaMessages) {
                    // send the message to webclient api to process the av messages
                    connection.onMessage(evt.Message);
                } else {
                    this.mediaServerMessages.push(evt.Message);
                }
            }
        } catch (error) {
            this.logger.error('Error in MediaServerEvent', error);
        }
    }

    /**
     * VoiceCannedResponseEvent Handler
     * @param {VoiceCannedResponseEvent} evt
     */
    VoiceCannedResponseEvent(evt: {
        /**
         * Audio buffer from template
         */
        AudioBuffer: ArrayBuffer;
        /**
         * Interaction ID
         */
        InteractionID: number;
        /**
         * Agent interaction template ref
         */
        Item: AgentInteractionTemplate;
    }): void {
        // check if audio is playing already
        this.voiceControlsService.cannedAudioPlayer?.stop();

        // check the status of call
        // if (!this.callConnected) {
        //     this._appUIService.showSnackbar('Audio cannot be played when call is not connected!', 'failure');
        //     return;
        // }

        // get the connection based on session id and play the buffer
        this.voiceControlsService.cannedAudioPlayer = this.avConns[this.sessionID]?.playAudio(evt.AudioBuffer);

        // check if played
        if (!this.voiceControlsService.cannedAudioPlayer) {
            this._appUIService.showSnackbar(`Error in playing canned audio '${evt.Item.Name}'`, 'failure');
            return;
        }

        // append the name to audio player
        this.voiceControlsService.cannedAudioPlayer.fileName = evt.Item.Name;
        this.voiceControlsService.cannedAudioPlayer.fileId = evt.Item.Id;

        // set the state to playing
        this.voiceControlsService.cannedAudioPlayer._adpState = 'playing';

        // listen to onEnd
        this.voiceControlsService.cannedAudioPlayer.onEnd = () => {
            this.voiceControlsService.cannedAudioPlayer = null;
        };

        // show a success alert
        this._appUIService.showSnackbar(`Canned audio '${evt.Item.Name}' started playing`);

        // create custom event and send
        // SDKClient.events.emit('VoiceCannedResponseAckEvent', {
        //     SAudioPlayer: this._voiceControlServie.cannedAudioPlayer,
        //     Item: evt.Item
        // });
    }

    /**
     * CallerIntentEvent Handler
     * @param {CallerIntentEvent} evt
     */
    CallerIntentEvent(evt: CallerIntentEvent): void {
        // assign the intent name
        this.intent = evt.IntentName;
    }

    /**
     * IVRDataEvent Handler
     * @param {IVRDataEvent} evt
     */
    IVRDataEvent(evt: IVRDataEvent): void {
        this.last4IVR = [evt.LastMenu_4, evt.LastMenu_3, evt.LastMenu_2, evt.LastMenu];
    }

    /**
     * To handle InteractionDataEvent
     *
     * @param {InteractionDataEvent} evt
     */
    InteractionDataEvent(evt: InteractionDataEvent): void {
        // check the channel
        if (evt.Channel !== 'Voice') {
            return;
        }
        // check if interaction comments available
        if (evt.InteractionComments && evt.InteractionComments.length > 0) {
            this.commentsAdded = true;
            evt.InteractionComments.forEach((c) => {
                const dt = JSON.parse(c);
                this.savedComments.push({
                    Message: dt.Comment,
                    Time: dt.Time,
                    User: dt.User
                });
            });
        }
    }

    /**
     * To handle UUIDataEvent
     *
     * @param {UUIDataEvent} evt
     */
    UUIDataEvent(evt: UUIDataEvent): void {
        // check if language is provided
        if (evt.Language) {
            // check for english
            if (['1', 'e'].includes(evt.Language.toLowerCase().trim())) {
                this.language = 'English';
            }
        }

        const authType = evt.AuthType;
        // let verificationIcon = 'error';
        // let verificationIconType = 'danger';
        let verificationText = 'N/A';
        let verificationType = 'N/A';

        // check for auth type
        if (authType) {
            const isIdentified = authType.IsIdentified;
            const isVerified = authType.IsVerified;
            verificationType = authType.VerificationType;

            // verificationIcon = isVerified ? 'verified_user' : 'error';
            // verificationIconType = isVerified ? 'success' : 'danger';

            if (isVerified && isIdentified) {
                verificationText = 'Verified | Identified';
            } else if (!isVerified && isIdentified) {
                verificationText = 'Not Verified | Identified';
            } else if (!isVerified && !isIdentified) {
                verificationText = 'Not Verified | Not identified';
            }

            // if verified, then hide all not verifed menus from Ivr transfer
            if (isVerified) {
                this.ivrMenus = this.ivrMenus.filter((i) => i.Type === 'nv');
            }
        }
    }

    /**
     * To handle HoldTimerEvent
     *
     * @param {HoldTimerEvent} evt
     */
    HoldTimerEvent(evt: HoldTimerEvent): void {
        this._appUIService.showAppSnackbar({
            message: `Interaction ${this.interaction.InteractionID} with [${this.callerID}] and Session ID [${this.sessionID}] is on hold for ${evt.HoldTimeString}`,
            state: evt.ColorCode,
            onClick: () => {
                const interaction = this.interactionList.filter((i) => i.interactionId === evt.InteractionID)[0];
                if (interaction && !interaction?.isActive) {
                    this.selectInteraction(interaction, true);
                }
            }
        });
    }

    /**
     * Select Interaction
     * @method selectInteraction
     * @param {InteractionRef} item
     * @param {Boolean} force
     */
    public selectInteraction(item: InteractionRef, force?: boolean): void {
        // if same interaction is seleted then return
        if (!force && this.interaction.InteractionID === item.interactionId) {
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
    answerCall(btn: MatButton): void {
        // check if ms call then do not call api, just process the media server messages
        if (this.isMSCall) {
            // get the connection variable
            let connection: AVChannel = this.avConns[this.sessionID];
            // check if the connection found for session id
            if (!connection) {
                // get connection by first callLines
                connection = this.avConns[this.callLines[0]];
            }
            // check if the connection is there and media server messages are there
            if (connection && this.mediaServerMessages.length > 0) {
                // process the media server messages
                this.mediaServerMessages.forEach((item: string) => {
                    connection.onMessage(item);
                });
                // clear the array after processing
                this.mediaServerMessages = [];
            } else {
                this.logger.warn(`answerCall: AV connection is not found - ${this.sessionID}`);
            }
            // set the process media message to true for further messages
            this.processMediaMessages = true;
            return;
        }
        // toggle the button
        this.toggleButton(true, btn);
        SDKClient.answerCall(this.interaction.InteractionID.toString(), null).then((dt: IResponse) => {
            // toggle the button
            this.toggleButton(false, btn);
            // check for the response
            if (dt.response && dt.response.ResultCode === 0) {
                // answer call success
            } else {
                this._appUIService.showSnackbar('Answer call failed', 'failure');
            }
        });
    }

    /**
     * Confirm Call Disconnection
     * @method confirmDisconnectCall
     * @param {MatButton} btn
     */
    confirmDisconnectCall(btn: MatButton): void {
        // config force login
        this.dialogRef = this._appUIService.showAppConfirmDialog('endInteraction');
        this.dialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server
                this.disconnectCall(btn);
            }
        });
    }

    /**
     * To mute/un mute MS call
     * @method muteUnMuteCall
     */
    muteUnMuteCall(): void {
        // check if ms call then only process
        if (!this.isMSCall) {
            return;
        }

        // mute all call lines
        this.callLines.forEach((sessionId) => {
            // get the connection variable
            const connection: AVChannel = this.avConns[sessionId];
            // check the muted flag
            if (this.muted) {
                // un mute the call
                connection.unMute(true, false);
            } else {
                // mute the call
                connection.mute(true, false);
            }
        });

        // set the reference varaible
        this.muted = !this.muted;
    }

    /**
     * Hold Call
     * @method holdCall
     * @param {MatButton} btn
     */
    holdCall(btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // check if ms call then do not call api, invoke webclient api hold
        if (this.isMSCall) {
            // hold all call lines
            this.callLines.forEach((sessionId) => {
                // get the connection variable
                const connection: AVChannel = this.avConns[sessionId];
                // check if the connection is there and interaction is not on hold
                if (connection && this.status !== 'hold') {
                    connection.hold();
                }
            });
            return;
        }
        SDKClient.holdCall(this.interaction.InteractionID.toString(), null).then((dt: IResponse) => {
            // toggle the button
            this.toggleButton(false, btn);
            // check for the response
            if (dt.response && dt.response.ResultCode === 0) {
                // disconnect call success
            } else {
                this._appUIService.showSnackbar('Hold call failed', 'failure');
            }
        });
    }

    /**
     * Unhold Call
     * @param {MatButton} btn
     */
    unHoldCall(btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // check if ms call then do not call api, invoke webclient api hold
        if (this.isMSCall) {
            // unhold all call lines
            this.callLines.forEach((sessionId) => {
                // get the connection variable
                const connection: AVChannel = this.avConns[sessionId];
                // check if the connection is there and interaction is on hold
                if (connection && this.status === 'hold') {
                    connection.unHold();
                }
            });
            return;
        }
        SDKClient.unHoldCall(this.interaction.InteractionID.toString(), null).then((dt: IResponse) => {
            // toggle the button
            this.toggleButton(false, btn);
            // check for the response
            if (dt.response && dt.response.ResultCode === 0) {
                // disconnect call success
            } else {
                this._appUIService.showSnackbar('Unhold call failed', 'failure');
            }
        });
    }

    /**
     * Confirm Close Interaction
     * @method confirmCloseInteraction
     * @param {MatButton} btn
     */
    confirmCloseInteraction(btn: MatButton): void {
        // config force login
        this.dialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        this.dialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server
                this.closeInteraction(btn);
            }
        });
    }

    /**
     * To save interaction comments to server
     */
    saveInteractionComments(): void {
        let message = '';
        // check the saved comments
        this.savedComments.forEach((item) => {
            message += `
                 <div class="text-primary mat-body-2">${item.Message.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                 <span class="time muted-text mat-body-1">${item.User}</span>,
                 <span class="time muted-text mat-body-1">${new Date(item.Time).toLocaleString()}</span>
                 <br />
                 <br />
                 `;
        });
        message += 'Add new comment:';

        const dialogRef = this._appUIService.showCustomDialog(
            'prompt',
            message,
            'Interaction Comments',
            { minRows: 4 },
            {
                minWidth: '30%',
                maxWidth: '30%'
            }
        );
        dialogRef.afterClosed().subscribe((resp1) => {
            if (resp1) {
                this._fuseProgressBarService.show();
                SDKClient.saveInteractionComment({
                    comment: resp1,
                    interactionId: this.interaction.InteractionID.toString()
                })
                    .then((resp2) => {
                        // add comments to the reference
                        this.savedComments.push({
                            Message: resp1,
                            Time: new Date(),
                            User: SDKClient.getAgentData().agentName
                        });
                        if (resp2.response > 0) {
                            this._appUIService.showSnackbar('Interaction comment saved successfully');
                        } else {
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
    openTransferConferenceDialog(type: string): void {
        // const transferConfig = {
        //     agent: this.widgetData.Transfer?.Agent ?? null,
        //     skill: this.widgetData.Transfer?.Skill ?? null,
        //     speedDial: this.widgetData.Transfer?.SpeedDial ?? null
        // };

        // const conferenceConfig = {
        //     agent: this.widgetData.Conference?.Agent ?? null,
        //     skill: this.widgetData.Conference?.Skill ?? null,
        //     speedDial: this.widgetData.Conference?.SpeedDial ?? null
        // };

        // // get data based on type
        // let data: AgentSkillListData =
        //     type === 'transfer'
        //         ? {
        //               Title: 'Transfer Call',
        //               Type: 'transferCall',
        //               Agent: {
        //                   Allowed: transferConfig.agent?.Allowed,
        //                   Consult: transferConfig.agent?.Consult,
        //                   Blind: transferConfig.agent?.Blind,
        //                   Comments: transferConfig.agent?.Comments,
        //                   Source: transferConfig.agent?.Source,
        //                   AllowedStates: transferConfig.agent?.AllowedStates,
        //                   Columns: transferConfig.agent?.Columns,
        //                   TeamFilter: transferConfig.agent?.TeamFilter
        //               },
        //               Skill: {
        //                   Allowed: transferConfig.skill?.Allowed,
        //                   Consult: transferConfig.skill?.Consult,
        //                   Blind: transferConfig.skill?.Blind,
        //                   Comments: transferConfig.skill?.Comments,
        //                   Source: transferConfig.skill?.Source,
        //                   ChannelPrefix: transferConfig.skill?.ChannelPrefix,
        //                   Columns: transferConfig.skill?.Columns
        //               },
        //               SpeedDial: {
        //                   Allowed: transferConfig.speedDial?.Allowed,
        //                   Consult: transferConfig.speedDial?.Consult,
        //                   Blind: transferConfig.speedDial?.Blind,
        //                   Comments: transferConfig.speedDial?.Comments,
        //                   Source: transferConfig.speedDial?.Source,
        //                   Columns: transferConfig.speedDial?.Columns,
        //                   TeamFilter: transferConfig.speedDial?.TeamFilter
        //               }
        //           }
        //         : {
        //               Title: 'Conference Call',
        //               Type: 'conferenceCall',
        //               Agent: {
        //                   Allowed: conferenceConfig.agent?.Allowed,
        //                   Consult: conferenceConfig.agent?.Consult,
        //                   Blind: conferenceConfig.agent?.Blind,
        //                   Comments: conferenceConfig.agent?.Comments,
        //                   Source: conferenceConfig.agent?.Source,
        //                   AllowedStates: conferenceConfig.agent?.AllowedStates,
        //                   Columns: conferenceConfig.agent?.Columns,
        //                   TeamFilter: conferenceConfig.agent?.TeamFilter
        //               },
        //               Skill: {
        //                   Allowed: conferenceConfig.skill?.Allowed,
        //                   Consult: conferenceConfig.skill?.Consult,
        //                   Blind: conferenceConfig.skill?.Blind,
        //                   Comments: conferenceConfig.skill?.Comments,
        //                   Source: conferenceConfig.skill?.Source,
        //                   ChannelPrefix: conferenceConfig.skill?.ChannelPrefix,
        //                   Columns: conferenceConfig.skill?.Columns
        //               },
        //               SpeedDial: {
        //                   Allowed: conferenceConfig.speedDial?.Allowed,
        //                   Consult: conferenceConfig.speedDial?.Consult,
        //                   Blind: conferenceConfig.speedDial?.Blind,
        //                   Comments: conferenceConfig.speedDial?.Comments,
        //                   Source: conferenceConfig.speedDial?.Source,
        //                   Columns: conferenceConfig.speedDial?.Columns,
        //                   TeamFilter: conferenceConfig.speedDial?.TeamFilter
        //               }
        //           };

        // // add common properties
        // data = {
        //     ...data,
        //     InteractionId: this.interaction.InteractionID,
        //     OtherData: {
        //         isMSCall: this.isMSCall,
        //         avConns: this.avConns,
        //         callLines: this.callLines
        //     }
        // };

        // data.Callback = (callbackData) => {
        //     // assign the data
        //     this.tempCallRef = {
        //         ...this.tempCallRef,
        //         ...callbackData
        //     };

        //     // hold call on conference call success for MS calls
        //     if (data.Type === 'conferenceCall' && this.isMSCall) {
        //         // get the connection variable for main line
        //         // s conference is handled in UI for MS calls, we cannot hold the call and unhold as it will cause state issue in UI
        //         // so we use mute/unmute instead
        //         const connection: AVChannel = this.avConns[this.callLines[0]];
        //         // mute the call
        //         connection.mute(true, false);
        //         // mute flag
        //         this.muted = true;
        //         // change status for hold temp.
        //         this.status = 'hold';
        //         // update the interaction status
        //         this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
        //             status: 'hold'
        //         });
        //     }
        // };

        const transferConferenceConfig = {
            transfer: this.widgetData.Transfer ?? {},
            conference: this.widgetData.Conference ?? {}
        };

        let data: Partial<AgentSkillListData> = {
            InteractionId: this.interaction.InteractionID,
            OtherData: {
                isMSCall: this.isMSCall,
                avConns: this.avConns,
                callLines: this.callLines
            },
            Callback: (callbackData) => {
                // assign the data
                this.tempCallRef = {
                    ...this.tempCallRef,
                    ...callbackData
                };

                // hold call on conference call success for MS calls
                if (data.Type === 'conferenceCall' && this.isMSCall) {
                    // get the connection variable for main line
                    // s conference is handled in UI for MS calls, we cannot hold the call and unhold as it will cause state issue in UI
                    // so we use mute/unmute instead
                    const connection: AVChannel = this.avConns[this.callLines[0]];
                    // mute the call
                    connection.mute(true, false);
                    // mute flag
                    this.muted = true;
                    // change status for hold temp.
                    this.status = 'hold';
                    // update the interaction status
                    this._interactionManagerService.updateInteraction(this.interaction.InteractionID, {
                        status: 'hold'
                    });
                }
            }
        };

        if (type === 'transfer') {
            data = new AgentSkillListDataModel('transferCall', 'Transfer Call');
            data = { ...data, ...transferConferenceConfig.transfer };
        } else if (type === 'conference') {
            data = new AgentSkillListDataModel('conferenceCall', 'Conference Call');
            data = { ...data, ...transferConferenceConfig.conference };
        }

        this.dialogRef = this._matDialog.open(AgentSkillListComponent, {
            data,
            panelClass: ['agent-skill-dialog', 'twd-w-11/12', 'twd-h-10/12', 'lg:twd-w-7/12', 'lg:twd-h-8/12', 'xl:twd-w-6/12', '2xl:twd-w-5/12'],
            minWidth: '30%',
            maxWidth: '100%',
            disableClose: true
        });
    }

    /**
     * To hold/unhold MS consult call
     *
     * @param {MatButton} btn
     */
    holdUnholdMSConsultCall(btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // get the connection variable
        const connection: AVChannel = this.avConns[this.tempCallRef.sessionID];
        // check if the connection is there and interaction is not on hold
        if (connection && this.tempCallRef.status === 'connected') {
            connection.hold();
        } else if (connection && this.tempCallRef.status === 'hold') {
            connection.unHold();
        } else {
            this._appUIService.showSnackbar('Error in hold/unhold secondary call', 'failure');
        }
        setTimeout(() => {
            // toggle the button
            this.toggleButton(false, btn);
        }, 500);
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
        if (this.tempCallRef.type === 'transfer') {
            if (confirm) {
                // complete transfer in server
                SDKClient.transferComplete(this.interaction.InteractionID.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction transfer completed successfully');
                        } else {
                            this._appUIService.showSnackbar('Interaction transfer completion failed', 'failure');
                        }
                    })
                    .catch(() => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        this._appUIService.showSnackbar('Error in interaction transfer complete', 'failure');
                    });
            } else {
                SDKClient.transferCancel(this.interaction.InteractionID.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction transfer cancelled successfully');
                        } else {
                            this._appUIService.showSnackbar('Interaction transfer cancel failed', 'failure');
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
                // // handle conference mixer for MS calls
                // if (this.isMSCall) {
                //     this.handleConferenceMixer();
                // }

                // complete conference in server
                SDKClient.conferenceComplete(this.interaction.InteractionID.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction conference completed successfully');
                        } else {
                            this._appUIService.showSnackbar('Interaction conference completion failed');
                        }
                    })
                    .catch(() => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        this._appUIService.showSnackbar('Error in interaction conference complete', 'failure');
                    });
            } else {
                SDKClient.conferenceCancel(this.interaction.InteractionID.toString())
                    .then((dt) => {
                        // toggle the button
                        this.toggleButton(false, btn);
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Interaction conference cancel successful');
                        } else {
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

    /**
     * On dialpad clicked
     */
    dialpadClick(dtmfTone: any): void {
        // update dialed numbers
        this.dialedNumbers += dtmfTone.key;
        // check if MS call
        if (this.isMSCall) {
            // get the connection variable
            let connection: AVChannel = this.avConns[this.callLines[0]];
            // check if the connection found for session id
            if (this.callLines.length > 1) {
                // get connection by first callLines
                connection = this.avConns[this.callLines[this.callLines.length - 1]];
            }
            // check for conection again
            if (connection) {
                // send DTMF
                connection.sendDtmf(dtmfTone.value);
            } else {
                this._appUIService.showSnackbar('DTMF send failed, connection not available', 'failure');
            }
        } else {
            SDKClient.sendDTMF({
                interactionId: this.interaction.InteractionID.toString(),
                dtmf: dtmfTone.key
            })
                .then((x) => {
                    if (x.response && x.response.ResultCode === 0) {
                        // success
                    } else {
                        this._appUIService.showSnackbar('DTMF send failed', 'failure');
                    }
                })
                .catch(() => {
                    this._appUIService.showSnackbar('Error in sending DTMF', 'failure');
                });
        }
    }

    /**
     * To transfer call to IVR
     *
     * @param {String} type
     */
    async transferToIVR(value: string): Promise<void> {
        try {
            const { response } = await SDKClient.transferToIVR({
                interactionId: this.interaction.InteractionID.toString(),
                languageId: this.language,
                type: value
            });

            // check the response
            if (response.ResultCode === 0) {
                this._appUIService.showSnackbar('Transferred to IVR successfully');
            } else {
                this._appUIService.showSnackbar(response.ResultMessage, 'failure');
            }
        } catch (error) {
            console.error(error);
            this._appUIService.showSnackbar('Error in transfer to IVR', 'failure');
        }
    }

    /**
     * To check for number only
     * @param event input event
     */
    numberOnly(event: KeyboardEvent): boolean {
        if (event.key === '+' || !isNaN(Number(event.key))) {
            return true;
        }
        return false;
    }

    /**
     * To ppen make call dialog
     *
     */
    makeCall(): void {
        this.makeCallDialogRef = this._matDialog.open(this.MakeCallDialog, {
            panelClass: 'shared-dialog',
            maxWidth: '450px',
            disableClose: true
        });

        this.makeCallDialogRef.afterClosed().subscribe((res: boolean) => {
            if (res) {
                // make call to the provided number and complete the reminder
                SDKClient.makeCall({
                    interactionId: this.interaction.InteractionID.toString(),
                    number: this.callerID,
                    source: '',
                    sourceId: ''
                })
                    .then((dt) => {
                        if (dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar(`Make call to ${this.callerID} successful`);
                        } else {
                            this._appUIService.showSnackbar(`Make call failed, ${dt.response.ResultMessage}`, 'failure');
                        }
                    })
                    .catch((err) => {
                        this._appUIService.showSnackbar('Make call error', 'failure');
                        this.logger.error('Error in makeCall', err);
                    });
            }
        });
    }

    /**
     * To open SMS dialog
     */
    sendSMS(): void {
        const dialogRef = this._matDialog.open(TwComposeMessagingComponent, {
            panelClass: 'create-messaging-dialog',
            width: '500px',
            maxWidth: '100%',
            height: '350px',
            disableClose: true
        });

        const widget = new TwWidgetModel('Send SMS', 'tw-compose-messaging', 'sms');
        widget.Config.Actions = ['destroy'];
        widget.Data.Type = 'sms';
        widget.Data.Number = this.callerID;
        widget.InteractionDetails = this.interaction;
        widget.destroy = () => {
            dialogRef.close();
        };

        dialogRef.componentInstance.data = widget;
    }
}
