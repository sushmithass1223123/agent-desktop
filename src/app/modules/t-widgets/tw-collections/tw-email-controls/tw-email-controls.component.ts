import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { InteractionRef, IWidget, ResData } from 'app/interfaces';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { IAgentData, IResponse, SDKClient } from 'tmac-sdk';
import { TwEmailControlsMachine } from './tw-email-controls.machine';

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
    getInboxMessageReq: ResData<any> = {
        error: false,
        loading: false,
        msg: ''
    };

    fuseConfig: FuseConfig;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    maximized: boolean;
    interactionList: InteractionRef[];
    interactionId: number;
    user: IAgentData;

    @ViewChildren(FusePerfectScrollbarDirective) directiveScrolls: QueryList<FusePerfectScrollbarDirective>;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _interactionManagerService: InteractionManagerService,
        private _appDataService: AppDataService,
        public machine: TwEmailControlsMachine,
        private domSanitizer: DomSanitizer,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // this.machine.setupMachine(emailControlsMachine.withConfig({}, {}));

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails?.InteractionID;

        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            // filter out the textchat interaction
            this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'email');
            // this.machine.actions$.next({ type: 'FETCH_EMAIL', sessionId: this.interactionList[0].otherData.SessionId });
            if (this.interactionList.length) {
                const { Subject, From, CreatedTime, SessionId } = this.interactionList.find((x) => x.isActive).otherData;

                this.getInboxMessageReq = {
                    error: false,
                    loading: true,
                    data: {
                        Subject,
                        CreatedTime,
                        From,
                        SessionId
                    }
                };

                this.getFullEmail(SessionId);
            }
        });

        // set the user info
        this.user = SDKClient.getAgentData() || null;

        // play new email sound
        this._appUIService.playAudio('new-email', 0.5);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    getFullEmail(SessionId?: string): void {
        SDKClient.getInboxEmail(SessionId || this.getInboxMessageReq.data.SessionId)
            .then((res) => {
                this.getInboxMessageReq = {
                    error: false,
                    loading: false,
                    data: {
                        ...(this.getInboxMessageReq.data || {}),
                        ...{ ...res.response, Body: this.domSanitizer.bypassSecurityTrustHtml(res.response.Body) }
                    }
                };
            })
            .catch(() => {
                this.getInboxMessageReq = {
                    error: true,
                    loading: false
                };
            });
    }

    closeEmail(btn: MatButton): void {
        // confirm close interaction
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        confirmDialogRef.afterClosed().subscribe((dialogResult: boolean) => {
            if (dialogResult) {
                // send end chat to server 
                // show the progress bar 
                this._fuseProgressBarService.show();
                // disable the button
                btn.disabled = true;
                SDKClient.changeEmailStatus({
                    routeId: this.getInboxMessageReq.data.RouteId,
                    sessionId: this.getInboxMessageReq.data.SessionId,
                    status: 'Close'
                })
                    .then(() => this.closeInteraction(btn))
                    .catch(() => {
                        this._appUIService.showSnackbar('Close interaction failed!', 'failure');
                    });
            }
        });
    }

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
}
