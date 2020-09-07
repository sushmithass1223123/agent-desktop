import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { ConfirmDialogComponent } from '@modules/shared/confirm-dialog/confirm-dialog.component';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { IAUXCodes, IResponse, SDKClient } from 'tmac-sdk';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'tw-logout',
    templateUrl: './tw-logout.component.html',
    styleUrls: ['./tw-logout.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwLogoutComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    logoutAux = '';
    canLogout: boolean;

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
        this.canLogout = this.logoutAux === '';

        // listen for agent status change event
        SDKClient.events.on('AgentStatusChangeEvent', () => {
            this.findLogoutAux();
        });

        // initial check
        this.findLogoutAux();
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    private findLogoutAux(): void {
        // check if logout aux provided
        if (!this.logoutAux) {
            return;
        }

        // get the logout code from aux codes list
        const auxItem: IAUXCodes = SDKClient.getAgentData().auxCodes.filter((a: IAUXCodes) => a.Name === SDKClient.getAgentData().agentStatus)?.[0];

        // check if the logout aux matches
        if (auxItem?.Code === this.logoutAux) {
            this.canLogout = true;
        }
        else {
            this.canLogout = false;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    logout(): void {
        // confirm logout 
        const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
            disableClose: false
        });
        confirmDialogRef.componentInstance.title = 'Confirm logout';
        confirmDialogRef.componentInstance.message = 'Are you sure you want to logout?';
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
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
        });
    }

}
