import { Component, ElementRef, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { IWrsUtils, TUtils } from '@tmac/sdk';
import { TranslocoService } from '@jsverse/transloco';
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
export class TwAvailableMediaDeviceComponent extends TWidgetWrapper implements OnInit {
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
    mediaSelectFormGroup = new UntypedFormGroup({
        Mic: new UntypedFormControl(''),
        Speaker: new UntypedFormControl(''),
        Video: new UntypedFormControl('')
    });

    /**
     * Video stream dom element
     */
    @ViewChild('videoElm')
    videoElm: ElementRef<HTMLMediaElement>;

    constructor(private matDialog: MatDialog,
        private translocoService: TranslocoService) {
        super('TwAvailableMediaDeviceComponent');
    }

    /**
     * Lifecycle hook
     */
    async ngOnInit(): Promise<void> {
        this.mediaSelectFormGroup = new UntypedFormGroup({
            Mic: new UntypedFormControl(''),
            Speaker: new UntypedFormControl(''),
            Video: new UntypedFormControl('')
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
            this.stream = null;
            await this.setAvailableDevices();
            this.startVideo({ audio: true, video: true });
            this.matDialog
                .open(this.availableDevicesMenu, {
                    width: '50%',
                    panelClass: 'available-media-dialog'
                })
                .beforeClosed()
                .subscribe(() => {
                    this.stream?.getTracks().forEach((track) => {
                        track.stop();
                        this.stream.removeTrack(track);
                    });
                });
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Sets available devices to mediaDeviceInfo
     */
    async setAvailableDevices(): Promise<void> {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                this.logger.error('Error in setAvailableDevices', 'enumerateDevices() not supported', false);
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
            this.setComponentState('availableDevices/error', 'Unable to load availabloe devices');
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
            if (this.videoElm) {
                const videoEl = this.videoElm.nativeElement as any;
                if (videoEl.setSinkId) {
                    (videoEl.setSinkId(deviceId) as Promise<void>)
                        .then(() => console.log('Sink id set successfully'))
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
        const wrsUtils = TUtils.Generic.wrsUtils<IWrsUtils>();
        if (wrsUtils) {
            this.stream = await wrsUtils.getUserMedia(constraints, null);
            this?.stream.getVideoTracks().forEach((track) => {
                Object.entries(this.mediaDeviceInfo.devices).forEach((deviceGroup) => {
                    deviceGroup[1].forEach((device) => {
                        if (device.deviceId === track.getCapabilities().deviceId && !this.mediaSelectFormGroup.get(deviceGroup[0]).value) {
                            this.mediaSelectFormGroup.patchValue({ [deviceGroup[0]]: device.deviceId });
                        }
                    });
                });
            });
        } else {
            this.setComponentState('availableDevices/error', this.translocoService.translate('toolbarComponent.videoStartErrorMessage'));
        }
    }

    /**
     * Sets component state
     * @param error
     * @param loading
     */
    setComponentState(
        state: 'availableDevices/fetching' | 'availableDevices/retrying' | 'availableDevices/error' | 'availableDevices/loaded',
        msg?: string
    ): void {
        switch (state) {
            case 'availableDevices/error':
                if (!msg) {
                    msg = this.translocoService.translate('global.commonErrorMessage');
                }
                this.mediaDeviceInfo.error = msg;
                this.mediaDeviceInfo.loading = '';
                break;
            case 'availableDevices/fetching':
                this.mediaDeviceInfo.error = '';
                this.mediaDeviceInfo.loading = this.translocoService.translate('toolbarComponent.loadingAvailableDevices');
                break;
            case 'availableDevices/retrying':
                this.mediaDeviceInfo.error = '';
                this.mediaDeviceInfo.loading = this.translocoService.translate('toolbarComponent.reloadingAvailableDevices');
                break;
            case 'availableDevices/loaded':
                this.mediaDeviceInfo.error = '';
                this.mediaDeviceInfo.loading = '';
                break;
        }
    }
}
