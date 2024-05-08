import { InteractionWidgetBaseData, TwSmpControls, TwSmpControlsData } from '@ad/types';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { SocialMediaPostsService } from '@modules/shared/components/social-media-posts/social-media-posts.service';
import { TranslocoService } from '@ngneat/transloco';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { IAgentData, IncomingEmailEvent, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { InteractionRef, IWidget } from 'app/interfaces';
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

    sessionId: number | string;
    /**
     * User info
     */
    user: IAgentData;
    /**
     * Current interaction
     */
    currentInteraction: any = {};

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private translocoService: TranslocoService,
        private _interactionManagerService: InteractionManagerService,
        public smpService: SocialMediaPostsService,
        private _contentPageService: ContentPageService,
        private _appUiService: AppUiService
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

        console.log(this.smpService.postBodies[this.sessionId])

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
                            channel: this.smpService.postBodies[this.sessionId].SubChannel
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

        // update is active
        this._interactionManagerService.updateInteraction(item.interactionId, {
            isActive: true,
            otherData: {
                unreadCount: 0
            }
        });
    }
}
