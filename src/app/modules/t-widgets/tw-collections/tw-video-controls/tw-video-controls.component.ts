import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { AotWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import * as _ from 'lodash';
import { timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AVChannel, AVEvent, SDKClient, TEnums, TextChatDisconnectedEvent, TUtils, IResponse } from 'tmac-sdk';
import { ConfirmDialogComponent } from '@modules/shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Component({
    selector: 'tw-video-controls',
    templateUrl: './tw-video-controls.component.html',
    styleUrls: ['./tw-video-controls.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwVideoControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    chatConfig: any;

    avConn: AVChannel;
    interactionId: number;
    sessionID: string;
    customerName: string;

    userList: any[] = [];


    startTime: Date;
    duration: number;
    mos = '0.00';
    status = 'initial';

    selfVideo: MediaStream;
    selfViewSmall: boolean;

    audioMuted: boolean;
    videoMuted: boolean;
    hold: boolean;
    screenSharing: boolean;
    remoteScreenSharing: boolean;

    @ViewChildren('remoteVideo') remoteVideoElements: QueryList<ElementRef>;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        private _aotWidgetService: AotWidgetService,
        private _dialog: MatDialog,
        private _fuseProgressBarService: FuseProgressBarService
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
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.fuseConfig = config;
                }
            );

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.appConfig = config;
                }
            );

        // assign the start time
        this.startTime = new Date();

        // add the widget data
        this.interactionId = this.data.InteractionDetails?.InteractionID;
        this.sessionID = this.data.InteractionDetails?.TextChatSessionID;
        this.avConn = this.data.Data?.AVConn;
        this.avConn?.events.on('onAVEvent', this.onAVEvent);
        this.customerName = this.data.Data?.CustomerName;
        this.chatConfig = this.data.Data?.Config || new Object();

        // listen to chat disconnected event to close the widget
        SDKClient.events.on('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.avConn?.events.off('onAVEvent', this.onAVEvent);
        SDKClient.events.off('TextChatDisconnectedEvent', this.TextChatDisconnectedEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private onAVEvent = (evt: AVEvent) => {
        // swtich the av events
        switch (evt.event) {
            case 'onTrace':
                TUtils.Logger.log(evt.data);
                break;
            case 'onError':
                TUtils.Logger.log('Exception in TwAudioControlsComponent.onAVEvent', evt.data);
                break;
            case 'onAVStats':
                this.status = evt.data;
                break;
            case 'onConnected':
                console.log('### Connected ###');
                // subscribe to the timer
                timer(1000, 1000)
                    .pipe(takeUntil(this.unsubscribeAll), takeUntil(this.unsubscribeAll))
                    .subscribe(val => {
                        this.duration = Math.floor((val + 1) % 3600 % 60) * 1000;
                    });
                break;
            case 'onSourceVideoAdded':
                // assign the local stream
                this.selfVideo = evt.data[0];
                break;
            case 'onRemoteVideoAdded':
                // check if the user connected is customer
                if (evt.data.streamInfo?.user === 'customer') {
                    evt.data.streamInfo.user = this.customerName;
                }
                else {
                    // other agent connected
                }
                // add the level
                evt.data.level = 0;
                // push to the list
                this.userList.push(evt.data);
                break;
            case 'onScreenshareStarted':
                this.screenSharing = true;
                break;
            case 'onScreenshareConnected':
                this.remoteScreenSharing = true;
                break;
            case 'onScreenshareEnded':
                this.screenSharing = false;
                break;
            case 'onScreenshareDisconnected':
                this.remoteScreenSharing = false;
                break;
            case 'onFail':
                // show the error
                if (evt.data.code === TEnums.WrcCodes.Rejected) {
                    this._appDataService.showMessage('Customer has rejected your request');
                }
                else {
                    this._appDataService.showMessage('Call failed: ' + evt.data.error);
                }
                // close the widget
                this.destroyWidget();
                break;
            case 'onDisconnected':
                console.log('### Disconnected ###');
                break;
            case 'onVoiceActivity':
                _.map(this.userList, (user: any) => {
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
                this._appDataService.showMessage('Customer has ended the call');
                // close the widget
                this.destroyWidget();
                break;
            default:
                console.log(`unhandled:: [${evt.event}]`, evt);
        }
    }

    private TextChatDisconnectedEvent = (evt: TextChatDisconnectedEvent) => {
        // check the interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }
        // close the widget
        this.destroyWidget();
    }

    private destroyWidget(): void {
        // close the audio call widget
        this._aotWidgetService.destroyWidget(this.data.ID);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    minimizeVideo(): void {
        this.selfViewSmall = !this.selfViewSmall;
    }

    muteAudioCall(): void {
        // check the muted flag
        if (this.audioMuted) {
            // un mute the call
            this.avConn.unMute(true, false);
        }
        else {
            // mute the call
            this.avConn.mute(true, false);
        }
        // set the reference varaible
        this.audioMuted = !this.audioMuted;
    }

    muteVideoCall(): void {
        // check the muted flag
        if (this.videoMuted) {
            // un mute the call
            this.avConn.unMute(false, true);
        }
        else {
            // mute the call
            this.avConn.mute(true, true);
        }
        // set the reference varaible
        this.videoMuted = !this.videoMuted;
    }

    shareScreen(): void {
        // check if to start or stop
        if (this.screenSharing) {
            // stop screen sharing
            this.avConn.stopScreenshare();
        }
        else {
            // start screen sharing
            this.avConn.startScreenshare();
        }
    }

    takeSnapShot(user: any): void {
        console.log(this.remoteVideoElements, user);
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
                const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
                    disableClose: false
                });
                confirmDialogRef.componentInstance.title = 'Confirm Snapshot';
                confirmDialogRef.componentInstance.message = `<img src="${base64}" width="640" height="320" />`;
                confirmDialogRef.afterClosed().subscribe((dialogResult) => {
                    if (dialogResult) {
                        this._fuseProgressBarService.show();
                        // send snapshot
                        SDKClient.saveVideoSnap({
                            base64,
                            email: '',
                            interactionId: this.interactionId.toString(),
                            name: this.customerName,
                            nric: this.data.InteractionDetails.NRIC || '',
                            phone: this.data.InteractionDetails.RegNo1 || '',
                            sessionId: this.sessionID
                        }, null)
                            .then((result: IResponse) => {
                                this._fuseProgressBarService.hide();
                                if (result.response && result.response.ImageUrl) {
                                    // snapsot saved sucessfully
                                    this._appDataService.showMessage('Snapshot saved successfully!');
                                }
                                else {
                                    this._appDataService.showMessage('Snapshot save failed!');
                                }
                            })
                            .catch(() => {
                                this._fuseProgressBarService.hide();
                                this._appDataService.showMessage('Error in saving snapshot!');
                            });
                    }
                });
            }
        });
    }

    holdCall(): void {
        // check the muted flag
        if (this.hold) {
            // un hold the call
            this.avConn.unHold();
        }
        else {
            // hold the call
            this.avConn.hold();
        }
        // set the reference varaible 
        this.hold = !this.hold;
    }

    endCall(): void {
        // end the call
        // if there is only customer then endCall else dropCall
        if (this.userList.length > 1) {
            this.avConn.dropCall('');
        }
        else {
            this.avConn.endCall(TEnums.WrcCallTypes.Audio, '');
        }
        // close the widget
        this.destroyWidget();
    }
}

// for more info visit - https://angular.io/api/core
