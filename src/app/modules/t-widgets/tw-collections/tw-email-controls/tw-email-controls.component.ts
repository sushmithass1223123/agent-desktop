import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { CreateEmailComponent } from '@modules/shared/components';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE, EMAIL_DRAFT_SAVE_INTERVAL } from 'app/constants';
import { InteractionRef, IWidget, ResData } from 'app/interfaces';
import { CreateEmailInfo } from 'app/models';
import { interval, Observable, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { distinctUntilChanged, filter, map, mergeAll } from 'rxjs/operators';
import { IAgentData, IResponse, SDKClient } from 'tmac-sdk';

/**
 * Email controls component
 */
@Component({
    selector: 'tw-email-controls',
    templateUrl: './tw-email-controls.component.html',
    styleUrls: ['./tw-email-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwEmailControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * data from widget
     */
    @Input() data: IWidget;

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
        msg: '',
    };


    OutboxReasons = ['CheckerQueue', 'CheckerPull'];
    DraftReasons = ['AgentDraftPull'];
    InboxReasons = ['MakerQueue', 'AgentPull'];

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

    viewingEmail: 'original' | 'replied' = 'replied';

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService,
        private _appDataService: AppDataService,
        private domSanitizer: DomSanitizer,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService
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

        emailInteractionObs.pipe(
            mergeAll(),
            filter((i: InteractionRef) => i.type === 'email' && i.isActive),
            distinctUntilChanged((prev, curr) => (prev.interactionId === curr.interactionId) && !this.getInboxMessageReq.loading),
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
                            console.log('##################', interaction);
                            const res = (
                                await (fetchFromOutbox
                                    ? SDKClient.getOutboxEmail(interaction.OutSessionID)
                                    : SDKClient.getInboxEmail(interaction.SessionId))).response;
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
        ).subscribe(async x => {
            this.currentInteraction = await x;
        });

        // set the user info
        this.user = SDKClient.getAgentData() || null;

        // play new email sound
        this._appUIService.playAudio('new-email', 0.5);
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
            const fetchFromOutbox = [...this.OutboxReasons, ...this.DraftReasons].includes(this.currentInteraction.RouteReason) && this.viewingEmail === 'replied';
            const requestedSession = fetchFromOutbox ? OutSessionID : SessionId;
            this.getInboxMessageReq = { error: false, loading: true };

            const res = await (
                (fetchFromOutbox ?
                    SDKClient.getOutboxEmail(requestedSession) :
                    SDKClient.getInboxEmail(requestedSession)
                ));
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
        }   // });
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
                        this.closeInteraction(btn);
                    })
                    .catch(() => {
                        this._appUIService.showSnackbar('Close interaction failed!', 'failure');
                    });
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
                    // enable if something goes wrong
                    btn.disabled = false;
                    this._appUIService.showSnackbar('Close interaction failed', 'failure');
                }
            })
            .catch(() => {
                this._fuseProgressBarService.hide();
                this._appUIService.showSnackbar('Close interaction failed!', 'failure');
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
        const preBody = RejectReason || this.DraftReasons.includes(RouteReason) ? '' : `
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
            BCC: [],
            CC: [],
            To: From ? [From] : [],
            Body: `
            ${preBody} 
            ${this.domSanitizer.bypassSecurityTrustHtml(Body || '')['changingThisBreaksApplicationSecurity']['changingThisBreaksApplicationSecurity']}`,
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
        const preBody = RejectReason || this.DraftReasons.includes(RouteReason) ? '' : `
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
            BCC: [],
            CC: CCList ? CCList.split(',') : [],
            To: From ? [From] : [],
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
        const preBody = RejectReason || this.DraftReasons.includes(RouteReason) ? '' : `
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
            BCC: [],
            CC: [],
            To: [],
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
            attachmentFileList: Files && Files.length ? JSON.stringify(Files.map(x => ({ ...x, SessionID: currentInteraction.SessionId }))) : '',
            bccList: BCC.join(','),
            body: Body.toString(),
            ccList: CC.join(','),
            inboxSessionId: currentInteraction.SessionId,
            outboxSessionId: currentInteraction.OutboxSessionId,
            routeId: '',
            subject: Subject,
            toList: To.join(','),
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
                const { AttachmetList, Body, From, CC, Subject, } = currentInteraction;
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
                bccList: BCC.join(','),
                body: Body.toString(),
                ccList: CC.join(','),
                inboxSessionId: currentInteraction.SessionId,
                outboxSessionId: currentInteraction.OutboxSessionId || '',
                routeId: '',
                subject: Subject,
                toList: To.join(','),
                typeOfResponse: ''
            }).then(x => {
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
    rejectEmail(): void {
        // const currentInteraction = this.getInboxMessageReq.data[this.interactionId];
        const currentInteraction = this.currentInteraction;
        const dialogRef = this._appUIService.showCustomDialog('prompt', 'Enter the comments', 'Reject Email');
        dialogRef.afterClosed().subscribe((comment) => {
            if (comment) {
                SDKClient.rejectEmail({
                    reason: comment,
                    routeId: currentInteraction.RouteId,
                    sessionId: currentInteraction.OutSessionID
                }).then(rejectEmailRes => {
                    if (rejectEmailRes.response < 0) {
                        this._appUIService.showSnackbar('Email rejection failed', 'failure');
                    } else {
                        this._appUIService.showSnackbar('Email rejected successfully');
                    }
                    this._fuseProgressBarService.hide();
                }).catch(() => {
                    this._fuseProgressBarService.hide();
                    this._appUIService.showSnackbar('Error in saving interaction comment', 'failure');
                });
            }
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
                    sessionId: currentInteraction.SessionId,
                }).then(res => {
                    loader.dismiss();
                    this._appUIService.showSnackbar('Email marked as spam');
                }).catch(err => {
                    console.error(err);
                    this._appUIService.showSnackbar('Unable to spam the email', 'failure');
                });
            }
        });
    }
}
