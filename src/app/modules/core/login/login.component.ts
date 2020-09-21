import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { ConfirmDialogComponent } from '@modules/shared/confirm-dialog/confirm-dialog.component';
import { AppDataService } from 'app/services/app-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommandResultEvent, IResponse, SDKClient, TUtils } from 'tmac-sdk';
import { environment } from '../../../../environments/environment';

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

    @ViewChild('video', { static: false }) videoElement: ElementRef;

    appConfig: any;
    brandLogo = null;
    loginForm: FormGroup;
    loginConfig = null;
    logoSrc = '';
    logoAlt = '';
    logoWidth = 0;
    logoHeight = 0;

    faceAuthEnabled = false;
    faceAuthServerUrl = '';
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
    version = '';

    selfVideo: MediaStream;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private _appDataService: AppDataService,
        private _router: Router,
        private _dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private _activatedRouter: ActivatedRoute
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

        this._activatedRouter.paramMap.subscribe(paramMap => {
            // check if lanId in param
            if (paramMap.has('lanId')) {
            }
        });

        this.loginForm = this._formBuilder.group({
            domain: ['', Validators.required],
            lanId: ['', Validators.required],
            agentId: ['', Validators.required],
            password: ['', Validators.required],
            station: ['', Validators.required]
        });

        this.loadConfig();

        // open self view if face auth is enabled
        if (this.faceAuthEnabled) {
            this.startCamera();
        }

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
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {
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

            this.faceAuthEnabled = config.Login.FaceAuth?.Enabled;
            this.faceAuthServerUrl = config.Login.FaceAuth?.AuthServerUrl;
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
                    // show station and check MS
                    this.stationEnabled = true;
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

    private startCamera(): void {
        // capture selfview
        navigator.getUserMedia(
            {
                audio: false,
                video: true
            },
            (stream: MediaStream) => {
                this.selfVideo = stream;
            },
            (error: MediaStreamError) => {
                this.showMessage(error.message);
            }
        );
    }

    private async doFaceAuthentication(): Promise<boolean> {
        // create a canvas
        const canvas = document.createElement('canvas');
        // scale the canvas accordingly
        canvas.width = this.videoElement?.nativeElement.videoWidth;
        canvas.height = this.videoElement?.nativeElement.videoHeight;
        // get the context
        const ctx = canvas.getContext('2d');
        // draw the canvas
        ctx.drawImage(this.videoElement?.nativeElement, 0, 0, canvas.width, canvas.height);
        // get base64 url
        const base64 = canvas.toDataURL();

        if (!base64) {
            // face authentication failed
            this.showMessage('Login failed, Unable to capture image, make sure you provide access to camera');
            return false;
        }

        // send request to face auth server
        // get the login json from proxy
        const result: IResponse = await TUtils.HttpClient.sendRequest({
            url: this.faceAuthServerUrl,
            requestArgs: {
                snapdata: base64.split(',')[1],
                snaptype: 'base64',
                pptype: 'url',
                agentId: this.loginForm.get('lanId').value,
                originator: 'TMACUI',
                ppdata: `${this.loginForm.get('lanId').value}.png`,
                isrealface: 1
            },
            header: {
                'Content-Type': 'application/json'
            },
            responseType: 'json',
            method: 'POST'
        });

        // check for valid response from server
        if (!result) {
            this.showMessage('Login failed, Unable to reach face authentication server. Please contact the administrator.');
            return false;
        }

        // check the response
        if (result.response && result.response.d) {
            // parse the response 
            const response = JSON.parse(result.response.d);
            // check if the returned data has face authentication properties
            if (!response.hasOwnProperty('face_found_in_image') ||
                !response.hasOwnProperty('face_authenticated_percentage')) {
                // login error
                this.showMessage('Error in face authentication');
                return false;
            }

            // check if the response
            if (response.face_found_in_image === true && response.face_authenticated_percentage >= 80 && response.face_isreal === 1) {
                // face authentication sucess
                this.showMessage('Face authentication success, trying to login');
                return true;
            }
            else {
                // face authentication failed
                this.showMessage('Face authentication failed');
                return false;
            }
        }
        else {
            // login error
            this.showMessage('Face authentication: Invalid response from server');
            return false;
        }
    }

    // to get data from server
    private getData(): void {
        // get the TMAC server version
        SDKClient.getTMACVersion('', null)
            .then((dt) => {
                this.version = dt.response;
            });

        if (this.domainListEnabled) {
            SDKClient.getUserDomainList(null).then((result: IResponse) => {
                this.domainList = result.response || [];
            });
        }
    }

    public toggleStation(): void {
        this.stationEnabled = this.pbxChecked || this.msChecked;
    }

    public async login(force: boolean): Promise<void> {
        // set loading to true
        this.loading = true;

        // check if face auth is needed 
        if (!force && this.faceAuthEnabled && !await this.doFaceAuthentication()) {
            this.loading = false;
            return;
        }

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
        })
            .catch(() => {
                // set loading to true
                this.loading = false;
                // login error
                this.showMessage('Login failed, Please try again');
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
                        const confirmDialogRef = this._dialog.open(ConfirmDialogComponent, {
                            disableClose: false
                        });
                        confirmDialogRef.componentInstance.title = 'Confirm Login';
                        confirmDialogRef.componentInstance.message = 'Another session detected. Do you want to take it over?';
                        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
                            if (dialogResult) {
                                this.login(true);
                            }
                        });
                    } else {
                        // check the environment
                        if (environment.production && response.OtherData.ItemTwo) {
                            // assign the agent based config
                            this._appDataService.config = JSON.parse(response.OtherData.ItemTwo);
                            TUtils.Logger.console('info', 'App config updated!');
                        }

                        // login success
                        // we will route to main page
                        this._router.navigate(['main'], {
                            queryParamsHandling: 'preserve',
                            preserveFragment: true,
                            state: {
                                fromUrl: 'login'
                            }
                        });
                        // check if face auth enabled, then stop camera
                        if (this.faceAuthEnabled) {
                            this.selfVideo.getTracks().forEach((track: MediaStreamTrack) => { track.stop(); });
                        }

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
