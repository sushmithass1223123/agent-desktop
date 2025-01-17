import { TwGenericControls } from '@ad/types';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { TWidgetWrapper } from '@modules/t-widgets/utils/widget-wrapper/tw-wrapper';
import { AppUiService } from '@services/app-ui.service';
import { ContentPageService } from '@services/content-page.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { TMACEventService } from '@services/tmac-event.service';
import { IResponse, SDKClient } from '@tmac/sdk';
import { InteractionRef } from 'app/interfaces';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';

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
    @Input() data: TwGenericControls<any>;

    /**
     * Confirm dialog ref
     */
    dialogRef: MatDialogRef<any, any>;

    /**
     * Interaction Id
     */
    interactionId: number;

    /**
     * Interaction List
     */
    interactionList: InteractionRef[] = [];

    /**
     * Data to be displayed
     */
    displayData = {
        type: '',
        intent: ''
    };

    /**
     * To allow user to close
     */
    closeInteractionAllowed: boolean;

    /**
     * Fuse custom config
     */
    customFuse: any;

    @ViewChild('closeBtn') closeButton: MatButton;

    constructor(
        private _appUIService: AppUiService,
        private _interactionManagerService: InteractionManagerService,
        private _fuseProgressBarService: FuseProgressBarService,
        private _contentPageService: ContentPageService,
        private _fuseFacadeService: FuseFacadeService,
        private _tmacEventService: TMACEventService,
        private translocoService: TranslocoService
    ) {
        super('TwGenericControlsComponent');

        this.customFuse = {
            anchor$: this._fuseFacadeService.anchorBgClasses$().pipe(filter(() => this.data?.Config?.Anchor)),
            widget$: this._fuseFacadeService.widgetBgClasses$()
        };
    }

    /**
     * Lifecycle hook
     * @method OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // check config, default close interaction is true
        this.closeInteractionAllowed = this.data.Data.CloseInteractionAllowed ?? true;

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

        // subscribe to interaction manager service
        this._interactionManagerService.interactions.pipe(takeUntil(this.unsubscribeAll)).subscribe((interactions: InteractionRef[]) => {
            // filter out the textchat interaction
            this.interactionList = interactions.filter((i: InteractionRef) => i.type === 'generic');
        });

        this._tmacEventService.getUIControlEvents.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
            try{
                if(data && data.interactionID?.toString() === this.interactionId.toString()) {
                    this.handleUIControls(data);
                }
            } catch(e) {
                console.log('Error occured on UIControl event received');
            }
             
        });
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngAfterViewInit(): void {
        // check if the current page is email page
        if (
            this.data.Data.RouteOnInteraction &&
            this._interactionManagerService.getInteractionCount().active <= 1 &&
            this._contentPageService.getCurrentMode() !== this.data.Data.Path
        ) {
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
                    this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.closeInteractionSuccess'));
                    // remove the interaction reference
                    this._interactionManagerService.removeInteraction(dt.response.InteractionID);
                } else {
                    this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.closeInteractionFailed'), 'failure');
                    this.toggleButton(false, btn);
                }
            })
            .catch(() => {
                this._appUIService.showSnackbar(this.translocoService.translate('interactionComponent.closeInteractionFailed'), 'failure');
                this.toggleButton(false, btn);
            });
    }

    /**
     * Confirm Close Interaction
     * @method confirmCloseInteraction
     * @param {MatButton} btn
     */
    confirmCloseInteraction(btn: MatButton): void {
        this.dialogRef = this._appUIService.showAppConfirmDialog('closeInteraction');
        this.dialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // send end chat to server
                this.closeInteraction(btn);
            }
        });
    }

    /**
     * Select Interaction
     * @method selectInteraction
     * @param {InteractionRef} item
     */
    selectInteraction(item: InteractionRef): void {
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
     * Method to manipulate interaction controls based on the custom events
     * @param data 
     */
     handleUIControls(data) {
        if(data.eventName === 'disableCloseInteraction') {
            this.closeButton.disabled = true;
        }
        if(data.eventName === 'enableCloseInteraction') {
            this.closeButton.disabled = false;
        }
    }
}
