import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from 'app/services/app-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommandResultEvent, IResponse, SDKClient, TUtils } from 'tmac-sdk';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class LoginComponent implements OnInit, OnDestroy {
    // Private
    private _unsubscribeAll: Subject<any>;

    appConfig: any;
    brandLogo = null;

    loginForm: FormGroup;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    loginConfig = null;
    logoSrc = '';
    logoAlt = '';
    logoWidth = 0;
    logoHeight = 0;

    domainListEnabled = false;
    promptAgentIdOnInvalidLanId = false;
    agentIdEnabled = false;
    passwordEnabled = false;
    hidePassword = true;
    stationEnabled = false;
    loginModeEnabled = false;
    pbxChecked = false;
    msChecked = false;

    domainList = [];

    loading = false;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private _appDataService: AppDataService,
        private _router: Router,
        private _dialog: MatDialog,
        private _snackBar: MatSnackBar
    ) {
        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar: {
                    hidden: true
                },
                toolbar: {
                    hidden: true
                },
                footer: {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };

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
        this.loginForm = this._formBuilder.group({
            domain: ['', [Validators.required]],
            lanId: ['', [Validators.required]],
            agentId: ['', [Validators.required]],
            password: ['', Validators.required],
            station: ['', Validators.required]
        });

        this.loadConfig();

        this.getData();
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
    // @  Methods
    // -----------------------------------------------------------------------------------------------------

    // to load the config
    private loadConfig(): void {
        // Subscribe to config changes
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
            this.configLoaded(config);
        });
    }

    private configLoaded(config: any): void {
        // check if the config is not null
        if (config !== null) {
            this.loginConfig = config.Login;
            this.logoSrc = config.AppConfigs.Logos.Customer.Large.Src;
            this.logoAlt = config.AppConfigs.Logos.Customer.Alt;
            this.logoWidth = config.AppConfigs.Logos.Customer.Large.Width;
            this.logoHeight = config.AppConfigs.Logos.Customer.Large.Height;

            this.domainListEnabled = config.Login.DomainListEnabled;
            this.passwordEnabled = config.Login.PasswordEnabled;
            this.stationEnabled = config.Login.StationEnabled;
            this.loginModeEnabled = config.Login.Modes.Enabled;
            this.promptAgentIdOnInvalidLanId = config.Login.PromptAgentIdOnInvalidLanId;

            this.brandLogo = config.AppConfigs.Logos.Default || null;

            // check if the login mode is enabled
            if (this.loginModeEnabled) {
                // check the login mode type
                if (config.Login.Modes.Type === 'pbx') {
                    // show station and check PBX
                    this.stationEnabled = true;
                    this.pbxChecked = true;
                } else if (config.Login.Modes.Type === 'ms') {
                    // show hide station and check MS
                    this.stationEnabled = false;
                    this.msChecked = true;
                } else if (config.Login.Modes.Type === 'pbxms') {
                    // show station and check PBX and MS
                    this.stationEnabled = true;
                    this.pbxChecked = true;
                    this.msChecked = true;
                } else {
                    // hide station
                    this.stationEnabled = false;
                }
            }
        } else {
            // we will route to error page
            this._router.navigate(['error']);
        }
    }

    // to get data from server
    private getData(): void {
        if (this.domainListEnabled) {
            SDKClient.getUserDomainList(null).then((result: IResponse) => {
                this.domainList = result.response || [];
            });
        }
    }

    public onPBXToggle(event: any): void {
        if (event.checked) {
            this.stationEnabled = true;
        } else {
            this.stationEnabled = false;
        }
    }

    public login(force: boolean): void {
        // set loading to true
        this.loading = true;

        const selectedDomain = this.loginForm.get('domain').value;
        const lanId = this.loginForm.get('lanId').value;
        const agentId = this.loginForm.get('agentId').value;
        const password = this.loginForm.get('password').value;
        const station = this.loginForm.get('station').value;

        // call sdk and login
        SDKClient.login(
            {
                lanId: this.domainListEnabled ? `${selectedDomain}\\${lanId}` : lanId,
                agentId: agentId,
                deviceId: this.stationEnabled ? station : lanId.toLowerCase(),
                forceReload: force,
                jsonData: JSON.stringify({
                    msLogin: this.msChecked,
                    pbxLogin: this.pbxChecked,
                    customAuthData: null
                }),
                password: password,
                sessionKey: ''
            },
            null
        ).then((result: IResponse) => {
            setTimeout(() => {
                // set loading to true
                this.loading = false;
                // process the login response
                this.loginResponse(result);
            }, 1000);
        });
    }

    private loginResponse(result: IResponse): void {
        try {
            // get the response
            const response: CommandResultEvent = result.response;
            // check the response
            if (response) {
                if (response.ResultCode > 0) {
                    if (response.ResultCode === 3) {
                        // config force login
                        this.confirmDialogRef = this._dialog.open(FuseConfirmDialogComponent, {
                            disableClose: false
                        });
                        this.confirmDialogRef.componentInstance.confirmMessage = 'Another session detected. Do you want to take it over?';
                        this.confirmDialogRef.afterClosed().subscribe((dialogResult) => {
                            if (dialogResult) {
                                this.login(true);
                            }
                            this.confirmDialogRef = null;
                        });
                    } else {
                        // login success
                        // we will route to main page
                        this._router.navigate(['main'], {
                            queryParamsHandling: 'preserve',
                            preserveFragment: true,
                            state: {
                                fromUrl: 'login'
                            }
                        });
                    }
                } else if (response.ResultCode === -3) {
                    // invalid Lan id check whether to prompt agent Id
                    if (this.promptAgentIdOnInvalidLanId) {
                        this.showMessage('Invalid LAN ID detected. Please provide agent id');
                        this.agentIdEnabled = true;
                    } else {
                        // login failed, invalid lan Id
                        this.showMessage('Invalid LAN ID detected. Please contact administrator for TMAC access');
                    }
                } else {
                    // login failed
                    this.showMessage(response.ResultMessage ? response.ResultMessage : 'Login failed, Unknown response from server');
                }
            } else {
                // login error
                this.showMessage('Login failed, Please contact the administrator');
            }
        } catch (error) {
            TUtils.Logger.log('Exception in login', error);
        }
    }

    private showMessage(message: string, style?: string): void {
        this._snackBar.open(message, 'x', {
            duration: 2000,
            verticalPosition: 'top', // 'top' | 'bottom'
            horizontalPosition: 'right', // 'start' | 'center' | 'end' | 'left' | 'right'
            panelClass: style ? [style] : ['snackbar']
        });
    }

    public numberOnly(event: any): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    resetField(field: string): void {
        this.loginForm.patchValue({ [field]: '' });
    }
}
