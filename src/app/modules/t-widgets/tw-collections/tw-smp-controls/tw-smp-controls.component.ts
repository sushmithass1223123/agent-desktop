import { InteractionWidgetBaseData, TwSmpControls, TwSmpControlsData } from '@ad/types';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { SocialMediaPostsService } from '@modules/shared/components/social-media-posts/social-media-posts.service';
import { TranslocoService } from '@ngneat/transloco';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { IAgentData, IncomingEmailEvent, IResponse, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { EMAIL_CURRENTSTATUS_CODES, EMAIL_REASONCODE_VALUES } from 'app/constants';
import { InteractionRef, IWidget } from 'app/interfaces';
import { ADError, throwADError } from 'app/utils';
import { filter, takeUntil } from 'rxjs/operators';

declare var document: any;

type EmailEventGeneric = IncomingEmailEvent;

@Component({
    selector: 'tw-smp-controls',
    templateUrl: './tw-smp-controls.component.html',
    styleUrls: ['./tw-smp-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSmpControlsComponent extends TWidgetWrapper implements OnInit, AfterViewInit {
    /**
     * data from widget
     */
    @Input() data: IWidget<EmailEventGeneric, TwSmpControlsData & InteractionWidgetBaseData>;
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
    /**
     * List of all available interactions
     */
    interactionList: Partial<InteractionRef>[];
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
    /**
     * User info
     */
    user: IAgentData;
    /**
     * Current interaction
     */
    currentInteraction: any = {};

    actionStatus: {
        isClosingInteraction: boolean;
    } = {
        isClosingInteraction: false
    };

    maxFileUploadSize: number = 20971520;
    asyncReplySendTimeout: number = 60000;
    sendTimerId: any;

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService,
        private _interactionManagerService: InteractionManagerService,
        public smpService: SocialMediaPostsService,
        private _contentPageService: ContentPageService,
        private _appUiService: AppUiService,
        private _fuseProgressBarService: FuseProgressBarService
    ) {
        super('TwSmpControlsComponent');
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

    ngOnInit(): void {
        this.initWrapper(this.data);
        this.interactionId = this.data.InteractionDetails.InteractionID;
        this.sessionId = this.data.InteractionDetails.SessionId;
        this.currentInteraction = this.data.InteractionDetails;

        this.smpService.sendReply.subscribe((event: any) => this.onSendReply(event))

        this.maxFileUploadSize = this.data.Data.MaxFileUploadSize;
        this.asyncReplySendTimeout = this.data.Data.AsyncReplySendTimeout;

        console.log(this.smpService.postBodies[this.sessionId]);

        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                this.interactionList = interactions
                    .filter((i: InteractionRef) => i.type === 'smp')
                    .map((i) => {
                        this.isInteractionActive = i.interactionId === this.interactionId && i.isActive;
                        this.sessionId = this.data.InteractionDetails.SessionId;
                        return {
                            user: i.user,
                            status: i.status,
                            isActive: i.isActive,
                            interactionId: i.interactionId,
                            sessionId: i.otherData?.SessionId,
                            channel: this.smpService.postBodies[this.sessionId].SubChannel,
                            isPostReplySent: i.isPostReplySent
                        };
                    });
            });

        this.user = SDKClient.getAgentData() || null;
    }

    toggleInteractionPopup(): void {
        try {
            document.querySelector('.navbar-fuse-sidebar').style.zIndex = this.popupInteraction ? 1000 : 8;
            this.popupInteraction = !this.popupInteraction;
        } catch (error) {
            console.error(error);
        }
    }

    onMaximized(isMax: boolean): void {
        this.isMaximizedMode = isMax;
        this.maximizeEvent.emit(isMax);
    }

    onFloated(isFloat: boolean): void {
        this.isMaximizedMode = isFloat;
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
    closeInteraction(force = false): void {
        const closeApiCall = () => {
            this.actionStatus.isClosingInteraction = true;
            this._fuseProgressBarService.show();

            SDKClient.closeInteraction(this.interactionId.toString(), null)
                .then((dt: IResponse) => {
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
                    this.actionStatus.isClosingInteraction = false;
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

    async onSendReply(event: any) {
        try {
            let attachments = event.attachments;
            let body = event.body;

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
                this._fuseProgressBarService.show();
                const ref = this._appUiService.showSnackbar(
                    this.translocoService.translate('widgets.smpControls.sendPostReplyLoading'),
                    'loading'
                );
                const res = await SDKClient.sendEmail({
                    attachmentFileList: attachments && attachments.length ? JSON.stringify(attachments) : '',
                    body: body,
                    inboxSessionId: this.sessionId,
                    outboxSessionId: this.outSessionId || '',
                    routeId: '',
                    toList: '',
                    bccList: '',
                    typeOfResponse: '',
                    ccList: '',
                    subject: ''
                }).catch((e) => errCallback(e));
                // this._fuseProgressBarService.hide();
                ref.dismiss();
                if (!res || !res.response) {
                    this._appUiService.showSnackbar(
                        this.translocoService.translate('widgets.smpControls.emailSendConnectionError'),
                        'failure'
                    );
                    throwADError('Error in TwSmpControlsComponent.onSendReply', 'Unexpected response from Server');
                    return;
                }

                let reasonCodeMsg = EMAIL_REASONCODE_VALUES[res.response.SendStatus];

                if (res.response.CurrentStatus === 'EmailSending') {
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
                                isReplySent: true
                            });
                        }
                    }, timerTime);
                    reasonCodeMsg = EMAIL_REASONCODE_VALUES[100];
                }

                const currentStatusMsg = EMAIL_CURRENTSTATUS_CODES[res.response.CurrentStatus];
                if (!reasonCodeMsg) {
                    throwADError(
                        'Error in TwSmpControlsComponent.onSendReply',
                        'Unable to send post reply. Invalid Reason Code'
                    );
                }
                if (!currentStatusMsg) {
                    throwADError(
                        'Error in TwSmpControlsComponent.onSendReply',
                        'Unable to send post reply. Invalid Current Status'
                    );
                }
                if (reasonCodeMsg !== 'success') {
                    throwADError(
                        'Error in TwSmpControlsComponent.onSendReply',
                        `${reasonCodeMsg} [${res.response.SendStatus}]`
                    );
                }

                this._appUiService.showSnackbar(this.translocoService.translate(currentStatusMsg), 'success');
            } catch (err) {
                errCallback(err);
            }
        } catch (error) {
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
}
