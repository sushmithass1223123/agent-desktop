import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { AgentFeaturesService } from '@services/agent-features.service';
import { InteractionEventService } from '@services/interaction-event.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentForcedLogoffEvent, SDKClient } from 'tmac-sdk';

@Component({
    selector: 'main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy, AfterViewInit {

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
        private _agentFeaturesService: AgentFeaturesService,
        // this service must not be removed, this will listen to some TMAC events
        private _interactionEventsService: InteractionEventService
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
        // register to all the tmac events in service
        this._interactionEventsService.registerTMACEvents();

        // Subscribe to config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {
                this.fuseConfig = config;
            });
    }

    /**
     * On After View Init
     */
    ngAfterViewInit(): void {
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

        // de-register the TMAC events in service
        this._interactionEventsService.deReigsterTMACEvents();

        // deregister from tmac events
        SDKClient.events.off('AgentForcedLogoffEvent', this.forcedLogoffEvent);

        // remove the processed features
        this._agentFeaturesService.clearAgentFeatures();
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
                this.pollForEvent();
            }
        }
        else {
            this.pollForEvent();
        }
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

        // listen to force log off event
        SDKClient.events.on('AgentForcedLogoffEvent', this.forcedLogoffEvent);

        // register for get events
        SDKClient.getEvents();

        // process the agent features
        this._agentFeaturesService.processAgentFeatures();
    }

    forcedLogoffEvent = (evt: AgentForcedLogoffEvent) => {
        let description = '';
        switch (evt.Type) {
            case 'SupervisorInitiatedLogout':
                description = 'You are logged out by the supervisor!';
                break;
            case 'SessionNotFound':
                description = 'There is no session found in server, please re-login!';
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
        // we will route to not-found page
        this._router.navigate(['not-found'],
            {
                queryParamsHandling: 'preserve',
                preserveFragment: true,
                state: {
                    subtitle: 'Oops',
                    title: '',
                    description,
                    login: true
                }
            });
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
