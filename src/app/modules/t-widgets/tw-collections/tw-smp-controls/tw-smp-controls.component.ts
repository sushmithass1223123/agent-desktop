import {
    SMP_REASONCODE_VALUES,
    SMP_CURRENTSTATUS_CODES,
    SMP_OUTBOX_REASONS,
    SMP_DRAFT_REASONS,
    SMP_SENT_REASONS
} from 'app/constants';
import { AgentSkillListData, InteractionWidgetBaseData, TwSmpControlsData } from '@ad/types';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AgentSkillListComponent } from '@modules/shared/components';
import { SocialMediaPostsService } from '@modules/shared/components/social-media-posts/social-media-posts.service';
import { TranslocoService } from '@ngneat/transloco';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { AgentNotificaitonEvent, IAgentData, IncomingEmailEvent, InteractionDataEvent, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { InteractionComment, InteractionRef, IWidget, MediaStreamerMetaResponse, MediaStreamerMultiResponse } from 'app/interfaces';
import { AgentSkillListDataModel } from 'app/models';
import { ADError, maticonByExtension, throwADError } from 'app/utils';
import { merge, sortBy } from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';
import { TMACEventService } from '@services/tmac-event.service';
import { format } from 'date-fns';

declare var document: any;

const channelMapper: any = {
    fb: 'facebook',
    instagram: 'instagram',
    twitter: 'x'
};

type SmpEventGeneric = IncomingEmailEvent;

@Component({
    selector: 'tw-smp-controls',
    templateUrl: './tw-smp-controls.component.html',
    styleUrls: ['./tw-smp-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSmpControlsComponent extends TWidgetWrapper implements OnInit, AfterViewInit, OnDestroy {
    /**
     * data from widget
     */
    @Input() data: IWidget<SmpEventGeneric, TwSmpControlsData & InteractionWidgetBaseData>;
    /**
     * To emit maximize event on widget maximize
     */
    @Output() maximizeEvent = new EventEmitter();
    /**
     * To emit float event on widget maximize
     */
    @Output() floatEvent = new EventEmitter();
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$,
        config$: this._fuseFacadeService.getConfig({ colorTheme: 'colorTheme' })
    };
    /**
     * Flag to show popup UI
     */
    popupInteraction: boolean = false;

    isMaximizedMode: boolean = false;
    isFloatedMode: boolean = false;
    /**
     * List of all available interactions
     */
    interactionList: Partial<InteractionRef>[] = [];
    /**
     * Flag to check if interaction is active
     */
    isInteractionActive = false;
    /**
     * Current intreaction id
     */
    interactionId: number;

    sessionId: any;
    outSessionId: any;
    activeSessionId: any;

    actionStatus: {
        disableUIButtons: boolean;
    } = {
        disableUIButtons: false
    };

    maxFileUploadSize: number = 20971520;
    asyncReplySendTimeout: number = 60000;
    sendTimerId: any;

    prevAttachments: any[] = [];
    draftOutsessionId = {};
    isDraftMode: boolean = false;
    editedCommentData: any = {};
    editedParentCommentData: any = {};
    deletedPostData: any = {};
    deletedCommentData: any = {};
    editedPostData: any = {};
    postDraftData: any = {};
    restrictPostActions: any = {};
    tempOutSessionId: string = '';
    /**
     * File upload url config
     */
    fileUploadUrl: any;
    routeReason: string = '';
    /**
     * Saved interaction comments
     */
    savedComments: InteractionComment[] = [];
    /**
     * Flag to blink comments button when added from server
     */
    commentsAdded: boolean;
    /**
     * Agent ref
     */
    user: IAgentData;

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService,
        private _interactionManagerService: InteractionManagerService,
        public smpService: SocialMediaPostsService,
        private _contentPageService: ContentPageService,
        private _appUiService: AppUiService,
        private _fuseProgressBarService: FuseProgressBarService,
        private cdr: ChangeDetectorRef,
        private _appDataService: AppDataService,
        private _matDialog: MatDialog,
        private _tmacEventService: TMACEventService
    ) {
        super('TwSmpControlsComponent');
    }

    async ngOnInit() {
        this.initWrapper(this.data);
        this.interactionId = this.data.InteractionDetails.InteractionID;
        this.sessionId = this.data.InteractionDetails.SessionId;
        this.outSessionId = this.data.InteractionDetails?.OutSessionID;
        this.routeReason = this.data.InteractionDetails.RouteReason;
        this.isDraftMode = this.routeReason === 'AgentDraftPull';
        await this.setPostDetails();

        this.maxFileUploadSize = this.data.Data.MaxFileUploadSize;
        this.asyncReplySendTimeout = this.data.Data.AsyncReplySendTimeout;

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fileUploadUrl = config.Main.Urls?.FileServerUrl || null;
        });

        this._tmacEventService
            .getInteractionEvents(['InteractionDataEvent'], this.interactionId)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        this.user = SDKClient.getAgentData() || null;

        this.smpService.getEmittedNotificationData
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(({ message, action }) => {
                switch(action) {
                    case 'smc_e': {
                        if (!this.editedCommentData[message?.SocialMediaData?.Comments?.CommentId]) {
                            this.editedCommentData[message?.SocialMediaData?.Comments?.CommentId] = {
                                message: message?.SocialMediaData?.Comments,
                                isConsented: false
                            };
                        } 
                        break;
                    }
                    case 'smpc_e': {
                        if (!this.editedParentCommentData[message?.SocialMediaData?.ParentComments?.CommentId]) {
                            this.editedParentCommentData[message?.SocialMediaData?.ParentComments?.CommentId] = {
                                message: message?.SocialMediaData?.ParentComments,
                                isConsented: false
                            };
                        } 
                        break;
                    }
                    case 'smp_e': {
                        if(!this.editedPostData[message?.SocialMediaData?.Posts?.PostId]) {
                            this.editedPostData[message?.SocialMediaData?.Posts?.PostId] = {};
                        }
                        break;
                    }
                    case 'smc_d': {
                        if(!this.deletedCommentData[message?.SocialMediaData?.Comments?.CommentId]) {
                            this.deletedCommentData[message?.SocialMediaData?.Comments?.CommentId] = {
                                isConsented: false
                            };
                        }
                        break;
                    }
                    case 'smp_d': {
                        if(!this.deletedPostData[message?.SocialMediaData?.Posts?.PostId]) {
                            this.deletedPostData[message?.SocialMediaData?.Posts?.PostId] = {};
                        }
                        break;
                    }
                    default: break;
                }
            });

        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                this.interactionList = interactions
                    .filter((i: InteractionRef) => i.type === 'smp')
                    .map((i) => {
                        this.isInteractionActive = i.interactionId === this.interactionId && i.isActive;
                        if (!this.postDraftData[i.interactionId])
                            this.postDraftData[i.interactionId] = {
                                body: '',
                                mimeConstraints: '',
                                rawAttachmentData: [],
                                attachmentMimes: [],
                                attachments: [],
                                isReplyDrafted: false
                            };
                        if (i.isActive) {
                            this.sessionId = i.otherData?.SessionId;
                            this.outSessionId = i.otherData?.OutSessionID;
                            this.routeReason = i.otherData?.RouteReason;
                            this.isDraftMode = this.routeReason === 'AgentDraftPull';
                            this.setPostDetails();
                            this.interactionId = i.interactionId;
                        }
                        return {
                            user: i.user,
                            status: i.status,
                            isActive: i.isActive,
                            interactionId: i.interactionId,
                            sessionId: i.otherData?.SessionId,
                            outSessionId: i.otherData?.OutSessionID,
                            isPostReplySent: i.isPostReplySent
                        };
                    });
            });

        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    ngOnDestroy(): void {
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    ngAfterViewInit(): void {
        if (this.data.Data.RouteOnInteraction && this._interactionManagerService.getInteractionCount().active <= 1) {
            setTimeout(() => {
                let inPage = true;
                if (this._contentPageService.getCurrentMode() !== this.data.Data.Path) {
                    inPage = false;
                    this._contentPageService.mode = this.data.Data.Path;
                }
                // if no active we need to select that particular interaction
                if (!inPage) {
                    const interaction = this.interactionList.filter(
                        (i) => i.interactionId === this.data.InteractionDetails.InteractionID
                    )[0];
                    if (interaction && !interaction?.isActive) {
                        this.selectInteraction(interaction as InteractionRef, true);
                    }
                }
            }, 500);
        }

        this._appUiService.playAudio('new-chat', 0.5, false);
        this._appUiService.showDesktopAlert(
            this.translocoService.translate('widgets.chatControls.incomingChatTitle'),
            this.translocoService.translate('widgets.chatControls.incomingChatMessage'),
            false
        );
    }

    /**
     * To handle InteractionDataEvent
     */
    async InteractionDataEvent(evt: InteractionDataEvent): Promise<void> {
        let transferComments = [];
        // check the channel
        if (evt.Channel.toLowerCase() !== 'sm') {
            return;
        }

        await SDKClient.getDataFromDataServer({
            query: 'Type == "transfer-comment" AND SubType == "sm"',
            instance: ''
        })
            .then((r) => {
                if (r && r !== null) {
                    r.response.forEach((msg) => {
                        if (this.activeSessionId.toString() === msg.Key) {
                            let m = JSON.parse(msg.Data);

                            this.commentsAdded = true;
                            transferComments.push({
                                Message: m.comment,
                                Time: m.date,
                                User: msg.InsertedBy
                            });
                        }
                    });
                    this.logger.info('Getting transfer comment data');
                }
            })
            .catch((e) => {
                console.log('Error occured during Get data from data server', e);
            });

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
        this.savedComments = sortBy([...transferComments, ...this.savedComments], 'Time');
        console.log('Saved comments:', this.savedComments);
    }

    /**
     * To save interaction comments to server
     */
    public saveInteractionComments(): void {
        let message = '';
        // check the saved comments
        this.savedComments.forEach((item) => {
            message += `
                 <div class="text-primary mat-body-2">${item.Message.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                 <span class="time muted-text mat-body-1">${item.User}</span>,
                 <span class="time muted-text mat-body-1">${format(new Date(item.Time), 'dd/MM/yyyy hh:mm:ss a')}</span>
                 <br />
                 <br />
                 `;
        });
        message += this.translocoService.translate('interactionComponent.addComment');

        const dialogRef = this._appUiService.showCustomDialog(
            'prompt',
            message,
            this.translocoService.translate('interactionComponent.interactionComment'),
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
                    interactionId: this.data.InteractionDetails.InteractionID.toString()
                })
                    .then((resp2) => {
                        if (resp2.response > 0) {
                            // add comments to the reference
                            this.savedComments.push({
                                Message: resp1,
                                Time: new Date(),
                                User: this.user.agentName
                            });
                            // alert user
                            this._appUiService.showSnackbar(
                                this.translocoService.translate('interactionComponent.saveICSuccess')
                            );
                        } else {
                            this._appUiService.showSnackbar(
                                this.translocoService.translate('interactionComponent.saveICFailed'),
                                'failure'
                            );
                        }

                        this._fuseProgressBarService.hide();
                    })
                    .catch(() => {
                        this._fuseProgressBarService.hide();
                        this._appUiService.showSnackbar(
                            this.translocoService.translate('interactionComponent.saveICError'),
                            'failure'
                        );
                    });
            }
        });
    }

    /**
     * AgentNotificaitonEvent Handler
     * @method AgentNotificaitonEvent
     * @param {AgentNotificaitonEvent} evt
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        if (!evt.Message) return;

        const type = evt.Type?.toLowerCase() ?? '';
        const message = JSON.parse(evt.Message);

        if (type === 'socialmediacomment_edit') {
            this.editedCommentData[message?.SocialMediaData?.Comments?.CommentId] = {
                message: message?.SocialMediaData?.Comments,
                isConsented: false
            };
        } else if (type === 'socialmediaparentcomment_edit') {
            this.editedParentCommentData[message?.SocialMediaData?.ParentComments?.CommentId] = {
                message: message?.SocialMediaData?.ParentComments,
                isConsented: false
            };
        } else if (type === 'socialmediapost_edit') {
            if(this.editedPostData[message?.SocialMediaData?.Posts?.PostId])
                delete this.editedPostData[message?.SocialMediaData?.Posts?.PostId];
            this.editedPostData[message?.SocialMediaData?.Posts?.PostId] = {};
        } else if (type === 'socialmediacomment_delete') {
            this.deletedCommentData[message?.SocialMediaData?.Comments?.CommentId] = {
                isConsented: false
            };
        } else if (type === 'socialmediapost_delete') {
            if(this.deletedPostData[message?.SocialMediaData?.Posts?.PostId])
                delete this.deletedPostData[message?.SocialMediaData?.Posts?.PostId];
            this.deletedPostData[message?.SocialMediaData?.Posts?.PostId] = {};
        }
    };

    toggleInteractionPopup(): void {
        try {
            document.querySelector('.navbar-fuse-sidebar').style.zIndex = this.popupInteraction ? 1000 : 8;
            this.popupInteraction = !this.popupInteraction;
        } catch (error) {
            console.error(error);
        }
    }

    emitReply() {
        if (
            !this.postDraftData[this.interactionId].attachments.length &&
            !this.postDraftData[this.interactionId].body
        ) {
            this._appUiService.showSnackbar(
                this.translocoService.translate('widgets.smpControls.invalidSendRequestMessage')
            );
            return;
        }
        this.popupInteraction = false;
        this.onSendReply();
    }

    onMaximized(isMax: boolean): void {
        this.isMaximizedMode = isMax;
        this.isFloatedMode = false;
        this.maximizeEvent.emit(isMax);
    }

    onFloated(isFloat: boolean): void {
        this.isFloatedMode = isFloat;
        this.isMaximizedMode = false;
        this.floatEvent.emit(isFloat);
    }

    getInitials = (name) => {
        return name
            .split(' ')
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    /**
     * To select an interaction from interaction list
     *
     * @param {InteractionRef} item Interaction item
     */
    public selectInteraction(item: InteractionRef, force?: boolean): void {
        if (!force && this.data.InteractionDetails.InteractionID === item.interactionId) {
            return;
        }

        this._interactionManagerService.updateInteraction(item.interactionId, {
            isActive: true,
            otherData: {
                unreadCount: 0
            }
        });
    }

    /**
     * Closes current interaction
     */
    async closeInteraction(force = false) {
        if (!force) {
            if (
                (this.postDraftData[this.interactionId]?.body ||
                    this.postDraftData[this.interactionId]?.attachments?.length) &&
                !this.postDraftData[this.interactionId].isReplyDrafted
            ) {
                const confirmDialogRef = this._appUiService.showAppConfirmDialog(
                    'generic',
                    this.translocoService.translate('widgets.smpControls.saveAsDraftConfirmationHeader'),
                    this.translocoService.translate('widgets.smpControls.saveAsDraftConfirmationBody'),
                    'close:confirm'
                );

                const dialogResult = await confirmDialogRef
                    .afterClosed()
                    .pipe(takeUntil(this.unsubscribeAll))
                    .pipe(take(1))
                    .toPromise();
                if (dialogResult) {
                    this.savePostAsDraft(true, true);
                    return;
                } else {
                    this.closePost();
                    return;
                }
            }
        }

        const closeApiCall = () => {
            this.actionStatus.disableUIButtons = true;
            this._fuseProgressBarService.show();

            SDKClient.closeInteraction(this.interactionId.toString(), null, true)
                .then((dt: IResponse) => {
                    delete this.smpService.postBodies[this.sessionId];
                    delete this.smpService.postBodies[this.outSessionId];
                    delete this.draftOutsessionId[this.activeSessionId];
                    this._fuseProgressBarService.hide();
                    if (dt.response && dt.response.ResultCode === 0) {
                        this._appUiService.showSnackbar(
                            this.translocoService.translate('interactionComponent.closeInteractionSuccess')
                        );
                        this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                    } else {
                        this._appUiService.showSnackbar(
                            this.translocoService.translate('interactionComponent.closeInteractionFailed'),
                            'failure'
                        );
                    }
                })
                .catch(() => {
                    this._fuseProgressBarService.hide();
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('interactionComponent.closeInteractionFailed'),
                        'failure'
                    );
                })
                .finally(() => {
                    this.actionStatus.disableUIButtons = false;
                });
        };
        if (force) {
            closeApiCall();
        } else {
            const confirmDialogRef = this._appUiService.showAppConfirmDialog('closeInteraction');
            confirmDialogRef.afterClosed().subscribe((dialogResult: boolean | undefined) => {
                if (dialogResult) {
                    closeApiCall();
                }
            });
        }
    }

    async onSendReply() {
        try {
            let attachments = this.postDraftData[this.interactionId].attachments;
            let body = this.postDraftData[this.interactionId].body;

            const errCallback = (err) => {
                console.error(err);
                let msg = this.translocoService.translate('widgets.smpControls.sendPostReplyError');
                if (err instanceof ADError) {
                    msg = err.message;
                }
                this._fuseProgressBarService.hide();
                this._appUiService.showSnackbar(msg, 'failure');
            };
            try {
                this.actionStatus.disableUIButtons = true;
                this._fuseProgressBarService.show();
                const ref = this._appUiService.showSnackbar(
                    this.translocoService.translate('widgets.smpControls.sendPostReplyLoading'),
                    'loading'
                );
                if (attachments) delete attachments[0]?.Url;
                const res = await SDKClient.sendItem({
                    attachmentFileList: attachments && attachments.length ? JSON.stringify(attachments) : '',
                    body: body,
                    inboxSessionId: this.sessionId,
                    outboxSessionId: !this.outSessionId && this.draftOutsessionId[this.activeSessionId] ? this.draftOutsessionId[this.activeSessionId] : (this.outSessionId || ''),
                    routeId: '',
                    toList: '',
                    bccList: '',
                    typeOfResponse: 'reply',
                    ccList: '',
                    subject: this.smpService.postBodies[this.activeSessionId]?.Subject ?? ''
                }).catch((e) => errCallback(e));
                ref.dismiss();
                if (!res || !res.response) {
                    this.actionStatus.disableUIButtons = false;
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('widgets.smpControls.replySendConnectionError'),
                        'failure'
                    );
                    throwADError('Error in TwSmpControlsComponent.onSendReply', 'Unexpected response from Server');
                    return;
                }

                let reasonCodeMsg = SMP_REASONCODE_VALUES[res.response.SendStatus];

                if (res.response.CurrentStatus === 'ItemSending') {
                    this._interactionManagerService.updateInteraction(this.interactionId, {
                        isReplySent: false
                    });
                    let timerTime = this.asyncReplySendTimeout ? this.asyncReplySendTimeout : 60000;
                    this.sendTimerId = setTimeout(() => {
                        let isSent = this.isPostReplySent(this.interactionId);
                        if (!isSent && this.interactionId) {
                            this._appUiService.showSnackbar(
                                this.translocoService.translate('widgets.smpControls.replySendTimeoutMessage'),
                                'failure'
                            );

                            this._interactionManagerService.updateInteraction(this.interactionId, {
                                isPostReplySent: true
                            });
                        }
                    }, timerTime);
                    reasonCodeMsg = SMP_REASONCODE_VALUES[100];
                }

                const currentStatusMsg = SMP_CURRENTSTATUS_CODES[res.response.CurrentStatus];
                if (!reasonCodeMsg) {
                    this.actionStatus.disableUIButtons = false;
                    throwADError(
                        'Error in TwSmpControlsComponent.onSendReply',
                        'Unable to send post reply. Invalid Reason Code'
                    );
                }
                if (!currentStatusMsg) {
                    this.actionStatus.disableUIButtons = false;
                    throwADError(
                        'Error in TwSmpControlsComponent.onSendReply',
                        'Unable to send post reply. Invalid Current Status'
                    );
                }
                if (reasonCodeMsg !== 'success') {
                    this.actionStatus.disableUIButtons = false;
                    throwADError(
                        'Error in TwSmpControlsComponent.onSendReply',
                        `${reasonCodeMsg} [${res.response.SendStatus}]`
                    );
                }

                this._appUiService.showSnackbar(this.translocoService.translate(currentStatusMsg), 'success');
                this.actionStatus.disableUIButtons = false;
            } catch (err) {
                this.actionStatus.disableUIButtons = false;
                errCallback(err);
            }
        } catch (error) {
            this.actionStatus.disableUIButtons = false;
            console.error(error);
        }
    }

    /**
     * Checks if post reply is sent or not
     */
    isPostReplySent(interactionId: any): boolean {
        let interaction = this.interactionList.find((i) => i.interactionId === interactionId);

        if (interaction && interaction.isPostReplySent === false) {
            return false;
        }
        return true;
    }

    /**
     * Save post as Draft
     */
    savePostAsDraft(closePost = false, isLoud: boolean): void {
        const postBody = (this.postDraftData[this.interactionId].body || '').toString();
        let draftSnackbarRef: any;
        if(!postBody) {
            this._appUiService.showSnackbar(
                this.translocoService.translate('widgets.smpControls.invalidDraftTrigger'),
                'failure'
        );
            return;
        }
        if (isLoud)
            draftSnackbarRef = this._appUiService.showSnackbar(
                this.translocoService.translate('widgets.smpControls.savingDraftLabel'),
                'loading'
            );
        if (this.prevAttachments.length === 0)
            this.prevAttachments = this.smpService.postBodies[this.activeSessionId].Files;
        let { isModified, changes } = this.compareArrays(
            this.prevAttachments,
            this.postDraftData[this.interactionId].attachments
        );
        SDKClient.saveEmailDraft(
            {
                bccList: '',
                body: postBody,
                ccList: '',
                inboxSessionId: this.sessionId,
                outboxSessionId: this.draftOutsessionId[this.activeSessionId]
                    ? this.draftOutsessionId[this.activeSessionId]
                    : this.outSessionId || '',
                routeId: '',
                subject: this.smpService.postBodies[this.activeSessionId]?.Subject ?? '',
                toList: '',
                typeOfResponse: '',
                attachmentList: changes,
                isAttachmentModified: isModified
            },
            undefined,
            true
        )
            .then((x) => {
                if (x.response.replace(/^"(.*)"$/, '$1')) {
                    if (isLoud)
                        this._appUiService.showSnackbar(
                            this.translocoService.translate('widgets.smpControls.savingDraftSuccessLabel')
                        );
                    this.prevAttachments = JSON.parse(
                        JSON.stringify(this.postDraftData[this.interactionId].attachments)
                    );
                    this.postDraftData[this.interactionId].isReplyDrafted = true;
                    this.draftOutsessionId[this.activeSessionId] = x.response.replace(/^"(.*)"$/, '$1');
                } else {
                    throwADError('Unable to save as draft', new Error('Invalid server response'));
                    if (isLoud)
                        this._appUiService.showSnackbar(
                            this.translocoService.translate('widgets.smpControls.savingDraftFailedLabel'),
                            'failure'
                        );
                }
                if (closePost) {
                    this.closeInteraction(true);
                }
            })
            .catch((err) => {
                console.error(err);
                if (isLoud)
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('widgets.smpControls.savingDraftFailedLabel'),
                        'failure'
                    );
            }).finally(() => {
                draftSnackbarRef?.dismiss()
            });
    }

    /**
     *
     * @param arr1 Original array where changes are made
     * @param arr2 Comparison array
     * @returns Modify object
     */
    compareArrays(arr1: Array<any>, arr2: Array<any>): { isModified: boolean; changes: Array<any> } {
        const result = [];
        let isModified = false;

        if (arr1.length === 0) {
            for (const obj of arr2) {
                if (obj.IsUploaded) {
                    isModified = true;
                    result.push(`${obj.URL}|${obj.Ext}|1`);
                }
            }
            return { isModified: isModified, changes: result };
        }

        for (const obj of arr2) {
            const match = arr1.find((item) => item.URL === obj.URL);
            if (match) {
                result.push(`${obj.URL}|${obj.Ext}|0`);
            } else {
                if (obj.IsUploaded) {
                    isModified = true;
                }
                result.push(`${obj.URL}|${obj.Ext}|${obj.IsUploaded ? '1' : '0'}`);
            }
        }
        for (const obj of arr1) {
            const match = arr2.find((item) => item.URL === obj.URL);
            if (!match) {
                isModified = true;
                result.push(`${obj.URL}|${obj.Ext}|2`);
            }
        }

        return { isModified: isModified, changes: result };
    }

    clearDraftData(): void {
        try {
            this.postDraftData[this.interactionId] = {
                body: '',
                mimeConstraints: '',
                rawAttachmentData: [],
                attachments: [],
                attachmentMimes: [],
                isReplyDrafted: false
            };
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Get attachment meta data from media streamer for archive status
     */
    async requestAttachmentData(attachments: any[]): Promise<any> {
        try {
            //extract file id's
            let attachmentMap = attachments.reduce(
                (acc, cur) => {
                    if (cur.IsCloud) {
                        let split = cur.Url.split('/');
                        if (split.length > 0) {
                            let fileId = split[split.length - 1];
                            acc.ids.push(fileId);
                            acc.att.push({ ...cur, FileId: fileId, URL: cur.Url });
                        } else {
                            acc.att.push({ ...cur, URL: cur.Url });
                        }
                    } else {
                        acc.att.push({ ...cur, URL: cur.Url });
                    }
                    return acc;
                },
                { ids: [], att: [] }
            );
            if (attachmentMap.ids.length > 0) {
                let ids = attachmentMap.ids.join(',');
                try {
                    const { response } = await TUtils.HttpClient.sendRequest<
                        MediaStreamerMultiResponse<MediaStreamerMetaResponse>
                    >({
                        urls: [`${this.fileUploadUrl.MediaStreamer}/meta/mediaall?ids=${ids}`],
                        method: 'GET',
                        responseType: 'json'
                    });

                    if (response?.result?.length > 0) {
                        attachmentMap.att.forEach((cur) => {
                            if (cur.IsCloud) {
                                let fileMeta = response?.result.find((i) => i.interaction_id === cur.FileId);
                                if (fileMeta) {
                                    cur.ArchiveStatus = fileMeta.archiveStatus;
                                    cur.RestoreStatus = fileMeta.restoreStatus;
                                    cur.FileError = fileMeta.fileError;
                                }
                            }
                        }, []);
                    }
                } catch (ex) {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('sharedComponents.socialMediaPosts.fileMetaError'),
                        'failure'
                    );
                    attachmentMap.att.forEach((cur) => {
                        cur.ArchiveStatus = null;
                        cur.RestoreStatus = null;
                        cur.FileError = true;
                    }, []);
                }
            }
            return attachmentMap.att;
        } catch (error) {
            return attachments;
        }
    }

    /**
     * Sets post's body and some other details
     */
    async setPostDetails(force?: boolean): Promise<void> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const fetchFromOutbox = SMP_OUTBOX_REASONS.concat(SMP_DRAFT_REASONS)
                    .concat(SMP_SENT_REASONS)
                    .includes(this.routeReason);

                let inboxRes: any;
                let outboxRes: any;

                const getAttachments = (attachments: any[], sid: any): any[] => {
                    if (attachments && attachments.length) {
                        return attachments.map((item: any) => {
                            let uploadedName = item.Url.split('/').pop();
                            if (!item.Name) {
                                uploadedName = uploadedName.replace(sid, '');
                                item.Name = uploadedName;
                            }
                            item.Icon = maticonByExtension(item.Ext);
                            return item;
                        });
                    }
                    return [];
                };

                const setPostBody = async (resData: any, sid: any) => {
                    let modifiedAttachmentData: any[] = [];
                    if (resData?.SocialMediaData?.Comments?.CommentAttachments?.length) {
                        modifiedAttachmentData = resData.SocialMediaData.Comments.CommentAttachments.map((attdat) => {
                            return {
                                IsCloud: true,
                                Url: attdat?.MediaUrl,
                                IsUploaded: true,
                                Ext: attdat?.MediaType
                            };
                        });
                    }
                    let tempAttachments = await this.requestAttachmentData(
                        (modifiedAttachmentData.length && this.isDraftMode) ? modifiedAttachmentData : resData.Attachments
                    );
                    let smData = resData?.SocialMediaData;
                    this.smpService.postBodies = Object.assign(this.smpService.postBodies, {
                        [sid]: {
                            Files: getAttachments(tempAttachments, sid),
                            ConversationID: resData.ConversationID,
                            SessionId: sid,
                            SubChannel: (
                                channelMapper[smData?.Posts?.Channel?.toLowerCase()] ?? resData.EmailType
                            ).toLowerCase(),
                            Subject: resData.Subject,
                            PostAccountName: smData.Posts.AccountName
                                ? smData.Posts.AccountName
                                : smData.Posts.AccountId,
                            PostCreatedTime: smData.Posts?.CreatedDateTime,
                            PostUpdatedTime: smData.Posts?.UpdatedDateTime,
                            PostId: smData.Posts.PostId,
                            SmActiveComment: smData.Comments,
                            SmParentComments: smData.ParentComments,
                            PostText: smData.Posts.PostText,
                            PostAttachments: smData.Posts.PostAttachments,
                            PostEngagements: smData.Posts.PostEngagements,
                            Engagement: smData.Engagement,
                            IsOutbound: fetchFromOutbox && this.outSessionId,
                            IsParentCommentEdited: smData.ParentComments?.IsEdited,
                            IsParentCommentDeleted: smData.ParentComments?.IsDeleted,
                            IsCommentEdited: smData.Comments?.IsEdited,
                            IsCommentDeleted: smData.Comments?.IsDeleted,
                            IsPostDeleted: smData.Posts?.IsDeleted,
                            IsPostEdited: smData.Posts?.IsEdited,
                            RouteId: resData?.RouteId
                        }
                    });
                };

                if ((!this.smpService.postBodies[this.sessionId] || force) && !fetchFromOutbox) {
                    inboxRes = (await SDKClient.getInboxItem(this.sessionId)).response;
                    setPostBody(inboxRes, this.sessionId);
                }

                if (fetchFromOutbox && this.outSessionId && (!this.smpService.postBodies[this.outSessionId] || force)) {
                    outboxRes = (await SDKClient.getOutboxItem(this.outSessionId)).response;
                    setPostBody(outboxRes, this.outSessionId);
                }
                this.activeSessionId = fetchFromOutbox && this.outSessionId ? this.outSessionId : this.sessionId;
                this.cdr.detectChanges();
                resolve(true);
            } catch (error) {
                resolve(true);
                console.error();
            }
        });
    }

    /**
     * Closes post
     */
    closePost(): void {
        this._fuseProgressBarService.show();
        SDKClient.changeEmailStatus(
            {
                routeId: this.smpService.postBodies[this.activeSessionId].RouteId,
                sessionId: this.smpService.postBodies[this.activeSessionId].SessionId,
                status: SMP_SENT_REASONS.concat(SMP_DRAFT_REASONS).includes(this.routeReason)
                    ? `Outbox,Closed,sent,${this.smpService.postBodies[this.activeSessionId].OutSessionId}`
                    : 'CloseTab'
            },
            undefined,
            true
        )
            .then(() => {
                this.closeInteraction(true);
            })
            .catch(() => {
                this._appUiService.showSnackbar(
                    this.translocoService.translate('interactionComponent.closeInteractionFailed'),
                    'failure'
                );
            }).finally(() => {
                this._fuseProgressBarService.hide();
            })
    }

    restrictPostActionEvt(data: {interactionId: any, restrict: boolean}) {
        this.restrictPostActions[data.interactionId] = data.restrict;
    }

        /**
     * Transfers post
     */
    transferPost(): void {
        this.popupInteraction = false;
        const transferConfig = this.data.Data.Transfer ?? {};
        let data: AgentSkillListData = new AgentSkillListDataModel('transferPost', 'Transfer Post');
        data = merge({}, data, transferConfig);
        data = {
            ...data,
            InteractionId: this.interactionId,
            OtherData: {
                type: 'transfer',
                posts: [this.smpService.postBodies[this.activeSessionId]].map((p) => ({
                    ...p,
                    SessionId: this.activeSessionId
                }))
            }
        };

        this._matDialog.open(AgentSkillListComponent, {
            data,
            panelClass: [
                'agent-skill-dialog',
                'twd-w-11/12',
                'twd-h-10/12',
                'lg:twd-w-7/12',
                'lg:twd-h-8/12',
                'xl:twd-w-6/12',
                '2xl:twd-w-5/12'
            ],
            minWidth: '30%',
            maxWidth: '100%',
            disableClose: true
        });
    }
}
