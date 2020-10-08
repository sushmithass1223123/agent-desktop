import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { fuseAnimations } from '@fuse/animations';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { InteractionRef } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';
import { AVChannel, IResponse, SDKClient } from 'tmac-sdk';

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
     * Need more description
     * Current view mode
     */
    currentViewMode: string;

    constructor(
        private _interactionManagerService: InteractionManagerService,
        private _contentPageService: ContentPageService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService
    ) {
        super();
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
                // TODO:: check if filter for status is needed
                // this.interactionList = interactions.filter(i => i.status !== 'disconnected');
                this.interactionList = interactions;
                // }, 500);
            });

        // subscribe to content page subject
        this._contentPageService.mode
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((mode: string) => {
                this.currentViewMode = mode;
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
        }
        else {
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
     * Hold call
     * @param {InteractionRef} item 
     * @param {MatButton} btn 
     */
    public holdCall(item: InteractionRef, btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // check if ms call then do not call api, invoke webclient api hold
        if (item.otherData.isMSCall) {
            // get the connection variable
            const connection: AVChannel = item.otherData.avConn;
            // check if the connection is there and interaction is not on hold
            if (connection && item.status !== 'hold') {
                connection.hold();
            }
            return;
        }
        SDKClient.holdCall(item.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                }
                else {
                    this._appUIService.showSnackbar('Hold call failed', 'failure');
                }
            });
    }

    /**
     * UnHold call
     * @param {InteractionRef} item 
     * @param {MatButton} btn 
     */
    public unHoldCall(item: InteractionRef, btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        // check if ms call then do not call api, invoke webclient api hold
        if (item.otherData.isMSCall) {
            // get the connection variable
            const connection: AVChannel = item.otherData.avConn;
            // check if the connection is there and interaction is on hold
            if (connection && item.status === 'hold') {
                connection.unHold();
            }
            return;
        }
        SDKClient.unHoldCall(item.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                }
                else {
                    this._appUIService.showSnackbar('Unhold call failed', 'failure');
                }
            });
    }

    /**
     * Disconnect Call
     * @param {InteractionRef} item 
     * @param {MatButton} btn 
     */
    public disconnectCall(item: InteractionRef, btn: MatButton): void {
        // toggle the button
        this.toggleButton(true, btn);
        SDKClient.disconnectCall(item.interactionId.toString(), null)
            .then((dt: IResponse) => {
                // toggle the button
                this.toggleButton(false, btn);
                // check for the response
                if (dt.response && dt.response.ResultCode === 0) {
                    // disconnect call success
                }
                else {
                    this._appUIService.showSnackbar('Disconnect call failed', 'failure');
                }
            });
    }
}
