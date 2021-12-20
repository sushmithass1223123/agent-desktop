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
    AgentSkillListData,
    EmailComponentInputs,
    EmailComponentMode,
    EmailFile,
    InteractionComment,
    InteractionRef,
    IWidget,
    ResData
} from 'app/interfaces';
import { ADError, maticonByExtension, throwADError } from 'app/utils';
import { format, parse } from 'date-fns';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';

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
    @Input() data: IWidget<EmailEventGeneric>;

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
        private _emailService: EmailService
    ) {
        super();
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
                        interactionId: i.interactionId
                    };
                });
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
                let msg = 'Some error occured while fetching email body';
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
            this._appUIService.showDesktopAlert('Incoming Email', `You have a new incoming email from ${this.currentInteraction.From}`, false);
        } else {
            this.showComposeEditor();
        }

        // set the user info
        this.user = SDKClient.getAgentData() || null;

        this._tmacEventService
            .getInteractionEvents(['InteractionDataEvent', 'UpdateEmailEvent'], this.interactionId)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
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
            const msg = 'Unexpected response from server';
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
                });
            }

            // Adding email body to the cache
            // so that next time when it is switched form Replied -> Original or vice versa it doesnt need to be fetched
            this.emailBodies[sessionId] = {
                CCList: res.CCList,
                BCCList: res.BCCList,
                Body: res.Body,
                AttachmetList: res?.Attachments || [],
                To: res.ToList,
                EmailCreatedTime: parse(inboxRes?.ReceivedDate + inboxRes?.ReceivedTime, 'yyyyMMddHHmmss', new Date()).toString(),
                From: res.From,

                AgentName: res.AgentName,
                ConversationID: res.ConversationID,
                CurrentStatus: res.CurrentStatus,
                ClosedBy: (res as any).ClosedBy,

                Priority: inboxRes?.Priority,
                RepliedStatus: inboxRes?.RepliedStatus === '1' ? 'Replied' : 'Not Replied',
                Intent: inboxRes?.Intent
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
                status: 'Close'
            })
                .then(() => {
                    this._fuseProgressBarService.hide();
                    this.closeInteraction(btn, true);
                })
                .catch(() => {
                    this._fuseProgressBarService.hide();
                    this._appUIService.showSnackbar('Close interaction failed!', 'failure');
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
                        this._appUIService.showSnackbar('Interaction closed sucessfully');
                        // remove the interaction reference
                        this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                    } else {
                        this._appUIService.showSnackbar('Close interaction failed', 'failure');
                    }
                })
                .catch(() => {
                    this._fuseProgressBarService.hide();
                    this._appUIService.showSnackbar('Close interaction failed!', 'failure');
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
            let msg = 'Unable to send email';
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

            let confirmSend = true;
            if (!Subject) {
                confirmSend = await this._appUIService
                    .showAppConfirmDialog('generic', 'Confirm Send', 'Send email without a subject ?')
                    .afterClosed()
                    .pipe(take(1))
                    .toPromise();
            }
            if (!confirmSend) {
                return;
            }

            if (!To.length) {
                this._appUIService.showSnackbar('Please add a recipient', 'failure');
                return;
            }

            if (btn) {
                btn.disabled = true;
            }
            this.sendingEmailAsMaker = true;
            // this._fuseProgressBarService.show();
            const ref = this._appUIService.showSnackbar('Sending Email', 'loading');
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
                throwADError('Error in TwEmailControlsComponent.sendEmailAsMaker', 'Unexpected response from Server');
                return;
            }
            // Check if the request was sucessful by checking SendStatus,CurrentStatus in repsonse
            // Display the message in snackbar accordingly
            const reasonCodeMsg = EMAIL_REASONCODE_VALUES[res.response.SendStatus];
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
            this._appUIService.showSnackbar(`Message sent ${currentStatusMsg}`, 'success');
            this.draftPolling$?.unsubscribe();
            this.emailRef.mode = 'preview';
            // if (this.currentInteraction.RouteReason === 'AgentDraftPull') {
            //     this.deleteDraftEmail();
            // }
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
            const msg = 'Unable to approve email';
            sendLoader?.dismiss();
            this._appUIService.showSnackbar(msg, 'failure');
            btn.disabled = false;
        };
        let sendLoader;
        try {
            btn.disabled = true;
            const { InSessionId, CurrOutSessionId, RouteId, Body, Subject, CCList, BCCList, To, AttachmetList } = this.currentInteraction;
            const confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Approve', 'Are you sure to approve this email?');
            const dialogResult: boolean = await confirmDialogRef.afterClosed().toPromise();
            if (dialogResult) {
                // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
                // const { Files: AttachmetList, Body, To: toList, CC, BCC, Subject } = this.getReplyInfo();
                sendLoader = this._appUIService.showSnackbar('Approving email', 'loading');
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
                    throwADError('Error in TwEmailControlsComponent.sendEmailAsChecker', 'Unexpected response from Server');
                    return;
                }

                // Check if the request was sucessful by checking SendStatus,CurrentStatus in repsonse
                // Display the message in snackbar accordingly
                const reasonCodeMsg = EMAIL_REASONCODE_VALUES[res.response.SendStatus];
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
                this._appUIService.showSnackbar(`Message sent ${currentStatusMsg}`, 'success');
                this.draftPolling$?.unsubscribe();
                sendLoader?.dismiss();
                btn.disabled = false;
            } else {
                btn.disabled = false;
            }
        } catch (err) {
            errCallback(err);
        }
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
            SDKClient.saveEmailDraft({
                bccList: BCC || '',
                body: (Body || '').toString(),
                ccList: CC || '',
                inboxSessionId: InSessionId,
                outboxSessionId: CurrOutSessionId || '',
                routeId: RouteId || '',
                subject: Subject || '',
                toList: To || '',
                typeOfResponse: ''
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
            'Save email as draft and close?',
            {
                yesMessage: 'Yes',
                noMessage: 'No, Close'
            },
            {
                disableClose: false
            }
        );
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean | undefined) => {
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
                            this._appUIService.showSnackbar('Email rejection failed', 'failure');
                        } else {
                            this._appUIService.showSnackbar('Email rejected successfully');
                            this.closeEmail(null, true);
                        }
                        this._fuseProgressBarService.hide();
                    })
                    .catch((ex) => {
                        console.error(ex);
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar('Error in email rejection', 'failure');
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
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Spam', 'Are you sure to mark this email as spam?');
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
                const currentInteraction = this.currentInteraction;
                const loader = this._appUIService.showSnackbar('Spamming email', 'loading');
                SDKClient.markEmailAsSpam({
                    fromAddress: currentInteraction.From,
                    routeId: currentInteraction.RouteId,
                    sessionId: currentInteraction.InSessionId
                })
                    .then((res) => {
                        loader.dismiss();
                        this._appUIService.showSnackbar('Email marked as spam');
                    })
                    .catch((err) => {
                        console.error(err);
                        this._appUIService.showSnackbar('Unable to spam the email', 'failure');
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
        message += 'Add new comment:';

        const dialogRef = this._appUIService.showCustomDialog(
            'prompt',
            message,
            'Interaction Comments',
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
                            this._appUIService.showSnackbar('Interaction comment saved successfully');
                        } else {
                            this._appUIService.showSnackbar('Interaction comment save failed', 'failure');
                        }

                        this._fuseProgressBarService.hide();
                    })
                    .catch(() => {
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar('Error in saving interaction comment', 'failure');
                    });
            }
        });
    }

    /**
     * Transfers email
     * @param {any} email
     */
    transferEmail(email: any): void {
        const agentConfig = this.data.Data.Transfer?.Agent || {};
        const skillConfig = this.data.Data.Transfer?.Skill || {};

        const data: AgentSkillListData = {
            title: 'Email Transfer',
            type: 'transferEmail',
            agent: {
                allowed: agentConfig.Allowed,
                allowedStates: agentConfig.AllowedStates,
                consult: agentConfig.Consult,
                blind: agentConfig.Blind,
                comments: agentConfig.Comments,
                source: agentConfig.Source,
                columns: agentConfig.Columns,
                teamFilter: agentConfig.TeamFilter
            },
            skill: {
                allowed: skillConfig.Allowed,
                consult: skillConfig.Consult,
                blind: skillConfig.Blind,
                comments: skillConfig.Comments,
                channelPrfix: skillConfig.ChannelPrefix,
                source: skillConfig.Source,
                columns: skillConfig.Columns
            }
        };
        this.matDialog.open(AgentSkillListComponent, {
            data: {
                ...data,
                interactionId: email.InteractionId,
                otherData: {
                    type: 'transfer',
                    emails: [email]
                }
            },
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
        const loader = this._appUIService.showSnackbar('Downloading email', 'loading');
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
                this._appUIService.showSnackbar('Unable to download email', 'failure');
            });
    }

    /**
     * Returns email info
     */
    getReplyInfo(): EmailComponentInputs {
        const {
            Body,
            Subject: subject,
            From,
            CCList,
            BCCList,
            EmailCreatedTime,
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
        return {
            BCC: (BCCList ? BCCList.split(',') : []).filter(Boolean),
            CC: (CCList ? CCList.split(',') : []).filter(Boolean),
            To: isSentEmail ? From : (To ? To.split(',') : []).filter(Boolean),
            Body,
            Subject: subject,
            Files,
            From: isSentEmail ? (To ? To.split(',') : []).filter(Boolean) : From,
            mailbox: this.currentInteraction.RecoveryData?.Email_Mailbox || this.currentInteraction.Email_Mailbox,
            CreatedTime: EmailCreatedTime,
            SessionID
        };
    }
}
