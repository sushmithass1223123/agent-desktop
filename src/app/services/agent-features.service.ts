import { Injectable } from '@angular/core';
import { AgentFeatures, SDKClient, TUtils } from 'tmac-sdk';
import { AppDataService } from './app-data.service';
import { AppUiService } from './app-ui.service';
declare const navigator: Navigator | any;

@Injectable({
    providedIn: 'root'
})
export class AgentFeaturesService {

    private _processed: boolean;

    private _agentFeatureInfo: {
        permissions: {
            camera: boolean;
            display: boolean;
            location: boolean;
        },
        data: {
            cameraStream: MediaStream,
            displayStream: MediaStream,
            location: {
                latitude: number;
                longitude: number;
            };
        }
    };

    constructor(
        private _appDataService: AppDataService,
        private _appUIService: AppUiService
    ) {
        this._agentFeatureInfo = {
            permissions: {
                camera: false,
                display: false,
                location: false
            },
            data: {
                cameraStream: null,
                displayStream: null,
                location: null
            }
        };

        // listen to AgentSnapShotEvent
        SDKClient.events.on('AgentSnapShotEvent', this.AgentSnapShotEvent);
    }

    private AgentSnapShotEvent = async (evt: any) => {
        // init variables
        let screenshot = '';
        let snapshot = '';
        let screenvideo = '';
        let location = '';

        // get the snapshot
        if (evt.Camera && this._agentFeatureInfo.permissions.camera) {
            snapshot = await this.getUrlFromStream('snapshot');
        }

        // get the screenshot
        if (evt.ScreenShot && this._agentFeatureInfo.permissions.display) {
            screenshot = await this.getUrlFromStream('screenshot');
        }

        // get the screenvideo
        if (evt.ScreenVideo) {
            screenvideo = '';
        }

        // get the location
        if (evt.Location && this._agentFeatureInfo.permissions.location) {
            location = JSON.stringify(this._agentFeatureInfo.data.location);
        }

        // send the response to SDK
        SDKClient.sendAgentActivity({
            requestId: evt.RequestId,
            consent: false,
            location,
            screenshot,
            screenvideo,
            snapshot
        });
    }

    private async getUrlFromStream(type: string): Promise<string> {
        // media stream reference
        let stream: MediaStream;

        // check the type
        if (type === 'screenshot') {
            stream = this._agentFeatureInfo.data.displayStream;
        }
        else if (type === 'snapshot') {
            stream = this._agentFeatureInfo.data.cameraStream;
        }

        return new Promise((resolve, reject) => {
            try {
                // create a video element
                const video = document.createElement('video');
                // autoplay
                video.autoplay = true;
                // mte the video
                video.muted = true;
                // assign the stream
                video.srcObject = stream;
                // listen to play event
                video.onplay = () => {
                    // create canvas
                    const canvas = document.createElement('canvas');
                    // set canvas width and height
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    // get context of canvas, used to draw on canvas
                    const context = canvas.getContext('2d');
                    // draw video's current image on canvas
                    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

                    // return the canvas url
                    resolve(canvas.toDataURL());
                };
            } catch (error) {
                // log the error to server for troubleshooting purpose
                TUtils.Logger.log('Exception in getUrlFromStream', error);
                reject(error);
            }
        });
    }

    private captureCameraStream(): void {
        // check if the permission got
        if (!SDKClient.getAgentData().isLoggedIn || this._agentFeatureInfo.permissions.camera) {
            return;
        }

        // capture selfview
        navigator.getUserMedia(
            {
                audio: false,
                video: true
            },
            (stream: MediaStream) => {
                stream.getVideoTracks()[0].onended = () => {
                    this._agentFeatureInfo.permissions.camera = false;
                    this._appUIService.showSnackbar('Ended: Please give access to the camera for supervisor', 'failure');
                    setTimeout(() => {
                        this.captureCameraStream();
                    }, 1000);
                };
                this._agentFeatureInfo.permissions.camera = true;
                // save the stream to reference
                this._agentFeatureInfo.data.cameraStream = stream;
            },
            (error: MediaStreamError) => {
                this._agentFeatureInfo.permissions.camera = false;
                this._appUIService.showSnackbar('Error: Please give access to the camera for supervisor', 'failure');
                setTimeout(() => {
                    this.captureCameraStream();
                }, 4000);
                // log the error to server for troubleshooting purpose
                TUtils.Logger.log('Exception in getUserMedia', error);
            }
        );
    }

