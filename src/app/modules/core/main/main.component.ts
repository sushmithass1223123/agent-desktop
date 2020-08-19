import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentForcedLogoffEvent, SDKClient } from 'tmac-sdk';

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
        private _snackBar: MatSnackBar
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

        // check if the main is routed from login
        if (!history.state.fromUrl || history.state.fromUrl !== 'login') {
            SDKClient.getLoginData().then((dt: any) => {
                // check if the login data is available, if not route back to login page
                if (dt === null || !dt.agentData.isLoggedIn) {
                    // we will route to login page
                    this._router.navigate(['login']);
                }
                else {
                    this.pollForEvent();
                }
            });
        }
        else {
            this.pollForEvent();
        }
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

    private pollForEvent(): void {
        this._snackBar.open('Hello, welcome to TMAC', 'x', {
            duration: 3000,
            verticalPosition: 'top', // 'top' | 'bottom'
            horizontalPosition: 'center', // 'start' | 'center' | 'end' | 'left' | 'right'
            panelClass: ['snackbar']
        });

        // set the loaded to true
        this.loaded = true;

        // register for get events
        SDKClient.getEvents();

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
    }
}
