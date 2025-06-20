import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { FileSaveData, SDKClient, TUtils } from '@tmac/sdk';
import { MediaStreamerResponse } from 'app/interfaces';
import { TranslocoService } from '@ngneat/transloco';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
     * Type of attachment previw
     */
    @Input() attachmentConstraints: string[];
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
        base64: SafeUrl | string;
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
    /**
     * flag to hold unsupported video playbacks
     */
    isPlaybackNotSupported: boolean = false;

    /**
     * Index of the file being edited
     * -1 means no file is being edited
     * @type {number}
     */
    currentEditFileIndex: number;

    constructor(private _appUIService: AppUiService, private _fuseProgressBarService: FuseProgressBarService,
        private translocoService: TranslocoService, private sanitizer: DomSanitizer) {}

    /**
     * On init
     */
    ngOnInit(): void {
       // Add event listeners for drag events on the window
        window.addEventListener('dragover', this.onDragOver.bind(this));
        window.addEventListener('dragleave', this.onDragLeave.bind(this));
        window.addEventListener('drop', this.onDrop.bind(this));
        // add accept type for file input
        this.attachAcceptTypes = this.attachPreviewMode === 'uploadMedia' ? 'image/*,video/mp4,video/3gpp,video/quicktime' : this.attachmentConstraints.length ? this.attachmentConstraints.join(',') : '*';
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
        // Remove event listeners
        window.removeEventListener('dragover', this.onDragOver.bind(this));
        window.removeEventListener('dragleave', this.onDragLeave.bind(this));
        window.removeEventListener('drop', this.onDrop.bind(this));
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
   // Handle drag over event (when a file is dragged over the placeholder)
    onDragOver(event: DragEvent): void {
    event.preventDefault(); 
    event.stopPropagation();
    }
    // Handle drag leave event (when a file is dragged away from the placeholder)
    onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();  
    }
    // Handle drop event (when a file is dropped onto the placeholder)
    onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        this.handleFiles(files);
       }
    }
    // Handle the files that were dropped
    private handleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.processFile(file);
    }
    }
    // Process a single file
   private async processFile(file: File): Promise<void> {
    const fileMime = file.type.split('/');
    // Validate file type based on attachPreviewMode
    if (this.attachPreviewMode === 'uploadMedia' && !['video', 'image'].includes(fileMime[0])) {
        this.notifyInvalidFileSelection(fileMime[1]);
        return;
    }
    // Validate against attachment constraints
    if (this.attachmentConstraints.length && !this.attachmentConstraints.includes(file.type)) {
        this.notifyInvalidFileSelection(fileMime[1]);
        return;
    }
    // Edit uploaded image if it's an image
    if (fileMime[0] === 'image') {
        await this.editUploadedImage(file);
    } else {
        const base64 = await this.convertToBase64(file);
        const fileName = file.name;
        this.uploadingFiles.push({
            file,
            fileName,
            base64: this.sanitizeUrl(base64),
            size: file.size,
            type: file.type,
            ext: fileName.split('.').pop()
        });
        this.attachPreviewMode = 'preview';
    }
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
                const file = input.files[0];
                const fileMime = file.type.split('/');
                if(this.attachPreviewMode === 'uploadMedia') {
                    const fileMime = input.files[0].type.split('/');
                    if(!['video', 'image'].includes(fileMime[0])) {
                        this.notifyInvalidFileSelection(fileMime[1]);
                        return;
                    }
                }
                if (this.attachmentConstraints.length && 
                    !this.attachmentConstraints.includes(input.files[0].type)) {
                    const fileMime = input.files[0].type.split('/');
                    this.notifyInvalidFileSelection(fileMime[1]);
                    return;
                }
                  // Edit uploaded image if it's an image
            if (fileMime[0] === 'image') {
                await this.editUploadedImage(file);
            } else {
                const base64 = await this.convertToBase64(input.files[0]);
                const fileName = input.files[0].name;
                this.uploadingFiles.push({
                    file: input.files[0],
                    fileName,
                    base64: this.sanitizeUrl(base64),
                    size: input.files[0].size,
                    type: input.files[0].type,
                    ext: fileName.split('.').pop()
                });

                this.attachPreviewMode = 'preview';
            }}
        } catch (e) {
            console.error(e);
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
        }
    }
    
    /**
     * Edit uploaded image
     * @param {File} file 
     */
    async editUploadedImage(file: File): Promise<void> {
    const base64 = await this.convertToBase64(file);
    const image = new Image();
    image.src = base64;  
    image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        Object.assign(canvas, { width: image.width, height: image.height });
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const editedBase64 = canvas.toDataURL(file.type);
        const size = Math.round((editedBase64.length - `data:${file.type};base64,`.length) * 3 / 4 * 0.5624896334383812);

        this.uploadingFiles.push({
            file: new File([this.dataURItoBlob(editedBase64)], file.name, { type: file.type }),
            fileName: file.name,
            base64: editedBase64,
            size,
            type: this.getAttachTypeByFileType(file.type),
            ext: file.name.split('.').pop()
        });

        this.attachPreviewMode = 'preview';
        };
    }
   
    /**
     * Convert a base64 string to a Blob
     * @param {string} dataURI 
     */
    dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
    }

    /**
     * Method to notify agent that the selected file mime is invalid
     * @param mime Mime type of the file
     */
    notifyInvalidFileSelection(mime: string): void {
        try {
            const dynamicLabels = [
                {
                    key: '#fileType',
                    value: mime
                }
            ];
            this._appUIService.showSnackbar(
                this.getUpdatedLabel(
                    this.translocoService.translate('widgets.chatAttachments.invalidType'),
                    dynamicLabels
                ),
                'warning'
            );
        } catch (error) {
            console.error(error);
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
            const uploadedAttachments = [];  
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
                for (const file of this.uploadingFiles) {
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
                            uploadedAttachments.push({
                                type,
                                contentType: response.result.contentType,
                                fileName: file.fileName,
                                src: response.result.downloadURL,
                                size: response.result.size,
                                interactionId: response.result.interaction_id,
                                uploader: 'MediaStreamer'
                            });
                        } else {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
                        }

                       } catch (error) {
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
           }
            }
  } else if (this.fileUploadUrl.MediaProxy) {
            for (const file of this.uploadingFiles) {
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
                             uploadedAttachments.push({
                                type,
                                fileName: file.fileName,
                                src: response.url,
                                size: file.size,
                                uploader: 'MediaProxy'
                            });
                        } else {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
                        }


                    } catch (error) {
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.chatAttachments.uploadFileFailed'), 'failure');
                    }
                }
            } else {
                // upload to TMAC proxy
                const filesToUpload: FileSaveData[] = 
                this.uploadingFiles.map((file: any) => ({
                        FileName: file.fileName,
                        Base64: file.base64,
                        RelativePath: '',
                        Status: 0,
                        Type: this.getAttachTypeByFileType(file.type),
                        Url: ''
                    })
                );

                // upload to server
                const { response } = await SDKClient.uploadFiles({
                    files: filesToUpload
                });

                // check the response
                             response.forEach((item, index) => {
                uploadedAttachments.push({
                        type: item.Type ?? 'file',
                        fileName: item.FileName,
                        src: item.Url,
                        size: this.uploadingFiles[index].size,
                        uploader: 'TmacProxy'

                    });
                });
        }
             // Emiting each attachment separately or modifying to emit batch if supported
        for (const attachment of uploadedAttachments) {
            this.sendAttachments.emit(attachment);
            
        }

        this.uploadingFiles = [];
        this._fuseProgressBarService.hide();
    } catch (error) {
        this._fuseProgressBarService.hide();
    }
    }

    edit(index?: number): void {
        this.attachPreviewMode = this.attachPreviewMode + '-edit';
        this.currentEditFileIndex = index !== undefined ? index : 0;
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

    /**
     * Method to handle error from audo/video html elements
     */
    onHandlePlaybackError(): void {
        try {
            this.isPlaybackNotSupported = true;
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Method to sanitize base64 to safe url
     * @param base64Url Base 64 Url
     * @returns Sanitized Safe Url
     */
    sanitizeUrl(base64Url: string): SafeUrl {
        return this.sanitizer.bypassSecurityTrustUrl(base64Url);
    }
}
