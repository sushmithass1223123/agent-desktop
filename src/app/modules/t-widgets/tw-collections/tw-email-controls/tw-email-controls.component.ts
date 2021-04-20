import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AgentSkillListComponent, CreateEmailComponent } from '@modules/shared/components';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE, DRAFT_REASONS, EMAIL_DRAFT_SAVE_INTERVAL, INBOX_REASONS, OUTBOX_REASONS } from 'app/constants';
import { AgentSkillListData, InteractionComment, InteractionRef, IWidget, ResData } from 'app/interfaces';
import { CreateEmailInfo } from 'app/models';
import { interval, Observable, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { distinctUntilChanged, filter, map, mergeAll } from 'rxjs/operators';
import { IAgentData, InteractionDataEvent, IResponse, SDKClient } from 'tmac-sdk';

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
    @Input() data: IWidget;

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
     * appConfig
     */
    appConfig: any;

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
     * Inbox reasons
     */
    InboxReasons = INBOX_REASONS;

    /**
     * Fuse config
     */
    fuseConfig: FuseConfig;

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
    interactionList: InteractionRef[];

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
    replyInfo?: CreateEmailInfo;

    /**
     * Saved interaction comments
     */
    savedComments: InteractionComment[] = [];

    /**
     * Perfect scrollbar ref
     */
    // @ViewChildren(FusePerfectScrollbarDirective) directiveScrolls: QueryList<FusePerfectScrollbarDirective>;

    /**
     * Create email compopnnet ref
     */
    @ViewChild('createEmailRef') createEmailRef: CreateEmailComponent;

    /**
     * Draft pollling subscription
     */
    draftPolling: Subscription;

    /**
     * Viewing email ref
     */
    viewingEmail: 'original' | 'replied' = 'replied';

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService,
        private _appDataService: AppDataService,
        private domSanitizer: DomSanitizer,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService,
        private matDialog: MatDialog,
        private _tmacEventService: TMACEventService,
        private _contentPageService: ContentPageService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        // set the intent
        this.intent = this.data.InteractionDetails.Intent || 'NA';

        // set the sentiment
        this.sentiment = this.data.InteractionDetails.Sentiment || 'NA';

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        const emailInteractionObs: Observable<InteractionRef[]> = this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll));

        // @TODO - Some weird issue when interaction closed , prev intraction emittted with current interaction active
        // this.interactionList = emailInteractionObs.pipe(
        //     scan((acc, val) => uniqBy(acc.concat(val), 'interactionId'), [])
        // );

        emailInteractionObs.subscribe((interactions) => {
            // filter out the email interaction
            this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'email');
        });

        emailInteractionObs
            .pipe(
                mergeAll(),
                filter((i: InteractionRef) => i.type === 'email' && i.isActive),
                distinctUntilChanged((prev, curr) => prev.interactionId === curr.interactionId && !this.getInboxMessageReq.loading),
                map(async (interactionVal) => {
                    let interaction: any = interactionVal.otherData;
                    if (interaction && !this.getInboxMessageReq.loading) {
                        this.interactionId = interaction.InteractionID;
                        // const fetchFromOutbox = interaction.RouteReason === 'CheckerQueue' || (interaction.RouteReason === 'AgentPull' && interaction.OutSessionID);
                        const fetchFromOutbox = [...this.OutboxReasons, ...this.DraftReasons].includes(interaction.RouteReason);
                        const requestedSession = fetchFromOutbox ? interaction.OutSessionID : interaction.SessionId;
                        interaction.Email_Mailbox = interaction.RecoveryData.Email_Mailbox;
                        try {
                            if (!this.emailBodies[requestedSession]) {
                                this.getInboxMessageReq = { error: false, loading: true };
                                const res = (
                                    await (fetchFromOutbox
                                        ? SDKClient.getOutboxEmail(interaction.OutSessionID)
                                        : SDKClient.getInboxEmail(interaction.SessionId))
                                ).response;
                                this.emailBodies[requestedSession] = {
                                    Body: this.domSanitizer.bypassSecurityTrustHtml(res.Body),
                                    AttachmetList: res?.Attachments || []
                                };
                                // interaction.Subject = interaction.Subject || res.Subject;
                                // interaction.To = interaction.To || res.ToList;
                                // interaction.Subject = interaction.Mailbox || res.Mailbox;
                            }
                            interaction = {
                                ...interaction,
                                ...this.emailBodies[requestedSession]
                            };
                            this.getInboxMessageReq = { error: false, loading: false };
                        } catch (err) {
                            console.error(err);
                            this.getInboxMessageReq = {
                                error: true,
                                loading: false,
                                msg: COMMON_ERR_MESSAGE
                            };
                        }
                        // }
                    }
                    return interaction;
                })
            )
            .subscribe(async (x) => {
                this.currentInteraction = await x;
                // console.log({ x });
                if (this.currentInteraction.RouteReason === 'CheckerQueue') {
                    this.rejectReason.allReasons = this.currentInteraction.JsonData?.split(',') || [];
                }
                if (this.currentInteraction.RejectReason && typeof this.currentInteraction.RejectReason === 'string') {
                    this.currentInteraction.RejectReason = JSON.parse(this.currentInteraction.RejectReason);
                    this.currentInteraction.RejectReason.reasonTags = this.currentInteraction.RejectReason.reasonTags?.join(',') || '';
                }
            });

        // set the user info
        this.user = SDKClient.getAgentData() || null;

        // play new email sound
        this._appUIService.playAudio('new-email', 0.5, false);
        this._appUIService.showDesktopAlert('Incoming Email', `You have a new incoming email from ${this.data.InteractionDetails.From}`, false);

        this._tmacEventService
            .getInteractionEvents(
                [
                    'InteractionDataEvent'
                ],
                this.interactionId
            )
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngAfterViewInit(): void {
        // check if the current page is textchat page
        if (this._interactionManagerService.getInteractionCount().active <= 1 &&
            this._contentPageService.getCurrentMode() !== this.data.Data.Path) {
            setTimeout(() => {
                this._contentPageService.mode = this.data.Data.Path;
            }, 500);
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
        if (evt.Channel !== 'Voice') {
            return;
        }
        // check if interaction comments available
        if (evt.InteractionComments && evt.InteractionComments.length > 0) {
            evt.InteractionComments.forEach(c => {
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
    switchEmailView(): void {
        let requestedSession: string | null = null;
        if (this.viewingEmail === 'original') {
            this.viewingEmail = 'replied';
            requestedSession = this.currentInteraction.OutSessionID;
        } else {
            this.viewingEmail = 'original';
            requestedSession = this.currentInteraction.SessionId;
        }
        if (this.emailBodies[requestedSession]) {
            this.currentInteraction = {
                ...this.currentInteraction,
                ...this.emailBodies[requestedSession]
            };
        } else {
            this.getFullEmail();
        }
    }

    /**
     * Gets full email details
     */
    async getFullEmail(): Promise<void> {
        try {
            const { SessionId, OutSessionID } = this.currentInteraction;

            // const fetchFromOutbox = (this.currentInteraction.RouteReason === 'CheckerQueue' ||
            //     (this.currentInteraction.RouteReason === 'AgentPull' && this.currentInteraction.OutSessionID)) &&
            //     this.viewingEmail === 'replied';
            const fetchFromOutbox =
                [...this.OutboxReasons, ...this.DraftReasons].includes(this.currentInteraction.RouteReason) && this.viewingEmail === 'replied';
            const requestedSession = fetchFromOutbox ? OutSessionID : SessionId;
            this.getInboxMessageReq = { error: false, loading: true };

            const res = await (fetchFromOutbox ? SDKClient.getOutboxEmail(requestedSession) : SDKClient.getInboxEmail(requestedSession));
            if (!res) {
                throw Error('Unexpected response from server');
            }

            this.emailBodies[requestedSession] = {
                Body: this.domSanitizer.bypassSecurityTrustHtml(res.response.Body),
                AttachmetList: res.response?.Attachments || []
            };

            this.currentInteraction = {
                ...this.currentInteraction,
                ...this.emailBodies[requestedSession]
            };

            this.getInboxMessageReq = { error: false, loading: false };
        } catch (e) {
            console.error(e);
            this.getInboxMessageReq = {
                error: true,
                loading: false,
                msg: COMMON_ERR_MESSAGE
            };
        } // });
    }

    /**
     * Closes emails
     * @param {MatButton} btn
     */
    closeEmail(btn: MatButton): void {
        // confirm close interaction
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        const currentInteraction = this.currentInteraction;
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // send end chat to server
                // show the progress bar
                this._fuseProgressBarService.show();
                // disable the button
                btn.disabled = true;
                SDKClient.changeEmailStatus({
                    routeId: currentInteraction.RouteId,
                    sessionId: currentInteraction.SessionId,
                    status: 'Close'
                })
                    .then(() => {
                        btn.disabled = false;
                        this.closeInteraction(btn);
                    })
                    .catch(() => {
                        btn.disabled = false;
                        this._appUIService.showSnackbar('Close interaction failed!', 'failure');
                    });
            } else {
                btn.disabled = false;
            }
        });
    }

    /**
     * Closes current interaction
     * @param {MatButton} btn
     */
    closeInteraction(btn: MatButton): void {
        // show the progress bar
        this._fuseProgressBarService.show();
        // disable the button
        btn.disabled = true;
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
                btn.disabled = false;
            })
            .catch(() => {
                this._fuseProgressBarService.hide();
                this._appUIService.showSnackbar('Close interaction failed!', 'failure');
                btn.disabled = false;
            });
    }

    /**
     * Select Interaction
     * @method selectInteraction
     * @param {InteractionRef} item
     */
    public selectInteraction(item: InteractionRef): void {
        this.replyInfo = null;

        // if same interaction is seleted then return
        if (this.interactionId === item.interactionId) {
            return;
        }
        this.viewingEmail = 'replied';
        // update is active
        this._interactionManagerService.updateInteraction(item.interactionId, {
            isActive: true
        });
    }

    /**
     * Forward Email
     */
    forwardEmail(): void { }

    /**
     * Show reply email form
     */
    showReplyEditor(): void {
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        const currentInteraction = this.currentInteraction;
        const { Body, Subject, From, To, CreatedTime, RejectReason, RouteReason } = currentInteraction;
        const preBody =
            RejectReason || this.DraftReasons.includes(RouteReason)
                ? ''
                : `
        <p> </p>
        <br />
        <p style='border-left: 3px solid gray;'>
            <div> <strong> From: </strong> <span> ${From} </span> </div>
            <div> <strong> Sent: </strong> <span> ${CreatedTime} </span> </div>
            <div> <strong> To: </strong> <span> ${To} </span> </div>
            <div> <strong> Subject: </strong> <span> ${Subject} </span> </div>
        </p>
        <br />`;
        this.replyInfo = {
            BCC: '',
            CC: '',
            To: From || '',
            Body: `
            ${preBody} 
            ${this.domSanitizer.bypassSecurityTrustHtml(Body || '')['changingThisBreaksApplicationSecurity'][
                'changingThisBreaksApplicationSecurity'
                ]
                }`,
            Subject: `RE: ${Subject}`,
            Files: []
        };
        this.saveEmailAsDraft();
    }

    /**
     * Show reply all email editor
     */
    showReplyAllEmailEditor(): void {
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        const currentInteraction = this.currentInteraction;
        const { Body, Subject, From, RejectReason, CCList, CreatedTime, RouteReason, To, Files } = currentInteraction;
        const preBody =
            RejectReason || this.DraftReasons.includes(RouteReason)
                ? ''
                : `
        <p> </p>
        <br />
        <p style='border-left: 3px solid gray;'>
            <div> <strong> From: </strong> <span> ${From} </span> </div>
            <div> <strong> Sent: </strong> <span> ${CreatedTime} </span> </div>
            <div> <strong> To: </strong> <span> ${To} </span> </div>
            <div> <strong> Subject: </strong> <span> ${Subject} </span> </div>
        </p>
        <br />`;
        this.replyInfo = {
            BCC: '',
            CC: CCList || '',
            To: From || '',
            Body: `
                ${preBody}
                ${this.domSanitizer.bypassSecurityTrustHtml(Body)['changingThisBreaksApplicationSecurity']['changingThisBreaksApplicationSecurity']}`,
            Subject: `RE: ${Subject}`,
            Files
        };
        this.saveEmailAsDraft();
    }

    /**
     * Show forward email editor
     */
    showForwardEmailEditor(): void {
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        const currentInteraction = this.currentInteraction;
        const { Subject, Body, From, RejectReason, CreatedTime, To, RouteReason } = currentInteraction;
        const preBody =
            RejectReason || this.DraftReasons.includes(RouteReason)
                ? ''
                : `
        <p> </p>
        <br />
        <p style='border-left: 3px solid gray;'>
            <div> <strong> From: </strong> <span> ${From} </span> </div>
            <div> <strong> Sent: </strong> <span> ${CreatedTime} </span> </div>
            <div> <strong> To: </strong> <span> ${To} </span> </div>
            <div> <strong> Subject: </strong> <span> ${Subject} </span> </div>
        </p>
        <br />`;
        this.replyInfo = {
            BCC: '',
            CC: '',
            To: '',
            Body: `
                ${preBody}
                ${this.domSanitizer.bypassSecurityTrustHtml(Body)['changingThisBreaksApplicationSecurity']['changingThisBreaksApplicationSecurity']}`,
            Subject: `FW: ${Subject}`,
            Files: []
        };
        this.saveEmailAsDraft();
    }

    /**
     * Sends Email as Maker
     */
    sendEmailAsMaker(): void {
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        const currentInteraction = this.currentInteraction;
        const { BCC, CC, To, Subject, Files, Body } = this.createEmailRef.email;
        if (!To.length) {
            this._appUIService.showSnackbar('Please add a recipient', 'failure');
            return;
        }
        SDKClient.sendEmail({
            attachmentFileList: Files && Files.length ? JSON.stringify(Files.map((x) => ({ ...x, SessionID: currentInteraction.SessionId }))) : '',
            bccList: BCC.replaceAll(';', ','),
            body: Body.toString(),
            ccList: CC.replaceAll(';', ','),
            inboxSessionId: currentInteraction.SessionId,
            outboxSessionId: currentInteraction.OutboxSessionId,
            routeId: '',
            subject: Subject,
            toList: To.replaceAll(';', ','),
            typeOfResponse: ''
        })
            .then((res) => {
                const message = {
                    SentToCustomer: 'to customer',
                    SentToCheckerSession: 'to checker'
                };
                this._appUIService.showSnackbar(`Message sent ${message[res.response.CurrentStatus]}`, 'success');
                this.draftPolling?.unsubscribe();
            })
            .catch((err) => {
                console.error({ err });
                this._appUIService.showSnackbar('Something went wrong', 'failure');
            });
    }

    /**
     * Sends email as Checker
     */
    sendEmailAsChecker(btn: MatButton): void {
        btn.disabled = true;
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', 'Confirm Approve', 'Are you sure to approve this email?');
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
                const currentInteraction = this.currentInteraction;
                const { AttachmetList, Body, From, CC, Subject } = currentInteraction;
                const sendLoader = this._appUIService.showSnackbar('Approving email', 'loading');
                SDKClient.sendEmail({
                    attachmentFileList: AttachmetList && AttachmetList.length ? JSON.stringify(AttachmetList) : '',
                    bccList: '',
                    body: Body['changingThisBreaksApplicationSecurity'],
                    ccList: CC || '',
                    inboxSessionId: currentInteraction.SessionId,
                    outboxSessionId: currentInteraction.OutSessionID,
                    routeId: '',
                    subject: Subject,
                    toList: From,
                    typeOfResponse: 'approve'
                })
                    .then((res) => {
                        const message = {
                            SentToCustomer: 'to customer',
                            SentToCheckerSession: 'to checker'
                        };
                        this._appUIService.showSnackbar(`Message sent ${message[res.response.CurrentStatus]}`, 'success');
                        this.draftPolling?.unsubscribe();
                        sendLoader.dismiss();
                        btn.disabled = false;
                    })
                    .catch((err) => {
                        console.error(err);
                        sendLoader.dismiss();
                        this._appUIService.showSnackbar('Something went wrong', 'failure');
                        btn.disabled = false;
                    });
            } else {
                btn.disabled = false;
            }
        });
    }

    /**
     * Save email as Draft
     */
    saveEmailAsDraft(): void {
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        const currentInteraction = this.currentInteraction;
        const email = this.createEmailRef?.email || this.replyInfo;
        if (email) {
            // @TODO Files not sent as draft arg
            const { BCC, CC, To, Subject, Body, Files } = email;
            SDKClient.saveEmailDraft({
                bccList: BCC.replaceAll(';', ','),
                body: Body.toString(),
                ccList: CC.replaceAll(';', ','),
                inboxSessionId: currentInteraction.SessionId,
                outboxSessionId: currentInteraction.OutboxSessionId || '',
                routeId: '',
                subject: Subject,
                toList: To.replaceAll(';', ','),
                typeOfResponse: ''
            }).then((x) => {
                currentInteraction.OutboxSessionId = x.response;
            });
        }
        if (!this.draftPolling) {
            const polling = interval(EMAIL_DRAFT_SAVE_INTERVAL);
            this.draftPolling = polling.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.saveEmailAsDraft());
        }
    }

    /**
     * Closes the editor
     */
    closeEditor(): void {
        this.replyInfo = null;
        this.draftPolling.unsubscribe();
    }

    /**
     * Rejects email, only available for checkers
     */
    rejectEmail(evt: MatButton): void {
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        evt.disabled = true;
        const currentInteraction = this.currentInteraction;
        // const dialogRef = this._appUIService.showCustomDialog('prompt', 'Enter the comments', 'Reject Email');
        this.rejectEmailDialogRef = this.matDialog.open(this.RejectEmailDialog, {
            panelClass: 'reject-reason-dialog',
            maxWidth: '60%'
        });
        this.rejectEmailDialogRef.afterClosed().subscribe(() => {
            const { comment, reasonTags } = this.rejectReason;
            if (comment) {
                SDKClient.rejectEmail({
                    reason: JSON.stringify({ comment, reasonTags }),
                    routeId: currentInteraction.RouteId,
                    sessionId: currentInteraction.OutSessionID
                })
                    .then((rejectEmailRes) => {
                        evt.disabled = false;
                        if (rejectEmailRes.response < 0) {
                            this._appUIService.showSnackbar('Email rejection failed', 'failure');
                        } else {
                            this._appUIService.showSnackbar('Email rejected successfully');
                        }
                        evt.disabled = true;
                        this._fuseProgressBarService.hide();
                    })
                    .catch(() => {
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar('Error in saving interaction comment', 'failure');
                        evt.disabled = true;
                    });
            }
            evt.disabled = false;
        });
    }

    /**
     * Opens a selected attachment file
     * @param {String} fileUrl
     */
    openFile(fileUrl: string): void {
        window.open(fileUrl);
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
                    sessionId: currentInteraction.SessionId
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
                 <div class="text-primary mat-title m-0">${item.Message.replace(/(?:\r\n|\r|\n)/g, '<br>')}</div>
                 <span class="time secondary-text">${item.User}</span>,
                 <span class="time secondary-text">${new Date(item.Time).toLocaleString()}</span>
                 <br /><br />
                 `;
        });
        message += 'Add new comment:';

        const dialogRef = this._appUIService.showCustomDialog('prompt', message, 'Interaction Notes', { minRows: 4 }, { minWidth: '30%' });
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
                                Time: new Date().toLocaleTimeString(),
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
                blind: agentConfig.Blind,
                source: agentConfig.Source
            },
            skill: {
                allowed: skillConfig.Allowed,
                blind: false,
                channelPrfix: skillConfig.ChannelPrefix,
                source: skillConfig.Source
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
            panelClass: 'agent-skill-dialog',
            minWidth: '30%',
            maxWidth: '100%',
            height: '60%',
            disableClose: true
        });
    }
}
