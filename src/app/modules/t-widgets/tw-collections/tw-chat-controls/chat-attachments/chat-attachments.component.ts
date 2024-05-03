import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { FileSaveData, SDKClient, TUtils } from '@tmac/sdk';
import { MediaStreamerResponse } from 'app/interfaces';
import { TranslocoService } from '@ngneat/transloco';
/**
 * Chat attachment module
 */
@Component({
    selector: 'chat-attachments',
    templateUrl: './chat-attachments.component.html',
    styleUrls: ['./chat-attachments.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ChatAttachmentsComponent implements OnInit, AfterViewInit, OnDestroy {
    /**
     * File upload Url
     */
    @Input() fileUploadUrl: any;
    /**
     * Session ID
     */
    @Input() sessionID: string;
    /**
     * Is SMM flag
     */
    @Input() isSMM: boolean;
    /**
     * Type of attachment previw
     */
    @Input() attachPreviewMode: string;
    /**
     * Event emitter to close the attachments
     */
    @Output() closeAttachments = new EventEmitter();
    /**
     * Event emitter to send attachments
     */
    @Output() sendAttachments = new EventEmitter();

    /**
     * Accepted types
     */
    attachAcceptTypes = '';
    /**
     * Self media stream
     */
    selfVideo: MediaStream;
    /**
     * Face login video element
     */
    @ViewChild('camera', { static: false }) selfVideoElm: ElementRef;
    /**
     * File upload input
     */
    @ViewChild('attachFileRef', { static: false }) attachFileRef: ElementRef;
    /**
     * Files currently uploadeng
     */
    uploadingFiles: {
        /**
         * Uploading file
         */
        file: File;
        /**
         * Name of file
         */
        fileName: string;
        /**
         * Base64 string of file
         */
        base64: string;
        /**
         * Size of file
         */
        size: number;
        /**
         * File type extension
         */
        type: string;
        /**
         * File extension
         */
        ext: string;
    }[] = [];


    constructor(private _appUIService: AppUiService, private _fuseProgressBarService: FuseProgressBarService,
        private translocoService: TranslocoService) {}

    /**
     * On init
     */
    ngOnInit(): void {
        // add accept type for file input
        this.attachAcceptTypes = this.attachPreviewMode === 'uploadMedia' ? 'image/*,video/mp4,video/3gpp,video/quicktime' : '*';
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void {
        // check the mode
        if (this.attachPreviewMode.includes('upload')) {
            // trigger in timeout so that accept file input is changed
            setTimeout(() => {
                this.attachFileRef.nativeElement.click();
            });
        } else if (this.attachPreviewMode === 'camera') {
            // open camera to take a picture
            this.attachPreviewMode = 'camera';
            // start camera
            this.startCamera();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this.stopCamera();
        this.uploadingFiles = [];
        this.attachPreviewMode = '';
    }

    /**
     * To get type by file type
     *
     * @param {string} fileType
     */
    private getAttachTypeByFileType(fileType: string): string {
        // append default type file
        let type = 'file';
        // get the type and check
        if (fileType.includes('image')) {
            type = 'image';
        } else if (fileType.includes('video')) {
            type = 'video';
        } else if (fileType.includes('audio')) {
            type = 'audio';
        }
        return type;
    }

    /**
     * To start camera
     */
    startCamera(): void {
        // capture selfview
        navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: true
            })
            .then((stream: MediaStream) => {
                this.selfVideo = stream;
            })
            .catch(function (err) {
                this._appUIService.showSnackbar(err.message, 'failure');
            });
    }

    /**
     * Attach files to email
     * @param {Event} evt
     */
    async onFileInput(evt: Event): Promise<void> {
        try {
            const input = evt.target as HTMLInputElement;
            if (input.files && input.files.length) {
                if(this.attachPreviewMode === 'uploadMedia') {
                    const fileMime = input.files[0].type.split('/');
                    if(!['video', 'image'].includes(fileMime[0])) {
                        const dynamicLabels = [
                            {
                                key: '#fileType',
                                value: fileMime[1]
                            }
                        ]
                        this._appUIService.showSnackbar(
                            this.getUpdatedLabel(this.translocoService.translate('widgets.chatAttachments.invalidType'), dynamicLabels),
                            'warning'
                        );
                        return;
                    }
                }
                const base64 = await this.convertToBase64(input.files[0]);
                const fileName = input.files[0].name;
                this.uploadingFiles.push({
                    file: input.files[0],
                    fileName,
                    base64,
                    size: input.files[0].size,
                    type: input.files[0].type,
                    ext: fileName.split('.').pop()
                });

                this.attachPreviewMode = 'preview';
            }
        } catch (e) {
            console.error(e);
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
        }
    }

    getUpdatedLabel(msg, labels = []) {
        let updatedLabel = msg;
        labels?.forEach(ele => {
            updatedLabel = updatedLabel.replace(ele.key, ele.value);
        });
        return updatedLabel;
    }

    /**
     * Convert file to base64
     * @param {File} file
     */
    async convertToBase64(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    /**
     * To take the photo
     */
    async takePhoto(): Promise<void> {
        // create a canvas
        const canvas = document.createElement('canvas');
        // scale the canvas accordingly
        canvas.width = this.selfVideoElm?.nativeElement.videoWidth;
        canvas.height = this.selfVideoElm?.nativeElement.videoHeight;
        // get the context
        const ctx = canvas.getContext('2d');
        // translate the image
        ctx.translate(canvas.width, 0);
        // scale the image
        ctx.scale(-1, 1);
        // draw the canvas
        ctx.drawImage(this.selfVideoElm?.nativeElement, 0, 0, canvas.width, canvas.height);
        // get base64 url
        const base64 = canvas.toDataURL();
        // create new file name
        const fileName = `image_${new Date().getTime()}.png`;
        const size = Math.round(4 * Math.ceil(base64.length - 'data:image/png;base64,'.length / 3) * 0.5624896334383812);

        // create file from base64
        const res: Response = await fetch(base64);
        const blob: Blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/png' });

        // push to uploadfiles
        this.uploadingFiles.push({
            file,
            fileName,
            base64,
            size: size,
            type: 'image',
            ext: 'png'
        });

        // change the mode to upload to preview the taken image
        this.attachPreviewMode = 'previewCapture';

        // stop camera
        this.stopCamera();
    }

    /**
     * To retake photo
     */
    retakePhoto(): void {
        // change the mode to upload to preview the taken image
        this.attachPreviewMode = 'camera';
        this.uploadingFiles = [];
        this.startCamera();
    }

    /**
     * To stop selfie camera
     */
    stopCamera(): void {
        if (this.selfVideo) {
            this.selfVideo.getTracks().forEach((track: MediaStreamTrack) => {
                track.stop();
            });
            this.selfVideo = null;
        }
    }

    /**
     * To send attachments
     *
     */
    async send(): Promise<void> {
        try {
            this.attachPreviewMode = '';
            this._fuseProgressBarService.show();

            // check if SMM
            // check if MediaStreamer is configured, then use MediaStreamer for upload
            if (this.isSMM || this.fileUploadUrl.MediaUploader) {
                // check if the URL is configured
                // added new file upload url MediaStreamer
                // keeping "SMM" for backward compatibility
                if (!this.fileUploadUrl.SMM && !this.fileUploadUrl.MediaUploader) {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.msURLNotFound'), 'failure');
                    this.attachPreviewMode = '';
                    this.uploadingFiles = [];
                    return;
                }

                const uploadURLs = this.fileUploadUrl.SMM || this.fileUploadUrl.MediaUploader;

                // get the files and upload
                this.uploadingFiles.forEach(async (file) => {
                    try {
                        const formData = new FormData();
                        formData.append('file', file.file);
                        formData.append('interaction_id', TUtils.Generic.uuid());
                        formData.append('organization_id', 'prod');
                        formData.append('conv_id', this.sessionID);
                        formData.append('uploaded_by', SDKClient.getAgentData().agentId);
                        formData.append('other', '');

                        // upload the file
                        const { response } = await TUtils.HttpClient.sendRequest<MediaStreamerResponse>({
                            urls: [uploadURLs],
                            method: 'POST',
                            responseType: 'json',
                            formData
                        });

                        // check if success
                        if (response?.isSuccess) {
                            const type = this.getAttachTypeByFileType(file.type);
                            this.sendAttachments.emit({
                                type,
                                contentType: response.result.contentType,
                                fileName: file.fileName,
                                src: response.result.downloadURL,
                                size: response.result.size,
                                interactionId: response.result.interaction_id
                            });
                        } else {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
                        }

                        // remove the item from list
                        this.uploadingFiles.pop();

                        this._fuseProgressBarService.hide();
                    } catch (error) {
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
                        // hide the progress bar
                        this._fuseProgressBarService.hide();
                    }
                });
            }
            // check if to upload to media proxy
            else if (this.fileUploadUrl.MediaProxy) {
                this.uploadingFiles.forEach(async (file) => {
                    try {
                        const formData = new FormData();
                        formData.append('file', file.file);
                        formData.append('SessionId', this.sessionID);
                        formData.append('other', '');

                        // upload the file
                        const { response } = await TUtils.HttpClient.sendRequest<any>({
                            urls: [this.fileUploadUrl.MediaProxy + '/api/FileUpload/Post/'],
                            method: 'POST',
                            responseType: 'json',
                            formData
                        });

                        // check the response from file server
                        if (response?.statusCode === 'Created') {
                            const type = this.getAttachTypeByFileType(file.type);
                            this.sendAttachments.emit({
                                type,
                                fileName: file.fileName,
                                src: response.url,
                                size: file.size
                            });
                        } else {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
                        }

                        // remove the item from list
                        this.uploadingFiles.pop();

                        this._fuseProgressBarService.hide();
                    } catch (error) {
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
                        // hide the progress bar
                        this._fuseProgressBarService.hide();
                    }
                });
            } else {
                // upload to TMAC proxy
                const filesToUpload: FileSaveData[] = [];
                this.uploadingFiles.forEach(async (file) => {
                    // add to the list
                    filesToUpload.push({
                        FileName: file.fileName,
                        Base64: file.base64,
                        RelativePath: '',
                        Status: 0,
                        Type: this.getAttachTypeByFileType(file.type),
                        Url: ''
                    });
                });

                // upload to server
                const { response } = await SDKClient.uploadFiles({
                    files: filesToUpload
                });

                // check the response
                response.forEach((item) => {
                    const file = this.uploadingFiles.pop();
                    this.sendAttachments.emit({
                        type: item.Type ? item.Type : 'file',
                        fileName: item.FileName,
                        src: item.Url,
                        size: file.size
                    });
                });

                this._fuseProgressBarService.hide();
            }
        } catch (error) {}
    }

    edit() {
        this.attachPreviewMode = this.attachPreviewMode + '-edit';
    }

    save(image, index) {
        if(image) {
            this.uploadingFiles[index] = {
                file: image,
                fileName: image.name,
                base64: image.base64,
                size: image.size,
                type: image.type,
                ext: image.name.split('.').pop()
            };
        }
        this.attachPreviewMode = this.attachPreviewMode.split('-').shift();
    }

    enableEdit(){
       return this.uploadingFiles.find(item => 
            item.type.includes('image')
        ) ? true : false;
    }
}
