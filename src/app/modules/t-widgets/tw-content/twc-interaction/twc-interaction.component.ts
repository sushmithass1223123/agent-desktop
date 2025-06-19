import { AOTWidget } from '@ad/types';
import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import {
    AutoCloseTabEvent,
    FaxReceivedEvent,
    GenericInteractionEvent,
    IncomingCallEvent,
    IncomingEmailEvent,
    InteractionClosedEvent,
    IUIEvent,
    OutgoingCallEvent,
    OutgoingEmailEvent,
    TextChatIncomingEvent,
    EmailSendingStatusEvent,
    TUtils,
    SDKClient,
    IResponse
} from '@tmac/sdk';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { InteractionRef, InteractionWidgets, IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { InteractionManagerService } from 'app/services/interaction-manager.service';
import { throwADError } from 'app/utils';
import { cloneDeep } from 'lodash';
import { map, takeUntil } from 'rxjs/operators';
import { AppUiService } from '@services/app-ui.service';
import { TranslocoService } from '@ngneat/transloco';
import { SharedService } from '@services/shared.service';
import { EMAIL_SEND_STATUS, SMP_SEND_STATUS, EMAIL_CURRENTSTATUS_CODES } from 'app/constants';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

/**
 * TwcInteractionComponent
 */
@Component({
    selector: 'twc-interaction',
    templateUrl: './twc-interaction.component.html',
    styleUrls: ['./twc-interaction.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcInteractionComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the interaction related widgets and process on new interacion for interaction content page
     */
    interactions: InteractionWidgets[] = [];

    /**
     * Currently active interaction
     */
    activeInteraction: number;

    /**
     * Type of content widget
     */
    type: any;

    /**
     * Temporary AOT widgets
     */
    tempAOTs: IWidget[] = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService,
        private _tmacEventService: TMACEventService,
        private _aotWidgetService: AOTWidgetService,
        private _appUIService: AppUiService,
        private translocoService: TranslocoService,
        private _sharedService: SharedService,
        private _fuseProgressBarService: FuseProgressBarService
    ) {
        super('TwcInteractionComponent', hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // assign the type
        this.type = this.data.Type.replace('twc-', '');

        this.subscribeByType();

        this._aotWidgetService.newWidget(this.type).subscribe((x) => {
            this.tempAOTs.push(x.json);
            this.interactions.forEach((i) => {
                x.json.InteractionDetails = i.interactionDetails;
                i.widgets.aot.push(x.json);
                if (x.json.Config?.AutoOpen) {
                    this._aotWidgetService.addWidget(x.json);
                }
            });
        });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To subscribe by type
     *
     */
    private subscribeByType(): void {
        let eventNames = [];

        switch (this.type.toLowerCase()) {
            case 'voice':
                eventNames = ['IncomingCallEvent', 'OutgoingCallEvent'];
                break;
            case 'textchat':
                eventNames = ['TextChatIncomingEvent'];
                break;
            case 'email':
                eventNames = ['IncomingEmailEvent', 'OutgoingEmailEvent'];
                break;
            case 'smp':
                eventNames = ['IncomingEmailEvent'];
                break;
            case 'fax':
                eventNames = ['FaxReceivedEvent'];
                break;
            case 'generic':
                eventNames = ['GenericInteractionEvent'];
                break;
        }

        if (this.type.toLowerCase() === 'email') {
            this._tmacEventService
                .getAllSubscribedEvents<IUIEvent>(['EmailSendingStatusEvent'])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) =>
                    evts.forEach((evt) => {
                        this[evt.EventName](evt);
                    })
                );
        }

        if (eventNames.length) {
            // subscribe to interaction events observable
            this._tmacEventService
                .getConstructDisposeEvents<IUIEvent>([...eventNames, 'InteractionClosedEvent', 'AutoCloseTabEvent'])
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) =>
                    evts.forEach((evt) => {
                        if (evt.EventName === 'InteractionClosedEvent' || evt.EventName === 'AutoCloseTabEvent') {
                            this.tabCloseEvent(evt);
                        } else {
                            this[evt.EventName](evt);
                        }
                    })
                );

            // subscribe to active interaction observable
            this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
                // check if there are interactions first
                if (this.interactions.length > 0) {
                    interactions
                        .filter((i) => i.type === this.type)
                        .forEach((interaction: InteractionRef) => {
                            this.activeInteraction = interaction.isActive ? interaction.interactionId : this.activeInteraction;
                        });
                }
            });
        }
    }

    /**
     * To create static, dynamic, AOT widget list
     *
     * @param {Any} evt
     * @param {String} status
     * @param {String} user
     * @param {Boolean} forceActive
     * @param {Any} otherData
     */
    private createWidgetList(evt: any, status: string, user: string, forceActive: boolean, otherData: any): void {
        // get the content widgets
        const widgets = cloneDeep(this.data.Data.Widgets) || [];

        const staticWidgets = widgets.Static?.filter((w: IWidget) => w.Config.Enabled) ?? [];

        // const dynamicWidgets = ((environment.production && evt.WidgetConfigData && JSON.parse(evt.WidgetConfigData)) || widgets.Dynamic) ?? [];
        let dynamicWidgets = widgets.Dynamic?.filter((w: IWidget) => w.Config.Enabled) ?? [];
        try {
            if (evt.WidgetConfigData) {
                dynamicWidgets = JSON.parse(evt.WidgetConfigData)?.filter((w: IWidget) => w.Config.Enabled);
            }
        } catch (error) {
            throwADError('Error in TwcInteractionComponent.createWidgetList', error);
        }
        if(dynamicWidgets?.length) {
            dynamicWidgets.forEach((WidgetDynamic) => {
            WidgetDynamic.Config.HasNoStaticWidgets = !Boolean(staticWidgets?.length);
            });
        }
        const aotWidgets = [...this.tempAOTs, ...(widgets.AOT?.filter((w: IWidget) => w.Config.Enabled ?? []) ?? [])];

        const routeOnInteraction = (forceActive || this.data.Data.RouteOnInteraction) ?? (['voice', 'textchat', 'smp', 'email'].includes(this.type) ? true : false);

        // loop the widgets and add append interaction details
        staticWidgets
            .filter((w: IWidget) => w.Config.Enabled)
            .forEach((widget: IWidget) => {
                widget.InteractionDetails = evt;
                widget.Data.Path = this.data.Data.Path;
                widget.Data.RouteOnInteraction = routeOnInteraction;
            });

        dynamicWidgets
            .filter((w: IWidget) => w.Config.Enabled)
            .forEach((widget: IWidget) => {
                widget.InteractionDetails = evt;
                widget.Data.Path = this.data.Data.Path;
                widget.Data.RouteOnInteraction = routeOnInteraction;
            });

        aotWidgets
            .filter((w: IWidget) => w.Config.Enabled)
            .forEach((widget: IWidget) => {
                widget.ID = TUtils.Generic.uuid();
                widget.InteractionDetails = evt;
                widget.Data.Path = this.data.Data.Path;
            });

        // process aot widgets
        this._aotWidgetService.processAOTWidgets(aotWidgets);

        // push the interaction details with widgets to the list
        this.interactions.push({
            interactionDetails: evt,
            widgets: {
                static: staticWidgets,
                dynamic: dynamicWidgets,
                aot: aotWidgets,
                localAOT$: this._aotWidgetService.widgets.pipe(
                    takeUntil(this.unsubscribeAll),
                    map((widgets) =>
                        widgets.filter(
                            (f: AOTWidget<any, IUIEvent>) => f.Config.LocalAOT && f.InteractionDetails?.InteractionID === evt.InteractionID
                        )
                    )
                )
            }
        });

        // add the construct event to the interaction manager
        this._interactionManagerService.addInteraction({
            interactionId: evt.InteractionID,
            type: this.type,
            status: status,
            isActive: this.interactions.length === 1,
            user: user || 'Customer',
            path: this.data.Data.Path,
            otherData: otherData,
            isEmailSent: null,
            isPostReplySent: null
        });
    }

    /**
     * To process IncomingCallEvent
     *
     * @param {IncomingCallEvent} evt
     */
    IncomingCallEvent(evt: IncomingCallEvent): void {
        this.createWidgetList(evt, 'incoming', evt.PhoneNumber, false, {});
    }

    /**
     * To process IncomingCallEvent
     *
     * @param {OutgoingCallEvent} evt
     */
    OutgoingCallEvent(evt: OutgoingCallEvent): void {
        // check if existing interaction and tab exist, then do not create the tab
        if (evt.IsExistingInteraction && this.interactions.filter((i) => i.interactionDetails.InteractionID === evt.InteractionID)) {
            return;
        }
        this.createWidgetList(evt, 'outgoing', evt.PhoneNumber, true, {});
    }

    /**
     * To process TextChatIncomingEvent
     */
    TextChatIncomingEvent(evt: TextChatIncomingEvent): void {
        this.createWidgetList(evt, 'incoming', '', false, { unreadCount: 0 });
    }

    /**
     * To process IncomingEmailEvent
     * @param {IncomingEmailEvent} evt
     */
    IncomingEmailEvent(evt: IncomingEmailEvent): void {
        // create email widgets
        if(this.type === 'smp' && evt.EmailType === 'NewSocialMediaItemFromMakerQueue') {
            this.createWidgetList(evt, 'connected', evt.From, false, evt);
        } else if (this.type === 'email' && evt.EmailType !== 'NewSocialMediaItemFromMakerQueue') {
            this.createWidgetList(evt, 'connected', evt.From, false, evt);
        }
    }

    /**
     * To process OutgoingEmailEvent
     * @param {OutgoingEmailEvent} evt
     */
    OutgoingEmailEvent(evt: OutgoingEmailEvent): void {
        // create email widgets
        this.createWidgetList(evt, 'connected', 'Customer', true, evt);
    }

    /**
     * To process FaxReceivedEvent
     */
    FaxReceivedEvent(evt: FaxReceivedEvent): void {
        this.createWidgetList(evt, 'connected', evt.FaxNumber, false, {});
    }

    /**
     * To process GenericInteractionEvent
     */
    GenericInteractionEvent(evt: GenericInteractionEvent): void {
        this.createWidgetList(evt, 'connected', evt.Item.CustomerIdentifier, false, {});
    }

    /**
     * To Process Interaction Sending Status Event
     */
    EmailSendingStatusEvent(evt: EmailSendingStatusEvent): void {
        this._fuseProgressBarService.hide();
        let JsonData = JSON.parse(evt.JsonData);
        this._interactionManagerService.updateInteraction(evt.InteractionID, {
            isEmailSent: true,
            isReplySent: true
        });
        if (JsonData?.OutboundData?.SocialMediaData) {
            if (SMP_SEND_STATUS[JsonData?.StatusCode] !== 'Success') {
                let errorMsg = SMP_SEND_STATUS[JsonData?.StatusCode]
                    ? SMP_SEND_STATUS[JsonData?.StatusCode]
                    : 'Unknown';
                let errReason = `${this.translocoService.translate(
                        `sharedComponents.socialMediaPosts.commentReplySendError${errorMsg}`
                    )}`;
                this._appUIService.showSnackbar(
                    `${this.translocoService.translate(`sharedComponents.socialMediaPosts.asyncCommentReplySendFail`)}${errReason}`,
                    'failure'
                );
            }
        } else {
            if (EMAIL_SEND_STATUS[JsonData?.StatusCode] === 'Success') {
                
                // check if the email is sent to customer successfully or it has any other status & display message accordingly
                const currentStatusMessage = EMAIL_CURRENTSTATUS_CODES[JsonData?.OutboundData?.CurrentStatus];

                if (currentStatusMessage) {
                    this._appUIService.showSnackbar(
                        this.translocoService.translate(currentStatusMessage)
                    );
                } else {
                    this._appUIService.showSnackbar(
                        this.translocoService.translate('sharedComponents.email.asyncEmailSendSuccess')
                    );
                }

            } else {
                let errReason = '';
                let errorMsg = EMAIL_SEND_STATUS[JsonData?.StatusCode]
                    ? EMAIL_SEND_STATUS[JsonData?.StatusCode]
                    : 'Unknown';

                if (errorMsg === 'FailedWithServerBusyException') {
                    try {
                        let outData = JsonData.OutboundData;
                        errReason = `${this.translocoService.translate(
                            `sharedComponents.email.emailSendError${errorMsg}`
                        )}`;
                        errReason = errReason.replaceAll('{1}', outData.Mailbox);
                    } catch (err) {
                        errorMsg = 'Unknown';
                        errReason = `${this.translocoService.translate(
                            `sharedComponents.email.emailSendError${errorMsg}`
                        )}`;
                    }
                } else {
                    errReason = `${this.translocoService.translate(
                        `sharedComponents.email.emailSendError${errorMsg}`
                    )}`;
                }
                this._appUIService.showSnackbar(
                    `${this.translocoService.translate(`sharedComponents.email.asyncEmailSendFail`)}${errReason}`,
                    'failure'
                );
            }
        }

        if (
            EMAIL_SEND_STATUS[JsonData?.StatusCode] === 'Success' ||
            SMP_SEND_STATUS[JsonData?.StatusCode] === 'Success'
        ) {
            this._sharedService.triggerEmailFailure(evt.InteractionID);
            SDKClient.closeInteraction(evt.InteractionID.toString(), null)
                .then((dt: IResponse) => {
                    // check the response
                    if (dt.response && dt.response.ResultCode === 0) {
                        this._appUIService.showSnackbar(
                            this.translocoService.translate('interactionComponent.closeInteractionSuccess')
                        );
                        // remove the interaction reference
                        this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                    }
                })
                .catch(() => {
                    this._appUIService.showSnackbar(
                        this.translocoService.translate('interactionComponent.closeInteractionFailed'),
                        'failure'
                    );
                });
        }
    }

    /**
     * To process interaction closed event
     */
    tabCloseEvent(evt: InteractionClosedEvent | AutoCloseTabEvent): void {
        // since we have this widget for all interaction
        // check this interaction id belongs to this widget interaction list
        const thisInteraction = this.interactions.filter((i) => i.interactionDetails.InteractionID === evt.InteractionID);
        if (!thisInteraction.length) {
            return;
        }

        // remove the interaction reference
        this._interactionManagerService.removeInteraction(evt.InteractionID);

        // close all the AOTs
        this.interactions.forEach((i) => {
            if (i.interactionDetails.InteractionID === evt.InteractionID) {
                i.widgets.aot.forEach((widget) => {
                    if (!widget.Config.Enabled) return;
                    this._aotWidgetService.destroyWidget(widget.ID);
                });
            }
        });

        // get previous/next interaction index
        const currentIndex = this.interactions.findIndex((i) => i.interactionDetails.InteractionID === evt.InteractionID);
        const prevInteractionIndex = currentIndex - 1;
        const nextInteractionIndex = currentIndex;

        // filter out the interaction
        this.interactions = this.interactions.filter((i: InteractionWidgets) => i.interactionDetails.InteractionID !== evt.InteractionID);

        // if there are other item in the list auto select fist interaction after closing current
        if (this.interactions.length > 0) {
            // go to previous or next or first interaction
            const routeInteraction = this.interactions[prevInteractionIndex] ?? this.interactions[nextInteractionIndex] ?? this.interactions[0];
            this._interactionManagerService.updateInteraction(routeInteraction.interactionDetails.InteractionID, {
                isActive: true
            });
        } else {
            this.activeInteraction = 0;
        }
    }

    /**
     * On page active callback
     */
    onActive = () => {
        if (!this.activeInteraction) {
            return;
        }
        // check if there is active interaction already
        this._interactionManagerService.updateInteraction(this.activeInteraction, {
            isActive: true
        });
    };

    /**
     * On page inactive callback
     */
    onInactive = () => {
        if (!this.activeInteraction) {
            return;
        }
        this._interactionManagerService.updateInteraction(this.activeInteraction, {
            isActive: false
        });
    };
}
