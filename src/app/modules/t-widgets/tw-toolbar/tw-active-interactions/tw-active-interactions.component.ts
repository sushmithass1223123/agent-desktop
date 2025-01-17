import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { fuseAnimations } from '@fuse/animations';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { AVChannel, IResponse, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils';
import { InteractionRef } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import { TMACEventService } from '@services/tmac-event.service';

/**
 * Active interactions
 */
@Component({
    selector: 'tw-active-interactions',
    templateUrl: './tw-active-interactions.component.html',
    styleUrls: ['./tw-active-interactions.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwActiveInteractionsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App json data
     */
    @Input() data: any;

    /**
     * Interaction list
     */
    interactionList: InteractionRef[] = [];

    /**
     * Email interactions ref
     */
    emailInteractionList: InteractionRef[] = [];

    /**
     * Need more description
     * Current view mode
     */
    currentViewMode: string = '';

    constructor(
        private _interactionManagerService: InteractionManagerService,
        private _contentPageService: ContentPageService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService,
        private translocoService: TranslocoService,
        private _tmacEventService: TMACEventService
    ) {
        super('TwActiveInteractionsComponent');
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to interactions subject
        this._interactionManagerService.interactions
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((interactions: InteractionRef[]) => {
                // setTimeout(() => {
                // non email interactions
                this.interactionList = interactions.filter((i) => i.type !== 'email');
                // filter email interactions
                this.emailInteractionList = interactions.filter((i) => i.type === 'email');
                // }, 500);
            });

        // subscribe to content page subject
        this._contentPageService.mode.pipe(takeUntil(this.unsubscribeAll)).subscribe((mode: string) => {
            this.currentViewMode = mode;
        });
        // subscribe to UI control events
        this._tmacEventService.getUIControlEvents.pipe(takeUntil(this.unsubscribeAll)).subscribe((data: any) => {
            try {
                if (data && data.interactionId) {
                    this.handleUIControls(data);
                }
            } catch (e) {
                console.log('Error occurred on UIControl event received', e);
            }
        });
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
    
    /**
     * Method to manipulate interaction controls based on the custom events
     * @param data 
     */
    handleUIControls(data:any): void {
        if (data.eventName === 'changePhoneNumber') {
            const index = this.interactionList.findIndex(item => item.interactionId === data.interactionId);
            if (index !== -1) {
                this.interactionList[index].user = data.phoneNumber;
            }
        }
    }

    /**
     * Trackby for mat tree node
     * @param _index
     * @param email
     * @returns
     */
    trackBy = (_index: number, item: InteractionRef): string => {
        return item.status || item.user || item.otherData;
    };

    /**
     * Toggle button
     * @param {boolean} show
     * @param {MatButton} btn
     */
    private toggleButton(show: boolean, btn: MatButton): void {
        if (show) {
            // show the progress bar
            this._fuseProgressBarService.show();
            // disable the button
            btn.disabled = true;
        } else {
            // enable button after response
            btn.disabled = true;
            // hide the progress bar
            this._fuseProgressBarService.hide();
        }
    }

    /**
     * Open Interaction
     * @param {InteractionRef} item
     */
    public openInteraction(item: InteractionRef): void {
        const data: any = new Object();

        // if the item is already active ignore
        if (!item.isActive) {
            data.isActive = true;
        }

        // check the type
        if (item.type === 'textchat') {
            // reset unread count
            data.otherData = {
                unreadCount: 0
            };
        }

        // if there is data, then update the interaction
        if (Object.keys(data).length > 0) {
            // set interaction active
            this._interactionManagerService.updateInteraction(item.interactionId, data);
        }

        // if current mode item view mode then ignore
        if (item.path !== this.currentViewMode) {
            // set the content page active
            this._contentPageService.mode = item.path;
        }
    }

    /**
     * Hold/Un hold call
     * @param {InteractionRef} item
     * @param {MatButton} btn
     */
    public holdUnHoldCall(type: string, item: InteractionRef, btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // check if ms call then do not call api, invoke webclient api hold
        if (item.otherData.isMSCall) {
            const connections: AVChannel[] = item.otherData.avConns;
            const callLines: string[] = item.otherData.callLines;
            callLines.forEach((sessionId: any) => {
                // get the connection variable
                const connection: AVChannel = connections[sessionId];
                // check if the connection is there and interaction is not on hold
                if (connection) {
                    if (type === 'hold' && item.status !== 'hold') {
                        connection.hold();
                    } else if (type === 'unhold' && item.status === 'hold') {
                        connection.unHold();
                    } else {
                        // toggle the button
                        this.toggleButton(false, btn);
                    }
                } else {
                    // toggle the button
                    this.toggleButton(false, btn);
                }
            });
            return;
        }

        // for PBX calls
        if (type === 'hold') {
            SDKClient.holdCall(item.interactionId.toString(), null).then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                } else {
                    this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.holdCallFailed'), 'failure');
                }
            });
        } else {
            SDKClient.unHoldCall(item.interactionId.toString(), null).then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                } else {
                    this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.unHoldCallFailed'), 'failure');
                }
            });
        }
    }

    /**
     * Disconnect Call
     * @param {InteractionRef} item
     * @param {MatButton} btn
     */
    public disconnectCall(item: InteractionRef, btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        SDKClient.disconnectCall(item.interactionId.toString(), null).then((dt: IResponse) => {
            // toggle the button
            this.toggleButton(false, btn);
            // check for the response
            if (dt.response && dt.response.ResultCode === 0) {
                // disconnect call success
            } else {
                this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.disconnectCallFailed'), 'failure');
            }
        });
    }
}
