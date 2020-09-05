import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { SDKClient, IAgentData, AgentStatusChangeEvent, IAUXCodes, IResponse } from 'tmac-sdk';
import { environment } from 'environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@modules/shared/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { AppDataService } from '@services/app-data.service';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Component({
    selector: 'tw-agent-details',
    templateUrl: './tw-agent-details.component.html',
    styleUrls: ['./tw-agent-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAgentDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    agentData: IAgentData = null;
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
        // call the wrapper init method
        this.initWrapper(this.data);

        // get agent details
        this.agentData = SDKClient.getAgentData();

        // assign the logout aux if any
        this.logoutAux = this.data.Data.LogoutAux || '';
        this.canLogout = this.logoutAux === '';

        if (!environment.production) {
            console.log('TwAgentDetailsComponent: ', this.agentData);
        }

        // listen for agent status changing event
        SDKClient.events.on('AgentStatusChangingEvent', () => {
            this.agentData.agentStatus = 'Please wait...';
        });

        // listen for agent status change event
        SDKClient.events.on('AgentStatusChangeEvent', (evt: AgentStatusChangeEvent) => {
            this.agentData.agentStatus = evt.Status;
            this.findLogoutAux();
        });

        this.findLogoutAux();
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    private findLogoutAux(): void {
        // check if logout aux provided
        if (!this.logoutAux) {
            return;
        }

        // get the logout code from aux codes list
        const auxItem: IAUXCodes = this.agentData.auxCodes.filter(a => a.Name === this.agentData.agentStatus)?.[0];

        // check if the logout aux matches
        if (auxItem?.Code === this.logoutAux) {
            this.canLogout = true;
        }
        else {
            this.canLogout = false;
        }
    }


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
