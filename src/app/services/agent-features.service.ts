import { Injectable } from '@angular/core';
import { TUtils, SDKClient, AgentFeatures, IResponse } from 'tmac-sdk';
import { AppDataService } from './app-data.service';
declare const navigator: Navigator | any;

@Injectable({
    providedIn: 'root'
})
export class AgentFeaturesService {

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
        private _appDataService: AppDataService
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

    private AgentSnapShotEvent = (evt: any) => {

        SDKClient.sendAgentActivity({
            consent: false,
            location: evt.Location ? JSON.stringify(this._agentFeatureInfo.data.location) : '',
            requestId: evt.RequestId,
            screenshot: evt.ScreenShot ? this.getUrlFromStream('screenshot') : '',
            screenvideo: evt.ScreenVideo ? '' : '',
            snapshot: evt.Camera ? this.getUrlFromStream('snapshot') : ''
        });
    }

    private getUrlFromStream(type: string): string {
        try {
            let stream: MediaStream;
            let width: number;
            let height: number;

            // check the type
            if (type === 'screenshot') {
                stream = this._agentFeatureInfo.data.displayStream;
                width = screen.width;
                height = screen.height;
            }
            else if (type === 'snapshot') {
                stream = this._agentFeatureInfo.data.cameraStream;
                width = 640;
                height = 320;
            }

            // create a video element
            const video = document.createElement('video');
            // assign the stream
            video.srcObject = stream;
            // create canvas
            const canvas = document.createElement('canvas');
            // set width and height of canvas as same as screenshot video
            canvas.width = screen.width;
            canvas.height = screen.height;
            // get context of canvas, used to draw on canvas
            const ctx = canvas.getContext('2d');
            // draw screenshot video's current image on canvas
            ctx.drawImage(video, 0, 0, screen.width, screen.height);
            // return canvas base64 string having screenshot image
            return canvas.toDataURL('image/jpeg');
        }
        catch (error) {
            // log the error to server for troubleshooting purpose
            TUtils.Logger.log('Exception in getUrlFromStream', error);
        }
        return '';
    }

    private captureCameraStream(): void {
        // capture selfview
        navigator.getUserMedia(
            {
                audio: false,
                video: true
            },
            (stream: MediaStream) => {
                stream.getVideoTracks()[0].onended = () => {
                    this._agentFeatureInfo.permissions.camera = false;
                    this._appDataService.showMessage('Ended: Please give access to the camera for supervisor');
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
                this._appDataService.showMessage('Error: Please give access to the camera for supervisor');
                setTimeout(() => {
                    this.captureCameraStream();
                }, 4000);
                // log the error to server for troubleshooting purpose
                TUtils.Logger.log('Exception in getUserMedia', error);
            }
        );
    }

    private captureDisplayStream(): void {
        // get screen recording stream
        navigator.mediaDevices.getDisplayMedia()
            .then((stream: any) => {
                stream.getVideoTracks()[0].onended = () => {
                    this._agentFeatureInfo.permissions.display = false;
                    this._appDataService.showMessage('Ended: Please share your entire screen for supervisor');
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
                this._appDataService.showMessage('Error: Please share your entire screen for supervisor');
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
        });
    }
}
