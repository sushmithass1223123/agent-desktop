import { filter, take, takeUntil } from 'rxjs/operators';
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { PostAttachment, SDKClient, TUtils } from '@tmac/sdk';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MediaStreamerResponse, PostFile, SmComment, SmpComponentInputs } from 'app/interfaces';
import { AppUiService } from '@services/app-ui.service';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { AppDataService } from '@services/app-data.service';
import { maticonByExtension, throwADError } from 'app/utils';
import { SocialMediaPostsService } from '../social-media-posts.service';

@Component({
    selector: 'smp-template',
    templateUrl: './smp-template.component.html',
    styleUrls: ['./smp-template.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SmpTemplateComponent implements OnInit, OnDestroy {
    @Input() postData: SmpComponentInputs;
    @Input() mode: 'workbench' | 'interaction-min' | 'interaction-max';
    @ViewChild('fileInput') fileInput!: ElementRef;
    /**
     * Reply input children ref
     */
    @ViewChild('replyInput') replyInputField: ElementRef<HTMLTextAreaElement>;

    @Input() hideStructureActions: boolean = false;
    @Input() engagementFromNotification: any;
    @Input() draftData: any;
    @Input() previousCommentFromNotification: SmComment[];
    @Input() enhanceCommentContainer: boolean = false;
    @Input() sessionId: string;
    @Input() outSessionId: string;
    activeSessionId: string;
    @Input() interactionId: number;
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

    /**
     * Maximum file size default 20mbs
     */
    @Input() maxFileUploadSize = 20971520;
    @Input() draftPollDuration = 60;
    @Input() isDraftMode: boolean = false;
    @Output('emitReply') emitReply = new EventEmitter<any>();
    @Output('dataChanged') dataChanged = new EventEmitter<any>();
    renderActiveCommentAttachment: boolean = false;
    renderParentCommentAttachment: boolean = false;
    renderPrevCommentAttachment: boolean = false;
    showEmojiPicker: boolean = false;

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
    flattenedCommentHistory: any[] = [];
    indexHolder = {
        0: [0, 5]
    };
    hasNoFurtherComments: boolean = false;
    showPreviousComment: boolean = false;

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private _matDialog: MatDialog,
        private _appUiService: AppUiService,
        private translocoService: TranslocoService,
        private _appDataService: AppDataService,
        public smpService: SocialMediaPostsService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnDestroy(): void {
        this.unsubscribeAll$.next(null);
        this.unsubscribeAll$.complete();
    }

    ngOnInit(): void {
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll$)).subscribe((config: any) => {
            this.fileUploadUrl = config.Main.Urls?.FileServerUrl || null;
        });
        this.activeSessionId = this.postData.IsOutbound ? this.outSessionId : this.sessionId;
        this.postData = JSON.parse(JSON.stringify(this.postData));
        if (this.isDraftMode && this.draftData) {
            this.draftData.body = this.postData.SmActiveComment.CommentText.Text;
            if (this.postData.Files && this.postData.SmActiveComment?.CommentAttachments?.length) {
                this.draftData.attachments = this.postData.Files;
                if (this.postData.Files.length) {
                    this.draftData.rawAttachmentData = this.postData.Files[0].URL;
                    this.draftData.mimeConstraints = this.getFileType(this.draftData.rawAttachmentData);
                }
            }
            this.postData.SmActiveComment = this.postData.SmParentComments;
            this.postData.SmParentComments = null;
        }
        if (this.enhanceCommentContainer || this.mode === 'interaction-max') this.loadCommentHistory();
        this.cdr.detectChanges();
    }

    getFileType(fileName) {
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp'];

        if (videoExtensions.includes(fileExtension)) {
            return 'video';
        }

        if (imageExtensions.includes(fileExtension)) {
            return 'image';
        }

        return 'image';
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
            let date: any = '';
            if (!dotnetDate.includes('Date')) date = new Date(dotnetDate);
            else date = this.parseDotnetDate(dotnetDate);
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
        if (previewData.MediaType.includes('image')) {
            otherData = {
                scale: 1
            };
        }

        this.previewMediaDialogData = {
            timestamp: previewData?.InsertionDateTime
                ? this.parseDotnetDate(previewData?.InsertionDateTime)
                : Date.now(),
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
        this.draftData.mimeConstraints = fileType;
        setTimeout(() => {
            this.fileInput?.nativeElement?.click();
        });
    }

    async onFileSelected(evt: any) {
        const input = evt.target as HTMLInputElement;
        let resVal: Partial<PostFile>;
        if (input.files && input.files.length) {
            const f = input.files[0];
            const fext = this.draftData.mimeConstraints.includes('*') ? f.type.split('/')[0] : f.name.split('.').pop();
            if (!this.draftData.mimeConstraints.includes(fext)) {
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
            this.draftData.rawAttachmentData = Base64;
            if (this.fileUploadUrl?.MediaUploader) {
                const formData = new FormData();
                formData.append('file', f);
                formData.append('interaction_id', TUtils.Generic.uuid());
                formData.append('organization_id', 'prod');
                formData.append('conv_id', this.activeSessionId);
                formData.append('uploaded_by', SDKClient.getAgentData().agentId);
                formData.append('other', '');

                const { response } = await TUtils.HttpClient.sendRequest<MediaStreamerResponse>({
                    urls: [this.fileUploadUrl.MediaUploader],
                    method: 'POST',
                    responseType: 'json',
                    formData
                });

                if (response?.isSuccess) {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.uploadFileSuccess')
                    );
                    resVal = {
                        Name: response.result.original_name,
                        URL: response.result.downloadURL,
                        Source: 'mediastreamer'
                    };
                } else {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.uploadFileFailure'),
                        'failure'
                    );
                    throwADError('File not created at server', response);
                }
            } else {
                const {
                    response: [res]
                } = await SDKClient.uploadFiles(
                    {
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
                    },
                    undefined,
                    true
                );
                if (res.Url) {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.uploadFileSuccess')
                    );
                    resVal = { Name: res.FileName, URL: res.Url, Source: 'tmacproxy' };
                } else {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.uploadFileFailure'),
                        'failure'
                    );
                    throwADError('File not created at server', res);
                    return;
                }
            }

            const ext = resVal.Name.split('.').pop();

            this.dataChanged.emit(this.interactionId);

            this.draftData.attachments = [
                {
                    Id: TUtils.Generic.uuid(),
                    SessionID: this.sessionId,
                    Direction: 'OUT',
                    Icon: maticonByExtension(ext),
                    Ext: f.type,
                    Name: resVal.Name,
                    Source: resVal.Source,
                    URL: resVal.URL,
                    IsUploaded: true
                }
            ];
            setTimeout(() => {
                ref.dismiss();
            }, 3000);
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
        this.emitReply.emit(this.activeSessionId);
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
            this.draftData.mimeConstraints = '';
            this.draftData.rawAttachmentData = '';
            this.draftData.attachments = [];
            this.dataChanged.emit(this.interactionId);
        }
    }

    addEmoji(evt: any) {
        const inputVal: string = this.draftData.body || '';
        const selectionStart = this.replyInputField.nativeElement.selectionStart;
        const selectionEnd = this.replyInputField.nativeElement.selectionEnd;
        const startSlice = inputVal.slice(0, selectionStart);
        const endSlice = inputVal.slice(selectionEnd);
        this.draftData.body = `${startSlice}${evt.emoji.native}${endSlice}`;
        this.replyInputField.nativeElement.focus();
    }

    getTotalReactionCount(reactions) {
        if (!reactions) return 0;
        return reactions.reduce((total, reaction) => total + reaction.ReactionCount, 0);
    }

    async loadCommentHistory() {
        try {
            const { response } = await SDKClient.loadComments({
                postId: this.postData.PostId,
                commentId: '',
                startIndex: this.indexHolder[0][0],
                endIndex: this.indexHolder[0][1]
            });
            if (!response || (Array.isArray(response) && !response?.length)) {
                this._appUiService.showSnackbar(
                    this.translocoService.translate('sharedComponents.socialMediaPosts.noCommentsFoundMessage'),
                    'failure'
                );
                this.hasNoFurtherComments = true;
                return;
            }
            this.generateSegregatedComment(response, -1);
            if (this.engagementFromNotification || this.mode === 'interaction-max') {
                const checkerId = this.engagementFromNotification
                    ? this.engagementFromNotification.smmId
                    : this.postData.SmActiveComment.CommentId;
                const isActiveCommentFound = this.flattenedCommentHistory.findIndex(
                    (commentData: any) => commentData.CommentId === checkerId || commentData.PostId === checkerId
                );
                if (isActiveCommentFound < 0) this.onLoadNextHistory('comments');
                else this.validateVisibleComments(checkerId);
            }
            console.log(this.flattenedCommentHistory);
        } catch (error) {
            console.error(error);
        }
    }

    generateSegregatedComment(commentArray: any[], nestLevel: number): void {
        try {
            commentArray.forEach((commentData) => {
                let modCommentData = { ...commentData, nestLevel: nestLevel + 1, renderMedia: false };
                if (nestLevel === -1) modCommentData.isVisible = true;
                else modCommentData.isVisible = false;
                this.flattenedCommentHistory.push(modCommentData);
                if (commentData?.ReplyComments?.length) {
                    this.generateSegregatedComment(commentData.ReplyComments, nestLevel + 1);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    onForceLoadHistory(type: string, comment: any): void {
        try {
            if (type == 'replies') {
                this.flattenedCommentHistory.forEach((commentData: any) => {
                    if (commentData.ParentId === comment.CommentId) commentData.isVisible = true;
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    validateLoadHistory(type: string, comment: any): boolean {
        return this.flattenedCommentHistory.some(
            (commentData: any) => commentData.ParentId === comment.CommentId && commentData.isVisible
        );
    }

    onLoadNextHistory(type: string): void {
        try {
            this.indexHolder[0][0] += 5;
            this.indexHolder[0][1] += 5;
            this.loadCommentHistory();
        } catch (error) {
            console.error(error);
        }
    }

    validateVisibleComments(commentId: string): void {
        try {
            let foundCommentIndex = this.flattenedCommentHistory.findIndex(
                (commentData: any) => commentData.CommentId === commentId || commentData.PostId === commentId
            );
            let { nestLevel, ParentId } = this.flattenedCommentHistory[foundCommentIndex];
            if (nestLevel === 0) return;

            // Forward visibility alteration
            this.flattenedCommentHistory.forEach((commentData, i) => {
                if (i >= foundCommentIndex && commentData.ParentId === ParentId) {
                    commentData.isVisible = true;
                }
            });

            // Backward visibility alteration
            while (foundCommentIndex >= 0 && nestLevel > 0) {
                this.flattenedCommentHistory[foundCommentIndex].isVisible = true;
                nestLevel = this.flattenedCommentHistory[foundCommentIndex].nestLevel;
                foundCommentIndex--;
            }
        } catch (error) {
            console.error(error);
        }
    }

    findPreviousCommentIndex(): SmComment {
        return this.previousCommentFromNotification?.find(
            (commentData) => commentData?.CommentId === this.postData.SmActiveComment.CommentId
        );
    }
}
