import { TwLogout } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { IAUXCodes, IResponse, SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils';

/**
 * Logout button component
 */
@Component({
    selector: 'tw-logout',
    templateUrl: './tw-logout.component.html',
    styleUrls: ['./tw-logout.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwLogoutComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: TwLogout;
    /**
     * Can logout flag
     */
    canLogout: boolean;

    /**
     * Logout Aux
     */
    logoutAux: string[];

    constructor(
        private _router: Router,
        private _fuseProgressBarService: FuseProgressBarService,
        private _appUIService: AppUiService,
        private _tmacEventService: TMACEventService
    ) {
        super('TwLogoutComponent');
        this.logoutAux = [];
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // set defaults
        this.data.Data = {
            LogoutAux: [],
            AllowLogoutOnOpenInteractions: true,
            AllowLogoutOnAvailable: false,
            ...this.data.Data
        };
        // assign the logout aux by checking the type of config for backward compatibility
        this.logoutAux =
            typeof this.data.Data.LogoutAux === 'string' ? (this.data.Data.LogoutAux ? [this.data.Data.LogoutAux] : []) : this.data.Data.LogoutAux;
        // listen for agent status change event
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
        this.canLogout = !this.logoutAux.length;
        // initial check
        this.findLogoutAux();
    }

    /**
     * Lifecycle hookk
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    /**
     * Trigered when agent changes status
     * @method
     */
    private AgentStatusChangeEvent = () => {
        this.findLogoutAux();
    };

    /**
     * Check if the agent can logout
     * @method
     */
    private findLogoutAux(): void {
        const currentAux = SDKClient.getAgentData().agentStatus?.toLocaleLowerCase();
        // should not allow agents to logout on "On Call" status when LogoutAux is configured or not
        if (currentAux.includes('on call')) {
            this.canLogout = false;
            return;
        }

        // check if LogoutAux is configured
        // if LogoutAux is not configured then check if the status is "Available" and AllowLogoutOnAvailable
        if (!this.logoutAux.length && ((currentAux === 'available' && this.data.Data.AllowLogoutOnAvailable) || currentAux !== 'available')) {
            this.canLogout = true;
            return;
        }

        try {
            // get the logout code from aux codes list
            const auxItem: IAUXCodes = SDKClient.getAgentData().auxCodes.filter((a: IAUXCodes) => a.Name.toLowerCase() === currentAux)?.[0];
            // check if the logout aux matches
            if (this.logoutAux.includes(auxItem?.Code)) {
                this.canLogout = true;
            } else {
                this.canLogout = false;
            }
        } catch (error) {}
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * To logout user from TMAC
     */
    logout(): void {
        //
        if (!this.data.Data.AllowLogoutOnOpenInteractions && SDKClient.getInteractions().length) {
            this._appUIService.showSnackbar('Please complete the interaction before logging out!', 'failure');
            return;
        }

        // confirm logout
        const confirmDialogRef = this._appUIService.showAppConfirmDialog('logout');
        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
            if (dialogResult) {
                // logout error
                this._appUIService.showSnackbar('Please wait, logging out...', 'loading');
                // show the progress bar
                this._fuseProgressBarService.show();
                SDKClient.logout(
                    {
                        reason: 'ManualLogout'
                    },
                    null
                )
                    .then((dt: IResponse) => {
                        // hide the progress bar
                        this._fuseProgressBarService.hide();
                        // check if the logout is success
                        if (dt.response && dt.response.ResultCode === 0) {
                            this._appUIService.showSnackbar('Logged out successfully');
                            // route back to login page
                            this._router.navigate(['login']);
                        } else {
                            // logout error
                            this._appUIService.showSnackbar('Logout failed, please try again', 'failure');
                        }

                        // emit login event
                        this._tmacEventService.emitSDKEvent({
                            event: {
                                EventName: 'AgentLogoutEvent',
                                InteractionID: 0,
                                Data: dt.response
                            },
                            isInteractionEvent: false,
                            log: true
                        });
                    })
                    .catch(() => {
                        this._appUIService.showSnackbar('Logout failed, please try again', 'failure');
                    });
            }
        });
    }
}
