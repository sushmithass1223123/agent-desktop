import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { IWidget } from 'app/interfaces';
import { IResponse, SDKClient } from 'tmac-sdk';

/**
 * Generic Controls Components
 */
@Component({
    selector: 'tw-generic-controls',
    templateUrl: './tw-generic-controls.component.html',
    styleUrls: ['./tw-generic-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwGenericControlsComponent extends TWidgetWrapper implements OnInit, AfterViewInit, OnDestroy {
    /**
     * Daat from App config
     */
    @Input() data: IWidget;

    /**
     * Confirm dialog ref
     */
    dialogRef: MatDialogRef<any, any>;

    /**
     * Interaction Id
     */
    interactionId: number;

    /**
     * Data to be displayed
     */
    displayData = {
        type: '',
        intent: ''
    };

    constructor(
        private _appUIService: AppUiService,
        private _interactionManagerService: InteractionManagerService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _contentPageService: ContentPageService
    ) {
        super();
    }

    /**
     * Lifecycle hook
     * @method OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        if (this.data.InteractionDetails) {
            const interactionDetails = this.data.InteractionDetails;
            // set the interaction id from data
            this.interactionId = interactionDetails.InteractionID;
            // create display data
            this.displayData = {
                type: interactionDetails.Item.Type,
                intent: interactionDetails.Item.Intent
            };
        }
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
     * Lifecycle hook
     * @method OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * Toggle Button
     * Need More description
     * @method toggleButton
     * @param {Boolean} show
     * @param {MatButton} btn
     */
    private toggleButton(show: boolean, btn: MatButton): void {
        if (show) {
            // show the progress bar
            this._fuseProgressBarService.show();
            // disable the button
            if (btn) {
                btn.disabled = true;
            }
        } else {
            // hide the progress bar
            this._fuseProgressBarService.hide();
            // enable button after response
            if (btn) {
                btn.disabled = false;
            }
        }
    }

    /**
     * Close interaction
     * @method closeInteraction
     * @param {MatButton} btn
     */
    private closeInteraction(btn: MatButton): void {
        this.toggleButton(true, btn);
        SDKClient.closeInteraction(this.interactionId.toString(), null)
            .then((dt: IResponse) => {
                this.toggleButton(false, btn);
                if (dt.response && dt.response.ResultCode === 0) {
                    this._appUIService.showSnackbar('Interaction closed successfully');
                    // remove the interaction reference
                    this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                } else {
                    this._appUIService.showSnackbar('Close interaction failed', 'failure');
                    this.toggleButton(false, btn);
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar('Close interaction failed', 'failure');
                this.toggleButton(false, btn);
            });
    }

    /**
     * Confirm Close Interaction
     * @method confirmCloseInteraction
     * @param {MatButton} btn
     */
    confirmCloseInteraction(btn: MatButton): void {
        // config force login
        this.dialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        this.dialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server
                this.closeInteraction(btn);
            }
        });
    }

}
