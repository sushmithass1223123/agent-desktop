import {
    AgentSkillListData,
    AgentTransferConferenceConfig,
    InteractionWidgetBaseData,
    SkillTransferConferenceConfig,
    TwEmailControlsData
} from '@ad/types';
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AgentSkillListComponent } from '@modules/shared/components';
import { EmailComponent } from '@modules/shared/components/email/email.component';
import { EmailService } from '@modules/shared/components/email/email.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    EmailInboxModel,
    EmailOutboxModel,
    IAgentData,
    IncomingEmailEvent,
    InteractionDataEvent,
    IResponse,
    ISaveEmailAsEml,
    OutgoingEmailEvent,
    SDKClient,
    TUtils,
    UpdateEmailEvent
} from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { DRAFT_REASONS, EMAIL_CURRENTSTATUS_CODES, EMAIL_REASONCODE_VALUES, INBOX_REASONS, OUTBOX_REASONS, SENT_REASONS } from 'app/constants';
import {
    EmailComponentInputs,
    EmailComponentMode,
    EmailFile,
    InteractionComment,
    InteractionRef,
    IWidget,
    ResData,
    MediaStreamerMultiResponse,
    MediaStreamerMetaResponse
} from 'app/interfaces';
import { AgentSkillListDataModel } from 'app/models';
import { ADError, maticonByExtension, throwADError } from 'app/utils';
import { format, parse } from 'date-fns';
import { merge } from 'lodash';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { UIActionEventService } from '@services/ui-action-event.service';
import { AppDataService } from '@services/app-data.service';
import { SharedService } from '@services/shared.service';

type EmailEventGeneric = IncomingEmailEvent | OutgoingEmailEvent;

/**
 * Email controls component
 */
