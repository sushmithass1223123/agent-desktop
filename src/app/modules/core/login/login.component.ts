import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { CommandResultEvent, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { AppDataService } from 'app/services/app-data.service';
import { merge, set } from 'lodash';
import { interval, Observable, Subject } from 'rxjs';
import { map, take, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * LoginComponent
 */
@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class LoginComponent implements OnInit, OnDestroy {
    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * Used for auto login
     */
    private queryData: Record<string, any>;
    /**
     * Face login video element
     */
    @ViewChild('video', { static: false }) videoElement: ElementRef;
    /**
     * App configuration
     */
    appConfig: any;
    /**
     * Brand logo
     */
    brandLogo: {
        /**
         * Logo alt
         */
        Alt: string;
        /**
         * Small logo reference
         */
        Small: {
            /**
             * logo source
             */
            Src: string;
            /**
             * Logo width
             */
            Width: number;
            /**
             * Logo height
             */
            Height: number;
        };
        /**
         * Large logo reference
         */
        Large: {
            /**
             * logo source
             */
            Src: string;
            /**
             * Logo width
             */
            Width: number;
            /**
             * Logo height
             */
            Height: number;
        };
    } = null;
    /**
     * Login form
     */
    loginForm: FormGroup;
    /**
     * Login configuration
     */
    loginConfig = null;
    /**
     * App customer logo
     */
    appCustomerLogo: {
        /**
         * Logo alt
         */
        Alt: string;
        /**
         * Small logo reference
         */
        Small: {
            /**
             * logo source
             */
            Src: string;
            /**
             * Logo width
             */
            Width: number;
            /**
             * Logo height
             */
            Height: number;
        };
        /**
         * Large logo reference
         */
        Large: {
            /**
             * logo source
             */
            Src: string;
            /**
             * Logo width
             */
            Width: number;
            /**
             * Logo height
             */
            Height: number;
        };
    } = null;
    /**
     * App logo source
     */
    logoSrc = '';
    /**
     * App logo Alt
     */
    logoAlt = '';
    /**
     * App logo width
     */
    logoWidth = 0;
    /**
     * App logo height
     */
    logoHeight = 0;

    /**
     * Face authentication enabled flag from config
     */
    faceAuthEnabled = false;
    /**
     * Face authentication server URL
     */
    faceAuthServerUrl = '';
    /**
     * Domain list enabled flag from config
     */
    domainListEnabled = false;
    /**
     * To prompt agent Id on invalid lan Id or not
     */
    promptAgentIdOnInvalidLanId = false;
    /**
     * To disable lanId
     */
    disableLanId = false;
    /**
     * Agent Id enabled flag
     */
    agentIdEnabled = false;
    /**
     * Password enabled flag
     */
    password = {
        Agent: false,
        Station: false
    };
    /**
     * To show/hide password field
     */
    hidePassword = {
        agent: true,
        station: true
    };
    /**
     * Station enabled flag
     */
    stationEnabled = false;
    /**
     * Login mode
     */
    loginModeEnabled = false;
    /**
     * PBX checked flag
     */
    pbxChecked = false;
    /**
     * MS checked flag
     */
    msChecked = false;
    /**
     * To store domain list
     */
    domainList = [];
    /**
     * Loading flag
     */
    loading = false;
    /**
     * Version property
     */
    version = 'NA';
    /**
     * UI version
     */
    uiVersion = 'NA';
    /**
     * Self video stream
     */
    selfVideo: MediaStream;
    /**
     * Multiple window mode
     */
    multiWindowMode: {
        /**
         * Enabled flag
         */
        Enabled: boolean;
        /**
         * Width of new window
         */
        Width: number;
        /**
         * Height of new window
         */
        Height: number;
        /**
         * New window dimension type
         */
        PixelDimension: boolean;
    };
    /**
     * Login error message
     */
    errorMessage: string;
    /**
     * To show connection error overlay
     */
    connectionError: {
        /**
         * Polling interval
         */
        pollingInterval: number;
        /**
         * Reteying flag
         */
        retrying: boolean;
        /**
         * Errored flag
         */
        errored: boolean;
        /**
         * Countdown oveservable
         */
        countdown?: Observable<number>;
    } = {
        pollingInterval: 20,
        retrying: false,
        errored: false
    };
    /**
     * Flag for showing otp input
     */
    showOtp = false;

    /**
     * Disable opening console / refreshing
     * @param {KeyboardEvent} event
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): any {
        if (!this.appConfig) {
            return;
        }
        //  Disables refresh (F5, ctrl + r, ctrl + F5)
        if (this.appConfig.AppConfigs.RefreshDisabled) {
            if (
                event.key.toUpperCase() === 'F5' ||
                (event.key.toUpperCase() === 'R' && event.ctrlKey) ||
                (event.key.toUpperCase() === 'F5' && event.ctrlKey)
            ) {
                event.preventDefault();
                return false;
            }
        }
        //  Disabled dev tools (F12, ctrl + shift + c, ctrl + shift + i)
        if (this.appConfig.AppConfigs.DevToolsDisabled) {
            if (
                event.key.toUpperCase() === 'F12' ||
                (event.key.toUpperCase() === 'C' && event.ctrlKey && event.shiftKey) ||
                (event.key.toUpperCase() === 'I' && event.ctrlKey && event.shiftKey)
            ) {
                event.preventDefault();
                return false;
            }
        }
    }

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private _formBuilder: FormBuilder,
        private _appDataService: AppDataService,
        private _router: Router,
        private _appUIService: AppUiService,
        private _titleService: Title,
        private _activatedRoute: ActivatedRoute,
        private route: ActivatedRoute,
        private fuseSplashService: FuseSplashScreenService
    ) {
        // Configure the layout
        this._fuseFacadeService.setConfig = {
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

        // set loading flag
        this.loading = true;

        this.uiVersion = _appDataService.getAppVersion();

        // subscribe to _activatedRoute for loging agent id
        this._activatedRoute.paramMap.subscribe((paramMap) => {
            // check if agentId in param
            if (paramMap.has('agentId')) {
                this.loadConfig(paramMap.get('agentId'));
            } else {
                this.loadConfig();
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        const title = this._titleService.getTitle();
        this._titleService.setTitle(title.split('-')[0].trim());

        this.loginForm = this._formBuilder.group({
            domain: ['', Validators.required],
            lanId: ['', Validators.required],
            agentId: ['', Validators.required],
            agentPassword: ['', Validators.required],
            stationPassword: ['', Validators.required],
            station: ['', Validators.required],
            otp: ['', Validators.required]
        });
    }

    /**
     * To checl query params provided
     */
    checkQueryParams(): void {
        /**
         * subscribes to Activated route
         */
        this.route.queryParams
            .pipe(
                takeUntil(this._unsubscribeAll),
                // continue only if userId present
                // filter((params) => params.u),
                map((params) =>
                    // Get the query params with jd_ stripped for json data
                    Object.entries(params).reduce((acc, curr) => {
                        if (curr[0].includes('jd_')) {
                            if (!acc.jsonData) {
                                acc.jsonData = {};
                            }
                            const key = curr[0].replace('jd_', '');
                            const customJsonData = set(acc.jsonData, key, curr[1]);
                            acc.jsonData = { ...(acc.jsonData || {}), ...customJsonData };
                        } else {
                            acc[curr[0]] = curr[1];
                        }
                        return acc;
                    }, {} as Record<string, any>)
                )
            )
            .subscribe((params) => {
                // if there is not user in param then return
                if (!params.u) {
                    return;
                }
                // patch lanId to form
                this.loginForm.patchValue({ lanId: params.u });
                // add the params to query data
                this.queryData = params;
                // check if al (auto login) false or 0, then do not auto login
                if (params.al !== undefined && (params.al === 'false' || params.al === '0')) {
                    return;
                }
                this.fuseSplashService.show();
                this.login(true);
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To load the config
     *
     * @param agentId
     */
    async loadConfig(agentId?: string): Promise<void> {
        // load the config
        const config = await this._appDataService.getJsonConfig(agentId);
        this.appConfig = config;
        this.configLoaded(config);
        this.getData();
        this.checkQueryParams();
        this._appDataService.setTheme();
    }

    /**
     * To process app config loaded
     *
     * @param config
     */
    private configLoaded(config: any): void {
        // check if the config is not null
        if (config !== null) {
            this.loginConfig = config.Login;
            this.appCustomerLogo = config.AppConfigs.Logos.Customer || null;

            this.faceAuthEnabled = config.Login.FaceAuth?.Enabled;
            this.faceAuthServerUrl = config.Login.FaceAuth?.AuthServerUrl;
            this.domainListEnabled = config.Login.DomainListEnabled;
            this.stationEnabled = config.Login.StationEnabled;
            this.loginModeEnabled = config.Login.Modes.Enabled;
            this.promptAgentIdOnInvalidLanId = config.Login.PromptAgentIdOnInvalidLanId;
            this.disableLanId = config.Login.DisableLanId ?? false;
            this.brandLogo = config.AppConfigs.Logos.Default || null;
            this.multiWindowMode = config.Login.MultiWindowMode || {
                Enabled: false,
                Width: 0,
                Height: 0,
                PixelDimension: false
            };
            this.password = config.Login.Password ?? {
                Agent: config.Login.PasswordEnabled ?? false, // adding for backward compatibility
                Station: config.Login.PasswordEnabled ?? false // adding for backward compatibility
            };

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

            // open self view if face auth is enabled
            if (this.faceAuthEnabled) {
                this.startCamera();
            }

            // check to disable lanId
            if (this.disableLanId) {
                this.loginForm.get('lanId').disable({ onlySelf: this.disableLanId });
            }

            // set loading flag
            // this.loading = false;
        } else {
            // we will route to error page
            this._router.navigate(['not-found'], {
                state: {
                    subtitle: 'Oops',
                    title: '404',
                    description: 'Unable to load the config, please contact the administrator.',
                    login: false
                },
                queryParamsHandling: 'preserve'
            });
        }
    }

    /**
     * Start camera for face auth
     */
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
                this._appUIService.showSnackbar(error.message, 'failure');
            }
        );
    }

    /**
     * To do face authentication
     */
    private async doFaceAuthentication(): Promise<boolean> {
        // pause the video
        this.videoElement?.nativeElement.pause();
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
        let ret: boolean;

        if (!base64) {
            // face authentication failed
            this._appUIService.showSnackbar('Login failed, Unable to capture image, make sure you provide access to camera', 'failure');
            return false;
        }

        this._appUIService.showSnackbar('Please wait, Face authentication in progress', 'loading', 'top', 'right');

        // send request to face auth server
        // get the login json from proxy
        const result: IResponse = await TUtils.HttpClient.sendRequest({
            urls: [this.faceAuthServerUrl],
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
            method: 'POST',
            log: true
        });

        // check for valid response from server
        if (!result) {
            this._appUIService.showSnackbar('Login failed, Unable to reach face authentication server. Please contact the administrator', 'failure');
            ret = false;
        }

        // check the response
        if (result.response && result.response.d) {
            // parse the response
            const response = JSON.parse(result.response.d);
            // check if the returned data has face authentication properties
            if (!response.hasOwnProperty('face_found_in_image') || !response.hasOwnProperty('face_authenticated_percentage')) {
                // login error
                this._appUIService.showSnackbar('Error in face authentication', 'failure', 'top', 'right');
                ret = false;
            }

            // check if the response
            if (response.face_found_in_image === true && response.face_authenticated_percentage >= 80 && response.face_isreal === 1) {
                // face authentication sucess
                this._appUIService.showSnackbar('Face authentication success, trying to login', 'success', 'top', 'right');
                ret = true;
            } else {
                // face authentication failed
                this._appUIService.showSnackbar('Face authentication failed', 'failure', 'top', 'right');
                ret = false;
            }
        } else {
            // login error
            this._appUIService.showSnackbar('Face authentication: Invalid response from server', 'failure', 'top', 'right');
            ret = false;
        }

        if (!ret) {
            // play the video the video back
            this.videoElement?.nativeElement.play();
        }

        return ret;
    }

    /**
     * To calculate dimension for main window
     *
     * @param {string} type
     */
    private calculateDimension(type: string): number {
        try {
            // check the dimension type
            if (this.multiWindowMode.PixelDimension) {
                return type === 'width' ? this.multiWindowMode.Width : this.multiWindowMode.Height;
            } else {
                return (type === 'width' ? screen.width * this.multiWindowMode.Width : screen.height * this.multiWindowMode.Height) / 100;
            }
        } catch (error) {
            return (type === 'width' ? screen.width : screen.height) / 100;
        }
    }

    /**
     * To get data from server
     */
    public getData(): void {
        // get the TMAC server version
        this.connectionError.retrying = true;
        SDKClient.getTMACVersion('')
            .then((dt) => {
                if (dt.response !== 'NA') {
                    this.version = dt.response;
                    if (this.domainListEnabled) {
                        SDKClient.getUserDomainList(null).then((result: IResponse) => {
                            this.domainList = result.response || [];
                        });
                    }
                    this.connectionError.errored = false;
                    this.connectionError.countdown = null;
                } else {
                    throw new Error(`Invalid Response : ${JSON.stringify(dt)}`);
                }
            })
            .catch((e) => {
                console.error(e);
                this.connectionError.errored = true;
                this.connectionError.countdown = interval(1000).pipe(
                    take(this.connectionError.pollingInterval + 1),
                    tap((x) => {
                        if (x === this.connectionError.pollingInterval) {
                            this.getData();
                        }
                    })
                );
            })
            .finally(() => {
                this.connectionError.retrying = false;
                this.loading = false;
            });
    }

    /**
     * To show/hide station input
     */
    public toggleStation(): void {
        this.stationEnabled = this.pbxChecked || this.msChecked;
    }

    /**
     * To process login
     *
     * @param {boolean} force
     */
    public async login(force: boolean): Promise<void> {
        // set loading to true
        this.loading = true;
        // clear error message if any
        this.errorMessage = '';

        // check if face auth is needed
        if (!force && this.faceAuthEnabled && !(await this.doFaceAuthentication())) {
            this.loading = false;
            return;
        }

        const selectedDomain = this.loginForm.get('domain').value;
        const lanId = this.loginForm.get('lanId').value;
        const agentId = this.loginForm.get('agentId').value;
        const agentPassword = this.loginForm.get('agentPassword').value;
        const stationPassword = this.loginForm.get('stationPassword').value;
        const station = this.loginForm.get('station').value;

        let customAuthData = null;
        const otp = this.loginForm.get('otp')?.value || '';

        if (otp) {
            customAuthData = { otp };
        }

        const jsonData = merge(
            {
                msLogin: this.msChecked,
                pbxLogin: this.pbxChecked,
                customAuthData
            },
            this.queryData?.jsonData || {}
        );

        if (!customAuthData?.otp) {
            customAuthData = null;
        }
        // call sdk and login
        SDKClient.login(
            {
                lanId: this.domainListEnabled ? `${selectedDomain}\\${lanId}` : lanId,
                agentId: agentId,
                deviceId: this.stationEnabled ? station : lanId.split(',')[0].toLowerCase(),
                forceReload: force,
                jsonData: JSON.stringify(jsonData),
                password: `${agentPassword}${stationPassword ? '<>' + stationPassword : ''}`,
                sessionKey: ''
            },
            null
        )
            .then((result: IResponse) => {
                // set loading to true
                this.loading = false;
                // process the login response
                this.loginResponse(result);
            })
            .catch((e) => {
                console.error(e);
                this.videoElement?.nativeElement.play();
                // set loading to true
                this.loading = false;
                // login error
                this._appUIService.showSnackbar('Login failed, Please try again', 'failure', 'top', 'right');
            });
    }

    /**
     * Login done response
     */
    private loginResponse(result: IResponse): void {
        try {
            // get the response
            const response: CommandResultEvent = result.response;
            // check the response
            if (response) {
                if (response.ResultCode > 0) {
                    if (response.ResultCode === 4) {
                        const customAuthType = JSON.parse(response.Data)?.customAuthType;
                        if (customAuthType === 'otp') {
                            this.showOtp = true;
                            this.fuseSplashService.hide();
                            return;
                        }
                    } else if (response.ResultCode === 3) {
                        // confirm force login
                        const confirmDialogRef = this._appUIService.showAppConfirmDialog('takeoverSession');
                        confirmDialogRef.afterClosed().subscribe((dialogResult) => {
                            if (dialogResult) {
                                this.login(true);
                            }
                        });
                    } else {
                        // check the environment
                        if (environment.production && this.appConfig?.ConfigMode === 'remote' && response.OtherData.ItemTwo) {
                            // assign the agent based config
                            this._appDataService.config = JSON.parse(response.OtherData.ItemTwo);
                            TUtils.Logger.console('debug', 'App config updated!');
                        } else {
                            TUtils.Logger.console('debug', 'Using developement/login config only!');
                        }
                        // get the agent ID
                        const agentId = response.Data.AgentID;

                        // login success
                        if (this.multiWindowMode?.Enabled) {
                            const domain = window.location.hostname;
                            const windowLocation = window.location.href.split('/');
                            const domainIndex = windowLocation.indexOf(domain);
                            const instanceName = domainIndex ? windowLocation[domainIndex + 1] : '';
                            const windowQueries = this.queryData?.state ? `?state=${this.queryData.state}` : '';
                            // open new window
                            const wdw = window.open(
                                `${instanceName}/main/${agentId}${windowQueries}`,
                                response.Data.AgentSessionKey,
                                `menubar=no,resizable=yes,location=no,scrollbars=no,width=${this.calculateDimension(
                                    'width'
                                )},height=${this.calculateDimension('height')}`
                            );
                            // move the window
                            wdw.moveTo(0, 0);
                            // reload login page
                            // location.reload();
                        } else {
                            const queryParams = this.queryData?.state
                                ? {
                                      state: this.queryData.state
                                  }
                                : {};
                            // we will route to main page
                            this._router.navigate([`main/${agentId}`], {
                                queryParams,
                                state: {
                                    routeFrom: 'login',
                                    agentId
                                },
                                queryParamsHandling: 'preserve'
                            });
                        }

                        // check if face auth enabled, then stop camera
                        if (this.faceAuthEnabled) {
                            this.selfVideo.getTracks().forEach((track: MediaStreamTrack) => {
                                track.stop();
                            });
                        }
                    }
                } else if (response.ResultCode === -3) {
                    // invalid Lan id check whether to prompt agent Id
                    if (this.promptAgentIdOnInvalidLanId) {
                        this.errorMessage = 'Login failed, Invalid LAN ID detected. Please provide agent ID';
                        this.agentIdEnabled = true;
                    } else {
                        // login failed, invalid lan Id
                        this.errorMessage = 'Login failed, Invalid LAN ID detected. Please contact administrator for TMAC access';
                    }
                } else {
                    // login failed
                    this.errorMessage = response.ErrorDetails
                        ? response.ErrorDetails
                        : response.ResultMessage
                        ? response.ResultMessage
                        : 'Login failed, Unknown response from server';
                }
            } else {
                this.errorMessage = 'Login failed, Please contact the administrator';
            }
            // check if any error message then alert
            if (this.errorMessage) {
                this.videoElement?.nativeElement.play();
                // login error
                this._appUIService.showSnackbar(this.errorMessage, 'failure', 'top', 'right');
            }
            this.fuseSplashService.hide();
        } catch (error) {
            this.videoElement?.nativeElement.play();
            TUtils.Logger.error('Exception in login', error);
        }
    }

    /**
     * To check for number only
     * @param event input event
     */
    public numberOnly(event: any): boolean {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    /**
     * To reset form field value
     * @param field Form field
     */
    resetField(field: string): void {
        this.loginForm.patchValue({ [field]: '' });
    }
}
