import { filter, take, takeUntil } from 'rxjs/operators';
import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { PostAttachment, SDKClient, TUtils } from '@tmac/sdk';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MediaStreamerResponse, PostFile, SmpComponentInputs } from 'app/interfaces';
import { AppUiService } from '@services/app-ui.service';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { AppDataService } from '@services/app-data.service';
import { maticonByExtension, throwADError } from 'app/utils';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { SocialMediaPostsService } from '../social-media-posts.service';

interface Comment {
    cid: number;
    active?: boolean;
    comment: string;
    commenter: string;
    replies: Comment[];
    parents?: number[];
    hidden?: boolean;
}

@Component({
    selector: 'smp-template',
    templateUrl: './smp-template.component.html',
    styleUrls: ['./smp-template.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SmpTemplateComponent implements OnInit {
    @Input() postData: SmpComponentInputs;
    @Input() mode: 'workbench' | 'interaction-min';
    @ViewChild('fileInput') fileInput!: ElementRef;

    @Input() hideStructureActions: boolean = false;
    @Input() sessionId: string = '';
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => true)),
        widget$: this._fuseFacadeService.widgetBgClasses$,
        config$: this._fuseFacadeService.getConfig({ colorTheme: 'colorTheme' })
    };

    @Input() MaximumAllowedPostImageRendering: number = 5;

    lineClampCharacterCount: number = 100;

    body: string = '';
    attachments: any[] = [];
    mimeConstraints: string;
    /**
     * Maximum file size default 20mbs
     */
    @Input() maxFileUploadSize = 20971520;
    renderActiveCommentAttachment: boolean = false;

    /**
     * Preview media dialog
     */
    @ViewChild('previewMediaDialog')
    previewMediaDialog: TemplateRef<any>;
    /**
     * Preview media dialog ref
     */
    previewMediaDialogRef: MatDialogRef<any>;
    previewMediaDialogData: any;
    /**
     * File upload url config
     */
    fileUploadUrl: any;
    /**
     * Subject that is used as takeUntil limiter for unsubscribing all subsctiption on destroy
     */
    unsubscribeAll$: Subject<boolean> = new Subject<boolean>();
    sendTimerId: any;
    rawAttachmentData: any;

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private _matDialog: MatDialog,
        private _appUiService: AppUiService,
        private translocoService: TranslocoService,
        private _appDataService: AppDataService,
        private _smpService: SocialMediaPostsService
    ) {}

    ngOnInit(): void {
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll$)).subscribe((config: any) => {
            this.fileUploadUrl = config.Main.Urls?.FileServerUrl || null;
        });
    }

    scrollToActiveComment(): void {
        try {
            const activeCommentEl = document.querySelectorAll('.active-comment');
            if (activeCommentEl?.length) {
                activeCommentEl.forEach((el) => {
                    el.scrollIntoView({ behavior: 'smooth' });
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    parseDotnetDate(dotnetDate: string): Date {
        try {
            const regex = /\/Date\((\d+)\)\//;
            const match = dotnetDate.match(regex);
            if (match && match.length > 1) {
                const timestamp = parseInt(match[1], 10);
                return new Date(timestamp);
            }
            return new Date();
        } catch (error) {
            console.error(error);
        }
    }

    getGenericTimeFormat(dotnetDate: string): string {
        try {
            if (!dotnetDate) return 'NA';
            const currentDate: any = new Date();
            const date: any = this.parseDotnetDate(dotnetDate);
            const diffMilliseconds = currentDate - date;

            const diffSeconds = Math.floor(diffMilliseconds / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            const diffWeeks = Math.floor(diffDays / 7);

            const currentMonth = currentDate.getMonth() + 1;
            const currentDateWithoutTime = new Date(currentDate.getFullYear(), currentMonth, 0);
            const dateWithoutTime = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const diffMonths =
                (currentDateWithoutTime.getFullYear() - dateWithoutTime.getFullYear()) * 12 +
                (currentDateWithoutTime.getMonth() - dateWithoutTime.getMonth());

            if (diffSeconds < 60) {
                return `${diffSeconds}s`;
            } else if (diffMinutes < 60) {
                return `${diffMinutes}m`;
            } else if (diffHours < 24) {
                return `${diffHours}h`;
            } else if (diffDays < 7) {
                return `${diffDays}d`;
            } else if (diffMonths < 12) {
                return `${diffWeeks}w`;
            } else {
                return 'older';
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * To preview the media in the post
     * @param {PostAttachment} previewData Post attachment data
     */
    public previewMedia(previewData: PostAttachment): void {
        let otherData = null;
        if (previewData.MediaType == 'Photo') {
            otherData = {
                scale: 1
            };
        }

        this.previewMediaDialogData = {
            timestamp: this.parseDotnetDate(previewData.InsertionDateTime),
            attachment: {
                type: previewData.MediaType,
                src: previewData.MediaUrl
            },
            otherData
        };

        this.previewMediaDialogRef = this._matDialog.open(this.previewMediaDialog, {
            panelClass: 'preview-media-dialog'
        });
        this.previewMediaDialogRef.afterOpened().subscribe(() => {
            if (previewData.MediaType == 'Video') {
                const scrollContainer = document.querySelector('.drag-scroll-content') as HTMLDivElement;
                if (scrollContainer) {
                    scrollContainer.style.overflow = 'auto';
                    scrollContainer.style.height = '';
                    scrollContainer.style.height = '100%';
                    scrollContainer.style.minHeight = '100px';
                    scrollContainer.style.maxHeight = '600px';
                    scrollContainer.style.width = '';
                    scrollContainer.style.maxWidth = '800px';
                    scrollContainer.style.display = 'flex';
                }
            }
        });
    }

    onAttach(fileType) {
        this.mimeConstraints = fileType;
        setTimeout(() => {
            this.fileInput?.nativeElement?.click();
        });
    }

    async onFileSelected(evt: any) {
        const input = evt.target as HTMLInputElement;
        let resVal: Partial<PostFile>;
        if (input.files && input.files.length) {
            const f = input.files[0];
            const fext = this.mimeConstraints.includes('*') ? f.type.split('/')[0] : f.name.split('.').pop();
            if (!this.mimeConstraints.includes(fext)) {
                this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.fileTypeNotSupported'),
                    'failure'
                );
                return;
            }
            const ref = this._appUiService.showSnackbar(
                this.translocoService.translate('sharedComponents.socialMediaPosts.uploadFileLoading'),
                'loading'
            );
            if (f.size > this.maxFileUploadSize) {
                this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.uploadFileSizeWarning'),
                    'failure'
                );
                return;
            }
            const Base64 = await this.convertToBase64(f);
            this.rawAttachmentData = Base64;
            if (this.fileUploadUrl?.MediaUploader) {
                const formData = new FormData();
                formData.append('file', f);
                formData.append('interaction_id', TUtils.Generic.uuid());
                formData.append('organization_id', 'prod');
                formData.append('conv_id', this.sessionId);
                formData.append('uploaded_by', SDKClient.getAgentData().agentId);
                formData.append('other', '');

                const { response } = await TUtils.HttpClient.sendRequest<MediaStreamerResponse>({
                    urls: [this.fileUploadUrl.MediaUploader],
                    method: 'POST',
                    responseType: 'json',
                    formData
                });

                if (response?.isSuccess) {
                    resVal = {
                        Name: response.result.original_name,
                        URL: response.result.downloadURL,
                        Source: 'mediastreamer'
                    };
                } else {
                    throwADError('File not created at server', response);
                }
            } else {
                const {
                    response: [res]
                } = await SDKClient.uploadFiles({
                    files: [
                        {
                            Base64,
                            FileName: f.name,
                            RelativePath: '',
                            Status: 0,
                            Type: '',
                            Url: ''
                        }
                    ]
                });
                resVal = { Name: res.FileName, URL: res.Url, Source: 'tmacproxy' };
            }

            const ext = resVal.Name.split('.').pop();

            this.attachments.push({
                Id: TUtils.Generic.uuid(),
                SessionID: this.sessionId,
                Direction: 'OUT',
                Icon: maticonByExtension(ext),
                Ext: f.type,
                Name: resVal.Name,
                Source: resVal.Source,
                URL: resVal.URL,
                IsUploaded: true
            });
            ref.dismiss();
        }
    }

    /**
     * Convert file to base64
     * @param {File} file
     */
    convertToBase64(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    onSendReply() {
        this._smpService.sendReply.next({ attachments: this.attachments, body: this.body });
    }

    async onClearAttachment() {
        const confirmDialogRef = this._appUiService.showAppConfirmDialog(
            'generic',
            this.translocoService.translate('sharedComponents.socialMediaPosts.deleteAttachmentConfirmationHeader'),
            this.translocoService.translate('sharedComponents.socialMediaPosts.deleteAttachmentConfirmationBody')
        );

        const dialogResult = await confirmDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribeAll$))
            .pipe(take(1))
            .toPromise();
        if (dialogResult) {
            this.mimeConstraints = '';
            this.attachments = [];
        }
    }
}