@Component({
    selector: 'tw-email-controls',
    templateUrl: './tw-email-controls.component.html',
    styleUrls: ['./tw-email-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwEmailControlsComponent extends TWidgetWrapper implements OnInit, AfterViewInit, OnDestroy {
    /**
     * data from widget
     */
    @Input() data: IWidget<EmailEventGeneric, TwEmailControlsData & InteractionWidgetBaseData>;

    /**
     * Reject email dialog
     */
    @ViewChild('rejectEmailDialog')
    RejectEmailDialog: TemplateRef<any>;

    /**
     * Email description collapse flag
     */
    smallEmailDescription = true;

    /**
     * Mat dialog ref for closing
     */
    rejectEmailDialogRef: MatDialogRef<any>;

    /**
     * File upload url config
     */
    fileUploadUrl: any;

    /**
     * Reject reason form inputs
     */
    rejectReason = {
        allReasons: [],
        reasonTags: '',
        comment: ''
    };

    /**
     * stateful getInboxMessageReq request
     */
    getInboxMessageReq: ResData<null> = {
        error: false,
        loading: false,
        msg: ''
    };

    /**
     * Outbox reasons
     */
    OutboxReasons = OUTBOX_REASONS;

    /**
     * Draft reasons
     */
    DraftReasons = DRAFT_REASONS;
    /**
     * Sent reason
     */
    SentReasons = SENT_REASONS;
    /**
     * Inbox reasons
     */
    InboxReasons = INBOX_REASONS;

    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };

    /**
     * Maximise event
     */
    @Output() maximizeEvent = new EventEmitter();

    /**
     * Float event
     */
    @Output() floatEvent = new EventEmitter();

    /**
     * Collapse event
     */
    @Output() collapseEvent = new EventEmitter();

    /**
     * Maximized flag
     */
    maximized: boolean;

    /**
     * Interaction list
     */
    // interactionList: Observable<InteractionRef[]>;
    interactionList: Partial<InteractionRef>[];

    /**
     * Current interaction
     */
    currentInteraction: any = {};

    /**
     * Email body responses
     */
    emailBodies: Record<string, any> = {};

    /**
     * Current intreaction id
     */
    interactionId: number;

    /**
     * User info
     */
    user: IAgentData;

    /**
     * Email intent
     */
    intent: string;

    /**
     * Customer sentiment
     */
    sentiment: string;

    /**
     * Reply info for create email component
     */
    replyInfo$: BehaviorSubject<EmailComponentInputs>;

    /**
     * Email component;s mode
     */
    emailComponentMode: EmailComponentMode = 'preview';

    /**
     * A map of reply infos , saved for when interaction is switched
     */
    // replyInfoMap: Record<string, CreateEmailInput> = {};

    /**
     * Saved interaction comments
     */
    savedComments: InteractionComment[] = [];

    /**
     * Draft pollling subscription
     */
    draftPolling$: Subscription;

    /**
     * Duration interval for saving email as draft in milliseconds
     */
    draftPollDuration = 0;

    /**
     * Viewing email ref
     */
    emailInView: 'original' | 'replied' = 'replied';

    /**
     * Show more Attachments flag
     */
    showAttachments = false;

    /**
     * Flag to indicate while sending email
     */
    sendingEmailAsMaker = false;

    /**
     * Flag to check if interaction is active
     */
    isInteractionActive = false;

    /**
     * Flag to check if interaction is active
     */
    prevFiles = [];

    /**
     * Send Timer ref
     */
    sendTimerId: any;

    @ViewChild(EmailComponent)
    emailRef: EmailComponent;

    constructor(
        private _interactionManagerService: InteractionManagerService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService,
        private matDialog: MatDialog,
        private _tmacEventService: TMACEventService,
        private _contentPageService: ContentPageService,
        private _fuseFacadeService: FuseFacadeService,
        private _emailService: EmailService,
        private translocoService: TranslocoService,
        private uiActionEventService: UIActionEventService,
        private _appDataService: AppDataService,
        private _sharedService: SharedService
    ) {
        super('TwEmailControlsComponent');
    }

    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * OnInit
     */
    async ngOnInit(): Promise<void> {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.interactionId = this.data.InteractionDetails.InteractionID;
        this.currentInteraction = this.data.InteractionDetails;
        this.draftPollDuration = this.data.Data.DraftPollingInterval;
        this._emailService.emailTemplatesDepartmentsByTeam = !!this.data.Data.TemplatesByTeam;
        this._emailService.emailTemplatesDepartmentsByHierarchy = !!this.data.Data.TemplatesByHierarchy;

        this._sharedService.getEmailFailure().subscribe((interactionId: number) => {
            if (this.currentInteraction.InteractionID === interactionId) {
                clearTimeout(this.sendTimerId);
            }
        });

        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            // filter out the textchat interaction
            this.interactionList = interactions
                .filter((i: InteractionRef) => i.type === 'email')
                .map((i) => {
                    this.isInteractionActive = i.interactionId === this.interactionId && i.isActive;
                    return {
                        user: i.user,
                        status: i.status,
                        isActive: i.isActive,
                        interactionId: i.interactionId,
                        isEmailSent: i.isEmailSent
                    };
                });
        });

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fileUploadUrl = config.Main.Urls?.FileServerUrl || null;
        });

        // -----------------------------------------------------------------------------------------------------
        if (this.currentInteraction.EventName === 'IncomingEmailEvent') {
            // Set common session id keys for both incoming / outgoing email events
            this.currentInteraction.InSessionId = this.currentInteraction.SessionId;
            this.currentInteraction.OutSessionId = this.currentInteraction.OutSessionID;

            // set the intent
            this.intent = this.currentInteraction.Intent || 'NA';

            // set the sentiment
            this.sentiment = this.currentInteraction.Sentiment || 'NA';
            const interaction = this.currentInteraction;
            interaction.Email_Mailbox = interaction.RecoveryData.Email_Mailbox;
            try {
                await this.setEmailDetails();
                if (['AgentDraftPull'].includes(this.currentInteraction.RouteReason)) {
                    setTimeout(() => {
                        this.showDraftEditor();
                    }, 0);
                }
                if (OUTBOX_REASONS.includes(this.currentInteraction.RouteReason)) {
                    this.currentInteraction.CurrOutSessionId = this.currentInteraction.OutSessionId;
                    this.rejectReason.allReasons = this.currentInteraction.JsonData?.split(',') || [];
                } else if (this.currentInteraction.JsonData) {
                    try {
                        this.currentInteraction.ParsedJsonData = JSON.parse(this.currentInteraction.JsonData);
                    } catch (e) {
                        console.error(`Invalid json data for ${this.currentInteraction.RouteReason}`);
                    }
                }
                if (this.currentInteraction.RejectReason && typeof this.currentInteraction.RejectReason === 'string') {
                    this.currentInteraction.RejectReason = JSON.parse(this.currentInteraction.RejectReason);
                    this.currentInteraction.RejectReason.reasonTags = this.currentInteraction.RejectReason.reasonTags?.join(',') || '';
                }
                this.getInboxMessageReq = { error: false, loading: false };
            } catch (err) {
                console.error(err);
                let msg = this.translocoService.translate('widgets.emailControls.getEmailbodyFailed');
                if (err instanceof ADError) {
                    msg = err.message;
                }
                this.getInboxMessageReq = {
                    error: true,
                    loading: false,
                    msg
                };
            }

            // play new email sound
            this._appUIService.playAudio('new-email', 0.5, false);
            this._appUIService.showDesktopAlert(
                'Incoming Email',
                this.translocoService.translate('widgets.emailControls.incomingEmailNotification') + ' ' + this.currentInteraction.From,
                false
            );
        } else {
            this.showComposeEditor();
        }

        // set the user info
        this.user = SDKClient.getAgentData() || null;

        this._tmacEventService
            .getInteractionEvents(['InteractionDataEvent', 'UpdateEmailEvent'], this.interactionId)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        this.uiActionEventService.addUIEventListeners('EmailAction', this.uiActionEventService.onEmailAction);
    }

    /**
     * Sets email component's input
     */
    initEmailComponent(): void {
        if (!this.replyInfo$) {
            this.replyInfo$ = new BehaviorSubject(this.getReplyInfo());
            return;
        }
        this.replyInfo$.next(this.getReplyInfo());
    }

    /**
     * Checks if email is sent or not
     */
    isEmailSent(interactionId: any): boolean {
        let interaction = this.interactionList.find((i) => i.interactionId === interactionId);

        if (interaction && interaction.isEmailSent === false) {
            return false;
        }
        return true;
    }

    /**
     * Shows the editor for incoming draft emails
     */
    showDraftEditor(): void {
        this.emailComponentMode = 'draft';
        this.currentInteraction.CurrOutSessionId = this.currentInteraction.OutSessionId;
        this.saveEmailAsDraft();
    }

    /**
     * Shows editor for new compose email
     */
    showComposeEditor(): void {
        this.initEmailComponent();
        this.emailComponentMode = 'compose';
        this.currentInteraction.CurrOutSessionId = this.currentInteraction.OutSessionId;
        this.saveEmailAsDraft();
    }

    /**
     * TODO
     * Updates email when a new email is sent to agent from the same customer
     * @param {UpdateEmailEvent}  _evt
     */
    UpdateEmailEvent(_evt: UpdateEmailEvent): void {
        // this.setEmailDetails();
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngAfterViewInit(): void {
        // if route to page is enabled
        let route = false;

        // check if auto route is needed
        if (this.currentInteraction?.RouteReason?.toLowerCase().includes('pull') || this.currentInteraction.EventName === 'OutgoingEmailEvent') {
            route = true;
        }

        // check if the current page is email page
        if (route || (this.data.Data.RouteOnInteraction && this._interactionManagerService.getInteractionCount().active <= 1)) {
            setTimeout(
                (r) => {
                    // navigate if not same page
                    if (this._contentPageService.getCurrentMode() !== this.data.Data.Path) {
                        this._contentPageService.mode = this.data.Data.Path;
                    }

                    // if we pull/create a email then route to that particular email
                    if (r) {
                        const interaction = this.interactionList.filter((i) => i.interactionId === this.currentInteraction?.InteractionID)[0];
                        if (interaction && !interaction?.isActive) {
                            this.selectInteraction(interaction as InteractionRef, true);
                        }
                    }
                },
                500,
                route
            );
        }
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this.uiActionEventService.removeUIEventListeners('EmailAction', this.uiActionEventService.onEmailAction);
        this.sendTimerId && clearTimeout(this.sendTimerId);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To handle InteractionDataEvent
     */
    private InteractionDataEvent(evt: InteractionDataEvent): void {
        // check the channel
        if (evt.Channel !== 'Email') {
            return;
        }
        // check if interaction comments available
        if (evt.InteractionComments && evt.InteractionComments.length > 0) {
            evt.InteractionComments.forEach((c) => {
                const dt = JSON.parse(c);
                this.savedComments.push({
                    Message: dt.Comment,
                    Time: dt.Time,
                    User: dt.User
                });
            });
        }
    }

    /**
     * To switch email view
     */
    async switchEmailView(): Promise<void> {
        let requestedSession: string | null = null;
        if (this.emailInView === 'original') {
            this.emailInView = 'replied';
            requestedSession = this.currentInteraction.OutSessionId;
        } else {
            this.emailInView = 'original';
            requestedSession = this.currentInteraction.InSessionId;
        }
        if (this.emailBodies[requestedSession]) {
            this.currentInteraction = {
                ...this.currentInteraction,
                ...this.emailBodies[requestedSession]
            };
            this.initEmailComponent();
        } else {
            this.setEmailDetails();
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
                        let split = cur.URL.split('/');
                        if (split.length > 0) {
                            let fileId = split[split.length - 1];
                            acc.ids.push(fileId);
                            acc.att.push({ ...cur, FileId: fileId });
                        } else {
                            acc.att.push({ ...cur });
                        }
                    } else {
                        acc.att.push({ ...cur });
                    }
                    return acc;
                },
                { ids: [], att: [] }
            );
            if (attachmentMap.ids.length > 0) {
                let ids = attachmentMap.ids.join(',');
                try {
                    const { response } = await TUtils.HttpClient.sendRequest<MediaStreamerMultiResponse<MediaStreamerMetaResponse>>({
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
                } catch (error) {
                    this._appUIService.showSnackbar(this.translocoService.translate('sharedComponents.email.fileMetaError'), 'failure');
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
     * Sets email's body and some other details
     */
    async setEmailDetails(retry = false): Promise<void> {
        const interaction = this.currentInteraction;
        this.initEmailComponent();
        const fetchFromOutbox =
            OUTBOX_REASONS.concat(DRAFT_REASONS).concat(SENT_REASONS).includes(interaction.RouteReason) && this.emailInView === 'replied';
        this.getInboxMessageReq = { error: false, loading: true };

        let inboxRes: EmailInboxModel;
        let outboxRes: EmailOutboxModel;

        const errCallback = () => {
            const msg = this.translocoService.translate('widgets.emailControls.errorFromServer');
            if (retry) {
                this._appUIService.showSnackbar(msg, 'failure');
                this.getInboxMessageReq = { error: true, loading: false };
            } else {
                throwADError('Error in TwEmailControlsComponent.setEmailDetails', msg);
            }
        };

        const successCallback = (res: any, sessionId: string): void => {
            if (res.Attachments && res.Attachments.length) {
                res.Attachments.forEach((item: any) => {
                    let uploadedName = item.URL.split('/').pop();
                    if (!item.Name) {
                        // get the file name from URL
                        uploadedName = uploadedName.replace(item.SessionID, '');
                        item.Name = uploadedName;
                    }
                    item.Ext = item.Name.split('.').pop();
                    item.Icon = maticonByExtension(item.Ext);
                    item.Status = 'ARCHIVED';
                });
            }

            let priorityIcon = '';
            switch (inboxRes?.Priority.toLowerCase()) {
                case 'high':
                    priorityIcon = 'priority_high';
                    break;
                case 'normal':
                    priorityIcon = 'info';
                    break;
                case 'low':
                    priorityIcon = 'low_priority';
                    break;
            }

            // Adding email body to the cache
            // so that next time when it is switched form Replied -> Original or vice versa it doesnt need to be fetched
            this.emailBodies[sessionId] = {
                CCList: res.CCList,
                BCCList: res.BCCList,
                Body: res.Body,
                Subject: res.Subject,
                AttachmetList: res?.Attachments || [],
                To: res.ToList,
                EmailReceivedTime:
                    inboxRes?.ReceivedDate && inboxRes.ReceivedTime
                        ? parse(inboxRes.ReceivedDate + inboxRes.ReceivedTime, 'yyyyMMddHHmmss', new Date()).toString()
                        : '',
                EmailSentTime:
                    outboxRes?.SendDate && outboxRes.SendTime
                        ? parse(outboxRes.SendDate + outboxRes.SendTime, 'yyyyMMddHHmmss', new Date()).toString()
                        : '',
                From: res.From,
                AgentName: res.AgentName,
                ConversationID: res.ConversationID,
                CurrentStatus: res.CurrentStatus,
                ClosedBy: (res as any).ClosedBy,
                Priority: inboxRes?.Priority,
                PriorityIcon: priorityIcon,
                RepliedStatus: inboxRes?.RepliedStatus === '1' ? 'Replied' : 'Not Replied',
                Intent: inboxRes?.Intent,
                InternetHeaders: inboxRes?.InternetHeaders
            };
        };

        const res1 = await SDKClient.getInboxEmail(interaction.InSessionId).catch((err) => {
            console.error(err);
            errCallback();
            return;
        });

        this.currentInteraction.showReplyEmailEnabled = fetchFromOutbox;

        if (res1) {
            inboxRes = res1.response;
            if (inboxRes.EmailType !== 'Dummy') {
                let attch = await this.requestAttachmentData(inboxRes.Attachments);
                inboxRes.Attachments = attch;
                successCallback(inboxRes, this.currentInteraction.InSessionId);
            } else {
                this.currentInteraction.showReplyEmailEnabled = false;
            }
        }

        if (fetchFromOutbox) {
            const res2 = await SDKClient.getOutboxEmail(interaction.OutSessionId).catch((err) => {
                console.error(err);
                errCallback();
                return;
            });
            if (res2) {
                outboxRes = res2.response;
                let attch = await this.requestAttachmentData(outboxRes.Attachments);
                outboxRes.Attachments = attch;
                successCallback(outboxRes, this.currentInteraction.OutSessionId);
            }
        }

        this.getInboxMessageReq = { error: false, loading: false };
        const emailInteractionDetails = {
            ...this.currentInteraction,
            ...this.emailBodies[fetchFromOutbox ? this.currentInteraction.OutSessionId : this.currentInteraction.InSessionId]
        };
        this.currentInteraction = emailInteractionDetails;
        this.initEmailComponent();
    }

    /**
     * Closes emails
     * @param {MatButton} btn
     */
    closeEmail(btn?: MatButton, force = false): void {
        const closeApiCall = () => {
            const currentInteraction = this.currentInteraction;
            // show the progress bar
            this._fuseProgressBarService.show();
            // disable the button
            if (btn) {
                btn.disabled = true;
            }
            SDKClient.changeEmailStatus({
                routeId: currentInteraction.RouteId,
                sessionId: currentInteraction.InSessionId,
                status: this.SentReasons.concat(this.DraftReasons).includes(this.currentInteraction.RouteReason)
                    ? `Outbox,Closed,sent,${this.currentInteraction.OutSessionId}`
                    : 'Close'
            })
                .then(() => {
                    this._fuseProgressBarService.hide();
                    this.closeInteraction(btn, true);
                })
                .catch(() => {
                    this._fuseProgressBarService.hide();
                    this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.closeInteractionFailed'), 'failure');
                })
                .finally(() => {
                    if (btn) {
                        btn.disabled = false;
                    }
                });
        };
        // disable the button
        if (btn) {
            btn.disabled = true;
        }
        if (force) {
            closeApiCall();
        } else {
            // confirm close interaction
            const confirmDialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
            confirmDialogRef.afterClosed().subscribe((dialogResult: boolean | undefined) => {
                if (dialogResult) {
                    closeApiCall();
                } else if (btn) {
                    btn.disabled = false;
                }
            });
        }
    }

    /**
     * Closes current interaction
     * @param {MatButton} btn
     */
    closeInteraction(btn?: MatButton, force = false): void {
        const closeApiCall = () => {
            // show the progress bar
            this._fuseProgressBarService.show();
            SDKClient.closeInteraction(this.interactionId.toString(), null)
                .then((dt: IResponse) => {
                    // hide the progress bar
                    this._fuseProgressBarService.hide();
                    // check the response
                    if (dt.response && dt.response.ResultCode === 0) {
                        this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.closeInteractionSuccess'));
                        // remove the interaction reference
                        this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                    } else {
                        this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.closeInteractionFailed'), 'failure');
                    }
                })
                .catch(() => {
                    this._fuseProgressBarService.hide();
                    this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.closeInteractionFailed'), 'failure');
                })
                .finally(() => {
                    if (btn) {
                        btn.disabled = false;
                    }
                });
        };
        // disable the button
        if (btn) {
            btn.disabled = true;
        }
        if (force) {
            closeApiCall();
        } else {
            // confirm close interaction
            const confirmDialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
            confirmDialogRef.afterClosed().subscribe((dialogResult: boolean | undefined) => {
                if (dialogResult) {
                    closeApiCall();
                } else if (btn) {
                    btn.disabled = false;
                }
            });
        }
    }

    /**
     * Deletes the draft copy of the email
     */
    async deleteDraftEmail(): Promise<void> {
        try {
            const { InSessionId, CurrOutSessionId } = this.currentInteraction;
            if (CurrOutSessionId || this.draftPollDuration) {
                await SDKClient.deleteBulkEmailsInDraft(`${InSessionId}|${CurrOutSessionId}`).catch((err) =>
                    throwADError('Unable to delete emails', '')
                );
            }
        } catch (e) {
            console.error('Unable to delete the draft copy of the email');
            console.error(e);
        }
    }

    /**
     * Select Interaction
     * @method selectInteraction
     * @param {InteractionRef} item
     * @param {Boolean} force
     */
    public selectInteraction(item: InteractionRef, force?: boolean): void {
        // if same interaction is seleted then return
        if (!force && this.interactionId === item.interactionId) {
            return;
        }
        this.emailInView = 'replied';
        // update is active
        this._interactionManagerService.updateInteraction(item.interactionId, {
            isActive: true
        });
    }

    /**
     * Show reply email form
     */
    showReplyEditor(): void {
        this.emailComponentMode = 'reply';
        setTimeout(() => {
            this.saveEmailAsDraft();
        }, 0);
    }

    /**
     * Show reply all email editor
     */
    showReplyAllEmailEditor(): void {
        this.emailComponentMode = 'reply-all';
        setTimeout(() => {
            this.saveEmailAsDraft();
        }, 0);
    }

    /**
     * Show forward email editor
     */
    showForwardEmailEditor(): void {
        this.emailComponentMode = 'forward';
        setTimeout(() => {
            this.saveEmailAsDraft();
        }, 0);
    }

    /**
     * Sends Email as Maker
     */
    async sendEmailAsMaker(email?: EmailComponentInputs, btn?: MatButton): Promise<void> {
        const errCallback = (err) => {
            console.error(err);
            let msg = this.translocoService.translate('widgets.emailControls.sendEmailError');
            if (btn) {
                btn.disabled = false;
            }
            if (err instanceof ADError) {
                msg = err.message;
            }
            this.sendingEmailAsMaker = false;
            this._fuseProgressBarService.hide();
            this._appUIService.showSnackbar(msg, 'failure');
        };
        try {
            const { InSessionId, RouteId, CurrOutSessionId } = this.currentInteraction;
            const { BCC, CC, To, Subject, Files, Body } = email || this.emailRef.getEmail();

            let filesInArchive = Files.find((f: any) => {
                return f.ArchiveStatus || f.FileError;
            });

            let sendEmailProcess = async () => {
                let confirmSend = true;
                if (!Subject) {
                    confirmSend = await this._appUIService
                        .showAppConfirmDialog('generic', 'Confirm Send', this.translocoService.translate('widgets.emailControls.noSubjectWarning'))
                        .afterClosed()
                        .pipe(take(1))
                        .toPromise();
                }
                if (!confirmSend) {
                    return;
                }

                if (!To.length) {
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.recipientMissingError'), 'failure');
                    return;
                }

                if (btn) {
                    btn.disabled = true;
                }
                this.sendingEmailAsMaker = true;
                // this._fuseProgressBarService.show();
                const ref = this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.sendEmailLoading'), 'loading');
                const res = await SDKClient.sendEmail({
                    attachmentFileList: Files && Files.length ? JSON.stringify(Files) : '',
                    bccList: BCC.join(','),
                    toList: To.join(','),
                    ccList: CC.join(','),
                    body: Body,
                    inboxSessionId: InSessionId,
                    outboxSessionId: CurrOutSessionId || '',
                    routeId: RouteId || '',
                    subject: Subject,
                    // the replace is done so that if the mode is 'reply-all', the '-all' is removed
                    typeOfResponse: this.emailRef.mode.replace('-all', '')
                }).catch((e) => errCallback(e));
                // this._fuseProgressBarService.hide();
                ref.dismiss();
                if (!res || !res.response) {
                    this.sendingEmailAsMaker = false;
                    this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.emailSendConnectionError'), 'failure');
                    throwADError('Error in TwEmailControlsComponent.sendEmailAsMaker', 'Unexpected response from Server');
                    return;
                }
                // Check if the request was sucessful by checking SendStatus,CurrentStatus in repsonse
                // Display the message in snackbar accordingly
                let reasonCodeMsg = EMAIL_REASONCODE_VALUES[res.response.SendStatus];
                if (res.response.CurrentStatus === 'EmailSending') {
                    this._interactionManagerService.updateInteraction(this.currentInteraction.InteractionID, {
                        isEmailSent: false
                    });
                    let timerTime = this.data.Data.AsyncEmailSendTimeout ? this.data.Data.AsyncEmailSendTimeout : 60000;
                    this.sendTimerId = setTimeout(() => {
                        let isSent = this.isEmailSent(this.currentInteraction?.InteractionID);
                        if (!isSent && this.currentInteraction.InteractionID) {
                            this._appUIService.showSnackbar(
                                this.translocoService.translate('sharedComponents.email.emailSendTimeoutMessage'),
                                'failure'
                            );

                            this._interactionManagerService.updateInteraction(this.currentInteraction.InteractionID, {
                                isEmailSent: true
                            });
                        }
                    }, timerTime);
                    reasonCodeMsg = EMAIL_REASONCODE_VALUES[100];
                }

                const currentStatusMsg = EMAIL_CURRENTSTATUS_CODES[res.response.CurrentStatus];
                if (!reasonCodeMsg) {
                    throwADError('Error in TwEmailControlsComponent.sendEmailAsMaker', 'Unable to send email. Invalid Reason Code');
                }
                if (!currentStatusMsg) {
                    throwADError('Error in TwEmailControlsComponent.sendEmailAsMaker', 'Unable to send email. Invalid Current Status');
                }
                if (reasonCodeMsg !== 'success') {
                    throwADError('Error in TwEmailControlsComponent.sendEmailAsMaker', `${reasonCodeMsg} [${res.response.SendStatus}]`);
                }
                if (btn) {
                    btn.disabled = false;
                }
                this.sendingEmailAsMaker = false;

                this._appUIService.showSnackbar(this.translocoService.translate(currentStatusMsg), 'success');

                if (res.response.CurrentStatus !== 'EmailSending') {
                    this.draftPolling$?.unsubscribe();
                    this.emailRef.mode = 'preview';
                }

                // if (this.currentInteraction.RouteReason === 'AgentDraftPull') {
                //     this.deleteDraftEmail();
                // }
            };

            if (filesInArchive) {
                const confirmDialogRef = this._appUIService.showAppConfirmDialog(
                    'generic',
                    this.translocoService.translate('sharedComponents.email.emailSendConfirmHeader'),
                    this.translocoService.translate('sharedComponents.email.emailConfirmBody')
                );

                const dialogResult = await confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)).pipe(take(1)).toPromise();
                if (dialogResult) {
                    sendEmailProcess();
                }
            } else {
                sendEmailProcess();
            }
        } catch (err) {
            errCallback(err);
        }
    }

    /**
     * Sends email as Checker
     */
    async sendEmailAsChecker(btn: MatButton): Promise<void> {
        const errCallback = (err) => {
            console.error(err);
            const msg = this.translocoService.translate('widgets.emailControls.approveEmailFailed');
            sendLoader?.dismiss();
            this._appUIService.showSnackbar(msg, 'failure');
            btn.disabled = false;
        };
        let sendLoader;
        try {
            btn.disabled = true;
            const { InSessionId, CurrOutSessionId, RouteId, Body, Subject, CCList, BCCList, To, AttachmetList } = this.currentInteraction;
            const confirmDialogRef = this._appUIService.showAppConfirmDialog(
                'generic',
                'Confirm Approve',
                this.translocoService.translate('widgets.emailControls.approveEmailConfirmMsg')
            );
            const dialogResult: boolean = await confirmDialogRef.afterClosed().toPromise();
            if (dialogResult) {
                // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
                // const { Files: AttachmetList, Body, To: toList, CC, BCC, Subject } = this.getReplyInfo();
                sendLoader = this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.approveEmailLoading'), 'loading');

                let filesInArchive = AttachmetList.find((f: any) => {
                    return f.ArchiveStatus || f.FileError;
                });

                let sendEmailProcess = async () => {
                    const res = await SDKClient.sendEmail({
                        attachmentFileList: AttachmetList && AttachmetList.length ? JSON.stringify(AttachmetList) : '',
                        bccList: BCCList || '',
                        body: Body,
                        ccList: CCList || '',
                        inboxSessionId: InSessionId,
                        outboxSessionId: CurrOutSessionId || '',
                        routeId: RouteId || '',
                        subject: Subject,
                        toList: To || '',
                        typeOfResponse: 'approve'
                    }).catch((e) => errCallback(e));
                    // this._fuseProgressBarService.hide();
                    if (!res || !res.response) {
                        this._appUIService.showSnackbar(
                            this.translocoService.translate('sharedComponents.emailControls.emailSendConnectionError'),
                            'failure'
                        );
                        throwADError('Error in TwEmailControlsComponent.sendEmailAsChecker', 'Unexpected response from Server');
                        return;
                    }

                    // Check if the request was sucessful by checking SendStatus,CurrentStatus in repsonse
                    // Display the message in snackbar accordingly
                    let reasonCodeMsg = EMAIL_REASONCODE_VALUES[res.response.SendStatus];
                    if (res.response.CurrentStatus === 'EmailSending') {
                        let timerTime = this.data.Data.AsyncEmailSendTimeout ? this.data.Data.AsyncEmailSendTimeout : 60000;
                        this.sendTimerId = setTimeout(() => {
                            let isSent = this.isEmailSent(this.currentInteraction?.InteractionID);
                            if (!isSent && this.currentInteraction.InteractionID) {
                                this._appUIService.showSnackbar(
                                    this.translocoService.translate('sharedComponents.email.emailSendTimeoutMessage'),
                                    'failure'
                                );
                                this._interactionManagerService.updateInteraction(this.currentInteraction.InteractionID, {
                                    isEmailSent: true
                                });
                            }
                        }, timerTime);
                        reasonCodeMsg = EMAIL_REASONCODE_VALUES[100];
                    }

                    const currentStatusMsg = EMAIL_CURRENTSTATUS_CODES[res.response.CurrentStatus];
                    if (!reasonCodeMsg) {
                        throwADError('Error in TwEmailControlsComponent.sendEmailAsChecker', 'Unable to send email. Invalid Reason Code');
                    }
                    if (!currentStatusMsg) {
                        throwADError('Error in TwEmailControlsComponent.sendEmailAsChecker', 'Unable to send email. Invalid Current Status');
                    }
                    if (reasonCodeMsg !== 'success') {
                        throwADError('Error in TwEmailControlsComponent.sendEmailAsChecker', `${reasonCodeMsg} [${res.response.SendStatus}]`);
                    }

                    if (res.response.CurrentStatus === 'EmailSending') {
                        this._interactionManagerService.updateInteraction(this.currentInteraction.InteractionID, {
                            isEmailSent: false
                        });
                    }
                    this._appUIService.showSnackbar(this.translocoService.translate(currentStatusMsg), 'success');
                    this.draftPolling$?.unsubscribe();
                    sendLoader?.dismiss();
                    btn.disabled = false;
                };

                if (filesInArchive) {
                    const confirmDialogRef = this._appUIService.showAppConfirmDialog(
                        'generic',
                        this.translocoService.translate('sharedComponents.email.emailSendConfirmHeader'),
                        this.translocoService.translate('sharedComponents.email.emailConfirmBody')
                    );

                    const dialogResult = await confirmDialogRef.afterClosed().pipe(takeUntil(this.unsubscribeAll)).pipe(take(1)).toPromise();

                    if (dialogResult) {
                        sendEmailProcess();
                    } else {
                        btn.disabled = false;
                    }
                } else {
                    sendEmailProcess();
                }
            } else {
                btn.disabled = false;
            }
        } catch (err) {
            errCallback(err);
        }
    }

    compareArrays(arr1: Array<any>, arr2: Array<any>): { isModified: boolean; changes: Array<any> } {
        const result = [];
        let isModified = false;

        // Check if arr1 is empty, consider only IsUploaded objects as "Added"
        if (arr1.length === 0) {
            for (const obj of arr2) {
                if (obj.IsUploaded) {
                    isModified = true;
                    result.push(`${obj.URL}|1`);
                }
            }
            return { isModified: isModified, changes: result };
        }

        // Check for objects added, unchanged or removed
        for (const obj of arr2) {
            const match = arr1.find((item) => item.URL === obj.URL);
            if (match) {
                result.push(`${obj.URL}|0`);
            } else {
                if (obj.IsUploaded) {
                    isModified = true;
                }
                result.push(`${obj.URL}|${obj.IsUploaded ? '1' : '0'}`);
            }
        }

        // Check for objects removed
        for (const obj of arr1) {
            const match = arr2.find((item) => item.URL === obj.URL);
            if (!match) {
                isModified = true;
                result.push(`${obj.URL}|2`);
            }
        }

        return { isModified: isModified, changes: result };
    }

    /**
     * Save email as Draft
     */
    saveEmailAsDraft(closeEmail = false, btn?: MatButton): void {
        const callback = () => {
            const { InSessionId, RouteId, CurrOutSessionId } = this.currentInteraction;
            const email = this.emailRef?.getEmail();
            // @TODO Files not sent as draft arg
            let { AttachmetList: Files, Body, To, CC, BCC, Subject } = this.currentInteraction;
            if (email) {
                BCC = (email.BCC || []).join(',');
                To = (email.To || []).join(',');
                CC = (email.CC || []).join(',');
                Body = email.Body;
                Subject = email.Subject;
                Files = email.Files;
            }
            let { isModified, changes } = this.compareArrays(this.prevFiles, Files);
            this.prevFiles = [...Files];
            SDKClient.saveEmailDraft({
                bccList: BCC || '',
                body: (Body || '').toString(),
                ccList: CC || '',
                inboxSessionId: InSessionId,
                outboxSessionId: CurrOutSessionId || '',
                routeId: RouteId || '',
                subject: Subject || '',
                toList: To || '',
                typeOfResponse: '',
                attachmentList: changes,
                isAttachmentModified: isModified
            })
                .then((x) => {
                    if (x.response) {
                        this.currentInteraction.CurrOutSessionId = x.response;
                    } else {
                        throwADError('Unable to save as draft', new Error('Invalid server response'));
                    }
                    if (btn) {
                        btn.disabled = false;
                    }
                    if (closeEmail) {
                        this.closeInteraction(btn, true);
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
        };
        const poll = () => {
            if ((!this.draftPolling$ || this.draftPolling$.closed) && this.draftPollDuration) {
                const polling = interval(this.draftPollDuration);
                this.draftPolling$ = polling.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
                    callback();
                });
            }
        };
        poll();
        callback();
        // return { force: callback };
    }

    /**
     * Closes the editor
     */
    closeEditor(btn?: MatButton, closeEmail = false): void {
        // confirm close interaction
        const confirmDialogRef = this._appUIService.showCustomDialog(
            'confirm',
            '',
            this.translocoService.translate('widgets.emailControls.closeEditorConfirmMsg'),
            {
                yesMessage: this.translocoService.translate('widgets.emailControls.yes'),
                noMessage: this.translocoService.translate('widgets.emailControls.noClose')
            },
            {
                disableClose: false
            }
        );
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean | undefined) => {
            this._interactionManagerService.updateInteraction(this.currentInteraction.InteractionID, {
                isEmailSent: true
            });
            if (dialogResult) {
                this.saveEmailAsDraft(closeEmail, btn);
                // this.replyInfo = null;
                this.emailComponentMode = 'preview';
            } else {
                // this checks if the user clicked on cancel, or on the overlay
                // if the user clicks on cancel, this will be boolean false. Else it will be undefined
                if (dialogResult === false) {
                    this.deleteDraftEmail();
                    if (closeEmail) {
                        this.closeInteraction(null, true);
                        return;
                    }
                    // this.replyInfo = null;
                    this.emailComponentMode = 'preview';
                }
                if (btn) {
                    btn.disabled = false;
                }
            }
            this.draftPolling$?.unsubscribe();
        });
    }

    /**
     * Rejects email, only available for checkers
     */
    rejectEmail(evt: MatButton): void {
        evt.disabled = true;
        const currentInteraction = this.currentInteraction;
        this.rejectEmailDialogRef = this.matDialog.open(this.RejectEmailDialog, {
            panelClass: 'reject-reason-dialog',
            maxWidth: '450px',
            disableClose: true
        });
        this.rejectEmailDialogRef.afterClosed().subscribe(() => {
            const { comment, reasonTags } = this.rejectReason;
            if (comment) {
                SDKClient.rejectEmail({
                    reason: JSON.stringify({ comment, reasonTags }),
                    routeId: currentInteraction.RouteId,
                    sessionId: currentInteraction.OutSessionId
                })
                    .then((rejectEmailRes) => {
                        if (rejectEmailRes.response < 0) {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.rejectEmailFailed'), 'failure');
                        } else {
                            this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.rejectEmailSuccess'));
                            this.closeEmail(null, true);
                        }
                        this._fuseProgressBarService.hide();
                    })
                    .catch((ex) => {
                        console.error(ex);
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.rejectEmailError'), 'failure');
                    })
                    .finally(() => {
                        evt.disabled = false;
                    });
            }
            evt.disabled = false;
        });
    }

    /**
     * Marks currently selected email as spam
     */
    markAsSpam(): void {
        const confirmDialogRef = this._appUIService.showAppConfirmDialog(
            'generic',
            'Confirm Spam',
            this.translocoService.translate('widgets.emailControls.markSpamConfirmMsg')
        );
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
                const currentInteraction = this.currentInteraction;
                const loader = this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.markSpamLoading'), 'loading');
                SDKClient.markEmailAsSpam({
                    fromAddress: currentInteraction.From,
                    routeId: currentInteraction.RouteId,
                    sessionId: currentInteraction.InSessionId
                })
                    .then((res) => {
                        loader.dismiss();
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.markSpamSuccess'));
                    })
                    .catch((err) => {
                        console.error(err);
                        this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.markSpamFailed'), 'failure');
                    });
            }
        });
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

        const dialogRef = this._appUIService.showCustomDialog(
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
                    interactionId: this.interactionId.toString()
                })
                    .then((resp2) => {
                        if (resp2.response > 0) {
                            // add comments to the reference
                            this.savedComments.push({
                                Message: resp1,
                                Time: new Date(),
                                User: SDKClient.getAgentData().agentName
                            });
                            // alert user
                            this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.saveICSuccess'));
                        } else {
                            this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.saveICFailed'), 'failure');
                        }

                        this._fuseProgressBarService.hide();
                    })
                    .catch(() => {
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.saveICError'), 'failure');
                    });
            }
        });
    }

    /**
     * Transfers email
     * @param {any} email
     */
    transferEmail(email: any): void {
        // const agentConfig = this.data.Data.Transfer?.Agent || ({} as AgentTransferConferenceConfig);
        // const skillConfig = this.data.Data.Transfer?.Skill || ({} as SkillTransferConferenceConfig);
        // const data: AgentSkillListData = {
        //     Title: 'Email Transfer',
        //     Type: 'transferEmail',
        //     Agent: {
        //         Allowed: agentConfig.Allowed,
        //         AllowedStates: agentConfig.AllowedStates,
        //         Consult: agentConfig.Consult,
        //         Blind: agentConfig.Blind,
        //         Comments: agentConfig.Comments,
        //         Source: agentConfig.Source,
        //         Columns: agentConfig.Columns,
        //         TeamFilter: agentConfig.TeamFilter
        //     },
        //     Skill: {
        //         Allowed: skillConfig.Allowed,
        //         Consult: skillConfig.Consult,
        //         Blind: skillConfig.Blind,
        //         Comments: skillConfig.Comments,
        //         ChannelPrefix: skillConfig.ChannelPrefix,
        //         Source: skillConfig.Source,
        //         Columns: skillConfig.Columns
        //     }
        // };

        const transferConfig = this.data.Data.Transfer ?? {};
        let data: AgentSkillListData = new AgentSkillListDataModel('transferEmail', 'Transfer Email');
        data = merge({}, data, transferConfig);
        data = {
            ...data,
            InteractionId: email.InteractionId,
            OtherData: {
                type: 'transfer',
                emails: [email]
            }
        };

        this.matDialog.open(AgentSkillListComponent, {
            data,
            panelClass: ['agent-skill-dialog', 'twd-w-11/12', 'twd-h-10/12', 'lg:twd-w-7/12', 'lg:twd-h-8/12', 'xl:twd-w-6/12', '2xl:twd-w-5/12'],
            minWidth: '30%',
            maxWidth: '100%',
            disableClose: true
        });
    }

    /**
     * Downloads email
     */
    downloadEmail(): void {
        const loader = this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.emailDownloadLoading'), 'loading');
        let requestArgs: ISaveEmailAsEml;
        if (INBOX_REASONS.includes(this.currentInteraction.RouteReason)) {
            requestArgs = {
                direction: 'In',
                sessionId: this.currentInteraction.InSessionId
            };
        } else {
            requestArgs = {
                direction: 'Out',
                sessionId: this.currentInteraction.OutSessionId
            };
        }
        SDKClient.saveEmailAsEml(requestArgs)
            .then((res) => {
                window.open(res.response);
                loader.dismiss();
            })
            .catch((err) => {
                this._appUIService.showSnackbar(this.translocoService.translate('widgets.emailControls.emailDownloadFailed'), 'failure');
            });
    }

    /**
     * Returns email info that is passed to <email /> component
     */
    getReplyInfo(): EmailComponentInputs {
        const {
            Body,
            Subject: subject,
            From,
            CCList,
            BCCList,
            EmailReceivedTime,
            EmailSentTime,
            To,
            AttachmetList,
            InSessionId,
            OutSessionId
        } = this.currentInteraction;
        const SessionID = INBOX_REASONS.includes(this.currentInteraction.RouteReason) ? InSessionId : OutSessionId;
        const Files: EmailFile[] =
            AttachmetList?.map((x) => ({
                ...x,
                Id: TUtils.Generic.uuid(),
                SessionID
            })) || [];
        const isSentEmail = SENT_REASONS.includes(this.currentInteraction.RouteReason);
        const emailcomponentInput: EmailComponentInputs = {
            BCC: (BCCList ? BCCList.split(',') : []).filter(Boolean),
            CC: (CCList ? CCList.split(',') : []).filter(Boolean),
            To: isSentEmail ? From : (To ? To.split(',') : []).filter(Boolean),
            Body,
            Subject: subject,
            Files,
            From: isSentEmail ? (To ? To.split(',') : []).filter(Boolean) : From,
            mailbox: this.currentInteraction.RecoveryData?.Email_Mailbox || this.currentInteraction.Email_Mailbox,
            CreatedTime: EmailReceivedTime,
            SessionID
        };
        const prelude = `
        <style>
        ::-webkit-scrollbar{width:4px !important;height:4px !important;}
        ::-webkit-scrollbar-thumb{box-shadow:inset 0 0 0 4px rgba(0,0,0,0.37) !important}
        </style>
        <br/>
        <div style='border-top: 1px solid gray; padding-top : 5px;'>
            <div style='border-left: 3px solid gray;padding-left: 5px'>
                <div> <strong> From: </strong> <span> ${isSentEmail ? emailcomponentInput.To : emailcomponentInput.From} </span> </div>
                    <div> <strong> Sent: </strong> <span> ${
                        isSentEmail ? EmailSentTime || emailcomponentInput.CreatedTime : emailcomponentInput.CreatedTime
                    } </span> </div>
                    <div> <strong> To: </strong> <span> ${isSentEmail ? emailcomponentInput.From : emailcomponentInput.To} </span> </div>
                    <div> <strong> Subject: </strong> <span> ${emailcomponentInput.Subject} </span> </div>
                </div>
            </div>
        </div>
        <br />
        `;
        emailcomponentInput.prelude = prelude;
        return emailcomponentInput;
    }

    /**
     * To show internet email headers
     */
    showHeaders(): void {
        this._appUIService.showCustomDialog('alert', this.currentInteraction.InternetHeaders, 'Internet Headers', {
            messageClasses: 'twd-whitespace-pre-line twd-break-words'
        });
    }
}
