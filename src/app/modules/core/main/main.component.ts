import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentForcedLogoffEvent, SDKClient, InteractionClosedEvent } from 'tmac-sdk';
import { ILoginData } from 'app/interfaces';
import { InteractionManagerService } from '@services/interaction-manager.service';
import { InteractionEventsService } from '@services/interaction-events.service';

@Component({
    selector: 'main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

    fuseConfig: any;
    loaded = false;

    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        @Inject(DOCUMENT) private document: any,
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _router: Router,
        private _snackBar: MatSnackBar,
        private _appDataService: AppDataService,
        private _interactionManagerService: InteractionManagerService,
        // this service must not be removed, this will listen to some TMAC events
        private _interactionEventsService: InteractionEventsService
    ) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {

                this.fuseConfig = config;

            });

        // check the login
        this.checkLogin();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private async checkLogin(): Promise<any> {
        // get the login data
        const loginData = await SDKClient.getLoginData();
        // check if the main is routed from login
        if (!history.state.fromUrl || history.state.fromUrl !== 'login') {
            // check if the login data is available, if not route back to login page
            if (loginData === null || !loginData.agentData.isLoggedIn) {
                // we will route to login page
                this._router.navigate(['login']);
            }
            else {
                this.pollForEvent(loginData);
            }
        }
        else {
            this.pollForEvent(loginData);
        }
    }

    private pollForEvent(loginData: ILoginData): void {
        this._snackBar.open('Hello, welcome to TMAC', 'x', {
            duration: 3000,
            verticalPosition: 'top', // 'top' | 'bottom'
            horizontalPosition: 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
            panelClass: ['snackbar']
        });

        // set the login data
        this._appDataService.setLoginData(loginData);

        // set the loaded to true
        this.loaded = true;

        // listen to the interaction closed event and remove from service
        SDKClient.events.on('InteractionClosedEvent', (evt: InteractionClosedEvent) => {
            // remove interaction from service
            this._interactionManagerService.removeInteraction(evt.InteractionID);
            // remove the events from service
            this._interactionEventsService.remove(evt.InteractionID);
        });

        // listen to force log off event
        SDKClient.events.on('AgentForcedLogoffEvent', (evt: AgentForcedLogoffEvent) => {
            let description = '';
            switch (evt.Type) {
                case 'SupervisorInitiatedLogout':
                    description = 'You are logged out by the supervisor!';
                    break;
                case 'SessionNotFound':
                    description = 'There is no session found in server, pelase re-login!';
                    break;
                case 'SessionKeyExpired':
                    description = 'Your existing session expired as you are logged in using another session!';
                    break;
                case 'NotLoggedIntoACD':
                    description = '';
                    break;
                case 'AgentInfoNotFound':
                    description = 'Agent information not found, please re-login!';
                    break;
                default:
            }
            // we will route to login page
            this._router.navigate(['not-found'],
                {
                    queryParamsHandling: 'preserve',
                    preserveFragment: true,
                    state: {
                        subtitle: 'Oops',
                        title: '',
                        description
                    }
                });
        });

        // register for get events
        SDKClient.getEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key: any): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
