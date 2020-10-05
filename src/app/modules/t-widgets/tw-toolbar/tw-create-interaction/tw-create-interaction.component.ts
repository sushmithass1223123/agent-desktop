import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { widgetFabAnimations } from '@modules/shared/animations/widget-fab.animation';
import { CreateSmsComponent } from '@modules/shared/create-sms/create-sms.component';
import { AppUiService } from '@services/app-ui.service';
import { IWidget } from 'app/interfaces';
import { CommandResultEvent, IResponse, SDKClient } from 'tmac-sdk';

@Component({
    selector: 'tw-create-interaction',
    templateUrl: './tw-create-interaction.component.html',
    styleUrls: ['./tw-create-interaction.component.scss'],
    animations: widgetFabAnimations,
    encapsulation: ViewEncapsulation.None
})
export class TwCreateInteractionComponent implements OnInit, OnDestroy {
    /**
     * Widget data
     */
    @Input() data: IWidget;

    constructor(
        private _matDialog: MatDialog,
        private _appUIService: AppUiService
    ) { }

    /**
     * All channel list
     */
    channels = [];


    /**
     * OnInit
     */
    ngOnInit(): void {
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this._matDialog.closeAll();
    }

    /**
     * To create an outgoing interaction
     * 
     * @param channel
     */
    addInteraction(channel: string): void {
        this.channels = [];
        switch (channel.toLowerCase()) {
            case 'sms':
                this._matDialog.open(CreateSmsComponent, {
                    panelClass: 'create-sms-dialog'
                });
                break;
            case 'voice':
                const dialogRef = this._appUIService.showCustomDialog('prompt', 'Enter number to make a call', 'Make Call');
                dialogRef.afterClosed().subscribe((resp) => {
                    if (resp) {
                        SDKClient.makeCall({
                            interactionId: '0',
                            number: resp,
                            source: '',
                            sourceId: ''
                        })
                            .then((dt: IResponse) => {
                                // get the response
                                const result: CommandResultEvent = dt.response;
                                // check the response
                                if (result.ResultCode === 0) {
                                    // make call success
                                    this._appUIService.showSnackbar(`Make call to ${resp} successful`);
                                } else {
                                    // make call failed
                                    this._appUIService.showSnackbar('Make call failed, please try manually', 'failure');
                                }
                            })
                            .catch(() => {
                                // make call error
                                this._appUIService.showSnackbar('Make call error, please try manually', 'failure');
                            });
                    }
                }
                );
                break;
        }
    }
}
