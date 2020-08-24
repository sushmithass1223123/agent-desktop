import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from '@modules/shared/confirm-dialog/confirm-dialog.component';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentStatusChangeEvent, IAgentData, IAUXCodes, IResponse, SDKClient } from 'tmac-sdk';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppDataService } from '@services/app-data.service';

@Component({
    selector: 'tw-aux-codes',
    templateUrl: './tw-aux-codes.component.html',
    styleUrls: ['./tw-aux-codes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAuxCodesComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    opened = false;
    auxCodesList: IAUXCodes[] = [
        {
            Code: 'nodata',
            Display: 1,
            MaxCount: 0,
            Name: 'No data available',
            TeamId: 0,
            Value: 0
        }
    ];
    currentAux: string;
    agentName = '';
    agentStatus = '';
    logoutAux = '';

    constructor(
        private _router: Router,
        private _dialog: MatDialog,
        private _appDataService: AppDataService,
        private _fuseProgressBarService: FuseProgressBarService
    ) {
        super();
    }

    ngOnInit(): void {
        this.initWrapper(this.data);

        // assign the logout aux if any
        this.logoutAux = this.data.Data.LogoutAux || '';

        // listen for agent status change event
        SDKClient.events.on('AgentStatusChangeEvent', (evt: AgentStatusChangeEvent) => {
            this.currentAux = evt.Status;
        });

        // get agent aux codes
        SDKClient.loadAUXCodes(false, null)
            .then((result: IResponse) => {
                // check if the data is null
                if (result.response && result.response.length > 0) {
                    // filter and assign the aux codes
                    this.auxCodesList = result.response.filter((a: IAUXCodes) => a.Display === 1);
                }
            });

        // get agent details
        const agentData: IAgentData = SDKClient.getAgentData();
        this.agentName = agentData.agentName;
        this.agentStatus = agentData.agentStatus;
        this.currentAux = agentData.agentStatus;
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    menuOpened(opened: boolean): void {
        this.opened = opened;
    }

    changeStatus(item: IAUXCodes): void {
        // show the progress bar
        this._fuseProgressBarService.show();
        // emit a custom event
        SDKClient.events.emit('AgentStatusChangingEvent');
        // change the status
        SDKClient.changeStatus({
            type: item.Code.toLocaleLowerCase() === 'available' ? 'available' : item.Code.toLocaleLowerCase() === 'acw' ? 'acw' : 'aux',
            code: item.Value.toString()
        }, item)
            .then((dt: IResponse) => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
                // check for null and check if logout aux is configured
                if (dt.response && this.logoutAux) {
                    // get the code based on status
                    const code = dt.userObject.Code.toLowerCase();
                    // check if it matches with the configured logout aux
                    if (code === this.logoutAux) {
                        // confirm logout 
                        const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
                            disableClose: false
                        });
                        confirmDialogRef.componentInstance.title = 'Confirm logout';
                        confirmDialogRef.componentInstance.message = 'Are you sure you want to logout?';
                        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
                            if (dialogResult) {
                                this.logout();
                            }
                        });
                    }
                }
            });
    }

    logout(): void {
        // logout error
        this._appDataService.showMessage('Please wait, logging out!');
        // show the progress bar
        this._fuseProgressBarService.show();
        SDKClient.logout('ManualLogout', null)
            .then((dt: IResponse) => {
                // hide the progress bar
                this._fuseProgressBarService.hide();
                // check if the logout is success
                if (dt.response && dt.response.ResultCode === 0) {
                    // route back to login page
                    this._router.navigate(['login']);
                }
                else {
                    // logout error
                    this._appDataService.showMessage('Logout failed, please try again');
                }
            });
    }
}
