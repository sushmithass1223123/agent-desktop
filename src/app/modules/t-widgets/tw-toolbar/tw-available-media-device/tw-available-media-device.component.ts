import { Component, ElementRef, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

type AvailableDevices = {
    /**
     * Availabble mics
     */
    Mic: MediaDeviceInfo[];
    /**
     * Available speakers
     */
    Speaker: MediaDeviceInfo[];
    /**
     * Available video inputs
     */
    Video: MediaDeviceInfo[];
};

/**
 * Available media devices component
 * - lets user choose their mic / speaker / video input
 */
@Component({
    selector: 'tw-available-media-device',
    templateUrl: './tw-available-media-device.component.html',
    styleUrls: ['./tw-available-media-device.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAvailableMediaDeviceComponent implements OnInit {
    /**
     * Available devices Dialog ref
     */
    @ViewChild('availableDevicesMenu')
    availableDevicesMenu: TemplateRef<HTMLDivElement>;

    /**
     * Media devices info as observable
     */
    mediaDeviceInfo: {
        /**
         * Device list
         */
        devices?: AvailableDevices;
        /**
         * error messages
         */
        error: string;
        /**
         * loading flag
         */
        loading: string;
    } = {
            error: '',
            loading: ''
        };

    /**
     * Audio / Video streams
     */
    stream: MediaStream;

    /**
     * Media select formGroup
     */
    mediaSelectFormGroup = new FormGroup({
        Mic: new FormControl(''),
        Speaker: new FormControl(''),
        Video: new FormControl('')
    });

    /**
     * Video stream dom element
     */
    @ViewChild('videoStream')
    videoStream: ElementRef<HTMLMediaElement>;

    constructor(private matDialog: MatDialog) { }

    /**
     * Lifecycle hook
     */
    async ngOnInit(): Promise<void> {
        this.mediaSelectFormGroup = new FormGroup({
            Mic: new FormControl(''),
            Speaker: new FormControl(''),
            Video: new FormControl('')
        });
        const { Speaker, Mic, Video } = await this.selectDevice();

        this.mediaSelectFormGroup.controls.Mic.valueChanges.subscribe((res) => Mic(res));
        this.mediaSelectFormGroup.controls.Speaker.valueChanges.subscribe((res) => Speaker(res));
        this.mediaSelectFormGroup.controls.Video.valueChanges.subscribe((res) => Video(res));
    }

    /**
     * Opens available devices dialog
     */
    async showAvailableDevices(): Promise<void> {
        try {
            await this.setAvailableDevices();
            this.startVideo({ audio: true, video: true });
            this.matDialog
                .open(this.availableDevicesMenu, {
                    width: '50%',
                    panelClass: 'available-media-dialog'
                })
                .afterClosed()
                .subscribe(() => {
                    this.stream.getTracks()
                        .forEach(track => {
                            track.stop();
                        });
                });
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Sets available devices to mediaDeviceInfo
     */
    async setAvailableDevices(retry?: boolean): Promise<void> {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.log('enumerateDevices() not supported.');
                return;
            }
            this.setComponentState('availableDevices/fetching');
            const res = await navigator.mediaDevices.enumerateDevices();
            this.mediaDeviceInfo.devices = res.reduce(
                (acc, curr) => {
                    let type = '';
                    if (curr.kind.includes('audio')) {
                        if (curr.kind.includes('input')) {
                            acc.Mic.push(curr);
                            type = 'Mic';
                        } else {
                            acc.Speaker.push(curr);
                            type = 'Speaker';
                        }
                    } else if (curr.kind.includes('video')) {
                        acc.Video.push(curr);
                        type = 'Video';
                    }
                    if (curr.deviceId === 'default') {
                        this.mediaSelectFormGroup.patchValue({ [type]: curr.deviceId });
                    }
                    return acc;
                },
                { Mic: [], Speaker: [], Video: [] }
            );
            this.setComponentState('availableDevices/loaded');
        } catch (e) {
            console.error(e);
            this.setComponentState('availableDevices/error');
        }
    }

    /**
     * Selects media device
     * @param {String} type
     * @param {String} deviceId
     */
    async selectDevice(): Promise<Record<keyof AvailableDevices, (deviceId?: string) => void>> {
        const common = () => {
            const constraints: MediaStreamConstraints = {};
            if (this.stream) {
                this.stream.getTracks().forEach((track) => track.stop());
            }
            constraints.audio = { deviceId: this.mediaSelectFormGroup.value.Audio };
            constraints.video = { deviceId: this.mediaSelectFormGroup.value.Video };
            this.startVideo(constraints);
        };
        const Speaker = (deviceId?: string) => {
            if (this.videoStream) {
                const videoEl = this.videoStream.nativeElement as any;
                if (videoEl.setSinkId) {
                    (videoEl.setSinkId(deviceId) as Promise<void>)
                        .then(() => console.log('Sink id set successsfully'))
                        .catch((e) => {
                            console.error(e);
                        });
                } else {
                    console.error('videoEl.setSinkId not supported !');
                }
            }
        };

        return { Mic: common, Video: common, Speaker };
    }

    /**
     * Starts video
     */
    async startVideo(constraints: MediaStreamConstraints): Promise<void> {
        const media = await navigator.mediaDevices.getUserMedia(constraints);
        media.getVideoTracks().forEach((track) => {
            Object.entries(this.mediaDeviceInfo.devices).forEach((deviceGroup) => {
                deviceGroup[1].forEach((device) => {
                    if (device.deviceId === track.getCapabilities().deviceId && !this.mediaSelectFormGroup.get(deviceGroup[0]).value) {
                        this.mediaSelectFormGroup.patchValue({ [deviceGroup[0]]: device.deviceId });
                    }
                });
            });
        });
        this.stream = media;
    }

    /**
     * Sets component state
     * @param error
     * @param loading
     */
    setComponentState(state: 'availableDevices/fetching' | 'availableDevices/retrying' | 'availableDevices/error' | 'availableDevices/loaded'): void {
        switch (state) {
            case 'availableDevices/error':
                this.mediaDeviceInfo.error = 'Something went wrong';
                this.mediaDeviceInfo.loading = '';
                break;
            case 'availableDevices/fetching':
                this.mediaDeviceInfo.error = '';
                this.mediaDeviceInfo.loading = 'Loading available devices ..';
                break;
            case 'availableDevices/retrying':
                this.mediaDeviceInfo.error = '';
                this.mediaDeviceInfo.loading = 'Reloading available devices';
                break;
            case 'availableDevices/loaded':
                this.mediaDeviceInfo.error = '';
                this.mediaDeviceInfo.loading = '';
                break;
        }
    }
}