    private captureDisplayStream(): void {
        // check if the permission got
        if (!SDKClient.getAgentData().isLoggedIn || this._agentFeatureInfo.permissions.display) {
            return;
        }

        // get screen recording stream
        navigator.mediaDevices.getDisplayMedia()
            .then((stream: any) => {
                stream.getVideoTracks()[0].onended = () => {
                    this._agentFeatureInfo.permissions.display = false;
                    this._appUIService.showSnackbar('Ended: Please share your entire screen for supervisor', 'failure');
                    setTimeout(() => {
                        this.captureDisplayStream();
                    }, 1000);
                };
                // get the display surface
                const displaySurface = stream.getVideoTracks()[0].getSettings().displaySurface;
                // check if the user shared entire screen
                if (displaySurface !== 'monitor') {
                    // get the shared strean video tracks and stop
                    stream.getVideoTracks().forEach((track: MediaStreamTrack) => {
                        track.stop();
                    });
                    // throw an error
                    throw new MediaStreamError();
                }
                this._agentFeatureInfo.permissions.display = true;
                // save the stream to reference
                this._agentFeatureInfo.data.displayStream = stream;
            })
            .catch((error: MediaStreamError) => {
                this._agentFeatureInfo.permissions.display = false;
                this._appUIService.showSnackbar('Error: Please share your entire screen for supervisor', 'failure');
                setTimeout(() => {
                    this.captureDisplayStream();
                }, 2000);
                // log the error to server for troubleshooting purpose
                TUtils.Logger.log('Exception in getDisplayMedia', error);
            });
    }

    private captureLocation(): void {
        // get geolocation
        navigator.geolocation.getCurrentPosition(
            // success
            (location: Position) => {
                this._agentFeatureInfo.permissions.location = true;
                // get location from browser and save the stream to reference
                this._agentFeatureInfo.data.location = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };
            },
            (error: PositionError) => {
                this._agentFeatureInfo.permissions.location = false;
                // log the error to server for troubleshooting purpose
                TUtils.Logger.log('Exception in getCurrentPosition', error);
            });
    }

    public processAgentFeatures(): void {
        TUtils.Logger.console('log', 'processAgentFeatures');
        // get the agent features from SDK
        const agentFeatures = SDKClient.getAgentData().featuresList;
        // check the list
        if (agentFeatures.length === 0) {
            TUtils.Logger.log('processAgentFeatures: agent features are empty!');
            return;
        }
        // loop through the features and process
        agentFeatures.forEach((feature: AgentFeatures) => {
            switch (feature.Feature) {
                case 'IsCameraCaptureEnabled':
                    // check if enabled, then capture camera
                    if (feature.IsEnabled) {
                        this.captureCameraStream();
                    }
                    break;
                case 'IsScreenCaptureEnabled':
                    // check if enabled, then capture camera
                    if (feature.IsEnabled) {
                        this.captureDisplayStream();
                    }
                    break;
                case 'IsLocationEnabled':
                    // check if enabled, then capture camera
                    if (feature.IsEnabled) {
                        this.captureLocation();
                    }
                    break;
                default:
            }

            // set processed
            this._processed = true;
        });
    }

    public clearAgentFeatures(): void {
        // unregister from AgentSnapShotEvent
        SDKClient.events.off('AgentSnapShotEvent', this.AgentSnapShotEvent);

        // check if processed
        if (this._processed) {
            // clear camera stream
            if (this._agentFeatureInfo.permissions.camera) {
                this._agentFeatureInfo.data.cameraStream.getTracks().forEach((track: MediaStreamTrack) => {
                    track.stop();
                });
            }

            // clear display stream
            if (this._agentFeatureInfo.permissions.display) {
                this._agentFeatureInfo.data.displayStream.getTracks().forEach((track: MediaStreamTrack) => {
                    track.stop();
                });
            }
        }
    }
}
