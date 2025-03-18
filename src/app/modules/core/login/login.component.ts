import { AppRootConfig, LogoConfig, MultiWindowMode, Password } from '@ad/types';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { MsTeamsAuthService } from '@services/ms-teams-auth.service';
import { TMACEventService } from '@services/tmac-event.service';
import { CommandResultEvent, IResponse, SDKClient, TUtils } from '@tmac/sdk';
import { AppDataService } from 'app/services/app-data.service';
import AES from 'crypto-js/aes';
import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';
import { environment } from 'environments/environment';
import { merge, set } from 'lodash';
import moment from 'moment';
import { interval, Observable, Subject } from 'rxjs';
import { map, take, takeUntil, tap } from 'rxjs/operators';
import { AvailableLangs, TranslocoService } from '@jsverse/transloco';
import { AGENT_FEATURES } from 'app/constants';

declare const navigator: Navigator | any;
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
export class LoginComponent extends SharedWrapper implements OnInit, OnDestroy {
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
    appConfig: AppRootConfig;
    /**
     * Flag to identify the config is loaded or not
     */
    isConfigLoaded: boolean;
    /**
     * Login form
     */
    loginForm: FormGroup;
    /**
     * Brand logo
     */
    brandLogo: LogoConfig = null;
    /**
     * App customer logo
     */
    appCustomerLogo: LogoConfig = null;

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
    password: Password = {
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
    multiWindowMode: MultiWindowMode;
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
    };
    /**
     * Flag for showing otp input
     */
    showOtp = false;
    /**
     * Single sign on type
     */
    ssoType = '';
    /**
     * Login config error ref
     */
    configError: {
        /**
         * Errored flag
         */
        errored: boolean;
        /**
         * Reteying flag
         */
        retrying: boolean;
        /**
         * Agent id from route param to get config if any
         */
        agentId?: string;
        /**
         * Reason can be 'main' | 'login'
         */
        section?:string;
    };
    /**
     * Lan Id input children ref
     */
    @ViewChild('lanId') lanIdField: ElementRef<HTMLInputElement>;
    /**
     * Station input children ref
     */
    @ViewChild('stationId') stationField: ElementRef<HTMLInputElement>;
    /**
     * Agent Id input children ref
     */
    @ViewChild('agentId') agentIdField: ElementRef<HTMLInputElement>;
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

    appLabelsError: any;

    languageSelectionEnabled = false;

    languages: AvailableLangs;

    constructor(
        private _fuseFacadeService: FuseFacadeService,
        private _formBuilder: FormBuilder,
        private _appDataService: AppDataService,
        private _appUIService: AppUiService,
        private _titleService: Title,
        private _activatedRoute: ActivatedRoute,
        private fuseSplashService: FuseSplashScreenService,
        private _tmacEventService: TMACEventService,
        private _msTeamsAuthSerivce: MsTeamsAuthService,
        private translocoService: TranslocoService
    ) {
        super('LoginComponent');

        this._appDataService.observeAppLabelErrors().subscribe(data => {
            this.appLabelsError = data;
            this._appDataService.setErrorInAppLabels(data);
        });

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

        this.languages = this.translocoService.getAvailableLangs();

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // set loading flag
        this.loading = true;

        this.uiVersion = _appDataService.getAppVersion();

        this.connectionError = {
            pollingInterval: 20,
            retrying: false,
            errored: false
        };

        this.configError = {
            errored: false,
            retrying: false
        };

        // subscribe to _activatedRoute for loging agent id
        this._activatedRoute.paramMap.subscribe(async (paramMap) => {
            // check if ssoType in param
            if (paramMap.has('ssoType')) {
                this.ssoType = paramMap.get('ssoType').toLowerCase();
            }

            const agentId = paramMap.has('agentId') ? paramMap.get('agentId') : undefined;
            if(!this.appLabelsError) {
                this.loadConfig(agentId);
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
            domain: [''],
            lanId: ['', Validators.required],
            agentId: [''],
            agentPassword: [''],
            stationPassword: [''],
            station: [''],
            otp: ['']
        });
    }

    /**
     * To checl query params provided
     */
    checkQueryParams(): void {
        /**
         * subscribes to Activated route
         */
        this._activatedRoute.queryParams
            .pipe(
                takeUntil(this._unsubscribeAll),
                // continue only if userId present
                // filter((params) => params.u),
                map((params) =>
                    // Get the query params with jd_ stripped for json data
                    Object.entries(params).reduce((acc, curr) => {
                        if (curr[0].includes('jd_')) {
                            if (!acc['jsonData']) {
                                acc['jsonData'] = {};
                            }
                            const key = curr[0].replace('jd_', '');
                            const customJsonData = set(acc['jsonData'], key, curr[1]);
                            acc['jsonData'] = { ...(acc['jsonData'] || {}), ...customJsonData };
                        } else {
                            acc[curr[0]] = curr[1];
                        }
                        return acc;
                    }, {} as Record<string, any>)
                )
            )
            .subscribe(async (params) => {
                try {
                    let patchVal = {};
                    let username = params['u'] || params['dblb'];

                    // if there is not user in param then return
                    if (!username) {
                        return;
                    }

                    const k = Utf8.parse('1029384756564738');
                    const cg = {
                        iv: Base64.parse('AQIDBAUGBgUEAwIBBwcHBw==')
                    };

                    // check for username/lanid
                    const usernameDecrypted = AES.decrypt(decodeURIComponent(username), k, cg).toString(Utf8);
                    if (usernameDecrypted) {
                        // encrypted may have username or username+timestamp (sso login timestamp)
                        const [u, timestamp] = usernameDecrypted.split('+');
                        username = u;

                        let currentUTCString = null;
                        let timestampWithExpiryString = null;
                        let isExpired = false;
                        // max time to expire the link
                        const expiry = this.appConfig?.Login?.SSOLinkExpiry;

                        // if there is a login timestamp then check against the expiry time
                        // if expiry time is not configured then ignore link expiry check
                        if (timestamp && expiry) {
                            try {
                                // get the current datetime in UTC and add seconds
                                currentUTCString = moment().utc().format('YYYYMMDDHHmmss');
                                const currentUTCDate = moment(currentUTCString, 'YYYYMMDDHHmmss');

                                // convert the login timestamp to date
                                timestampWithExpiryString = moment(timestamp, 'YYYYMMDDHHmmss').add(expiry, 'seconds').format('YYYYMMDDHHmmss');
                                const timestampWithExpiryDate = moment(timestampWithExpiryString, 'YYYYMMDDHHmmss');

                                // check if the link is expired
                                isExpired = moment(currentUTCDate).isAfter(timestampWithExpiryDate);
                            } catch (error) {
                                this.logger.error('activatedRoute.queryParams.linkExpiryCheck', error, false);
                            }
                        }

                        // check if the link is expired
                        if (isExpired) {
                            this.logger.warn(`Link has expired, ct=${currentUTCString}, lt=${timestamp}, expiry=${expiry}`);

                            // we will route to error page
                            this._appDataService.routeToPath(['not-found'], {
                                state: {
                                    subtitle: 'Oops',
                                    title: '404',
                                    description: this.translocoService.translate('loginComponent.linkExpired'),
                                    login: false
                                },
                                queryParamsHandling: 'preserve'
                            });
                            return;
                        }
                    }

                    patchVal = { ...patchVal, lanId: username };

                    // check for station
                    if (params['s']) {
                        patchVal = { ...patchVal, station: params['s'] };
                    }

                    // check for password
                    if (params['p'] || params['ap'] || params['sp']) {
                        let decrypted = '';
                        if (params['p']) {
                            this.password.Agent = true;
                            this.password.Station = true;
                            // decrypt the password or use original
                            decrypted = AES.decrypt(decodeURIComponent(params['p']), k, cg).toString(Utf8) || params['p'];
                            patchVal = { ...patchVal, agentPassword: decrypted, stationPassword: decrypted };
                        } else {
                            if (params['ap']) {
                                this.password.Agent = true;
                                // decrypt the agent password or use original
                                decrypted = AES.decrypt(decodeURIComponent(params['ap']), k, cg).toString(Utf8) || params['ap'];
                                patchVal = { ...patchVal, agentPassword: decrypted };
                            }

                            if (params['sp']) {
                                this.password.Station = true;
                                // decrypt the station password or use original
                                decrypted = AES.decrypt(decodeURIComponent(params['sp']), k, cg).toString(Utf8) || params['sp'];
                                patchVal = { ...patchVal, stationPassword: decrypted };
                            }
                        }
                    }

                    // check for pbx login
                    if (params['pbx'] && (params['pbx'] === '1' || params['pbx'] === 'true')) {
                        this.pbxChecked = true;
                        if (typeof params['jsonData'] === 'object') {
                            params['jsonData'].pbxLogin = true;
                        } else {
                            params['jsonData'] = {
                                pbxLogin: true
                            };
                        }
                    } else {
                        this.pbxChecked = params?.['jsonData']?.pbxLogin === 'true';
                    }

                    // check for ms login
                    if (params['ms'] && (params['ms'] === '1' || params['ms'] === 'true')) {
                        this.msChecked = true;
                        if (typeof params['jsonData'] === 'object') {
                            params['jsonData'].msLogin = true;
                        } else {
                            params['jsonData'] = {
                                msLogin: true
                            };
                        }
                    } else {
                        this.msChecked = params?.['jsonData']?.msLogin === 'true';
                    }

                    // check if ms/pbx enabled, then enable station field
                    this.stationEnabled = this.msChecked || this.pbxChecked;
                    // patch lanId to form
                    this.loginForm.patchValue(patchVal);
                    // add the params to query data
                    this.queryData = params;
                    // check if al (auto login) false or 0, then do not auto login
                    if (params['al'] !== undefined && (params['al'] === 'false' || params['al'] === '0')) {
                        return;
                    }
                    this.fuseSplashService.show();
                    this.login(true);
                } catch (error) {
                    this.logger.error('activatedRoute.queryParams', error, false);
                }
            });

        this.lanIdField?.nativeElement?.focus();
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

        // if the json is not proper then route to not-found page
        if (!config) {
            // we will route to error page
            // this._appDataService.routeToPath(['not-found'], {
            //     state: {
            //         subtitle: 'Oops',
            //         title: '404',
            //         description: 'Unable to load the config for login, please contact the administrator.',
            //         login: false
            //     },
            //     queryParamsHandling: 'preserve'
            // });

            this.loading = false;

            this.configError = {
                errored: true,
                retrying: false,
                agentId
            };

            return;
        }

        // reset the config error
        if (this.configError.errored) {
            this.configError = {
                errored: false,
                retrying: false,
                agentId: ''
            };
        }

        this.appConfig = config;
        this.languageSelectionEnabled = this.appConfig?.Login?.enableLanguageSelection;
        this.configLoaded(config);
        if(!this.appLabelsError) {
            await this.getTMACVersion();
            this._appUIService.checkForDisplayResolution();   
        }
    }

    retryLoadConfig(): void {
        this.configError.retrying = true;
        this.loadConfig(this.configError.agentId);
    }

    changeLanguage(lang) {
        this.translocoService.setActiveLang(lang);
    }

    /**
     * To process app config loaded
     *
     * @param config
     */
    private configLoaded(config: AppRootConfig): void {
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

        // Set validators for form
        if (this.domainListEnabled) {
            this.loginForm.controls['domain'].setValidators(Validators.required);
        }

        if (this.stationEnabled) {
            this.loginForm.controls['station'].setValidators(Validators.required);
        }

        if (this.password.Agent) {
            this.loginForm.controls['agentPassword'].setValidators(Validators.required);
        }

        if (this.password.Station) {
            this.loginForm.controls['stationPassword'].setValidators(Validators.required);
        }

        this.isConfigLoaded = true;
    }

    /**
     * Start camera for face auth
     */
    private async startCamera(): Promise<void> {
        try {
            // capture selfview
            this.selfVideo = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true
            });
        } catch (error) {
            this._appUIService.showSnackbar(error.message, 'failure');
        }
    }

    /**
     * To do face authentication
     */
    private async doFaceAuthentication(): Promise<boolean> {
        try {
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
                this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.captureImageFailed'), 'failure');
                return false;
            }

            this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.faceAuthenticationLoading'), 'loading', 'top', 'right');

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
                this._appUIService.showSnackbar(
                    this.translocoService.translate('loginComponent.faceAuthServerNotReachable'),
                    'failure'
                );
                ret = false;
            }

            // check the response
            if (result.response && result.response.d) {
                // parse the response
                const response = JSON.parse(result.response.d);
                // check if the returned data has face authentication properties
                if (!response.hasOwnProperty('face_found_in_image') || !response.hasOwnProperty('face_authenticated_percentage')) {
                    // login error
                    this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.faceAuthError'), 'failure', 'top', 'right');
                    ret = false;
                }

                // check if the response
                if (response.face_found_in_image === true && response.face_authenticated_percentage >= 80 && response.face_isreal === 1) {
                    // face authentication sucess
                    this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.faceAuthSuccess'), 'success', 'top', 'right');
                    ret = true;
                } else {
                    // face authentication failed
                    this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.faceAuthFailed'), 'failure', 'top', 'right');
                    ret = false;
                }
            } else {
                // login error
                this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.faceAuthInvalid'), 'failure', 'top', 'right');
                ret = false;
            }

            if (!ret) {
                // play the video the video back
                this.videoElement?.nativeElement.play();
            }

            return ret;
        } catch (error) {
            this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.faceAuthError'), 'failure', 'top', 'right');
        }
        return false;
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
    public async getTMACVersion(): Promise<void> {
        try {
            // get the TMAC server version
            this.connectionError.retrying = true;
            const { response } = await SDKClient.getTMACVersion('');

            if (response !== 'NA' && response?.split('|')[0]?.trim()) {
                this.version = response;
                if (this.domainListEnabled) {
                    SDKClient.getUserDomainList(null).then((result: IResponse) => {
                        this.domainList = result.response || [];
                    });
                }
                this.connectionError.errored = false;
                this.connectionError.countdown = null;

                // if there is no SSO login, then check query params
                if (!(await this.ssoLogin())) {
                    // check query params only if the server is connected
                    this.checkQueryParams();
                }
            } else {
                throw new Error(`Invalid Response : ${response}`);
            }
        } catch (error) {
            this.logger.error('getTMACVersion', error, false);
            this.connectionError.errored = true;
            this.connectionError.countdown = interval(1000).pipe(
                take(this.connectionError.pollingInterval + 1),
                tap((x) => {
                    if (x === this.connectionError.pollingInterval) {
                        this.getTMACVersion();
                    }
                })
            );
        } finally {
            this.connectionError.retrying = false;
            this.loading = false;
        }
    }

    /**
     * To show/hide station input
     */
    public toggleStation(): void {
        this.stationEnabled = this.pbxChecked || this.msChecked;

        // set form validation
        if (this.stationEnabled) {
            this.loginForm.controls['station'].setValidators(Validators.required);
            setTimeout(() => {
                this.stationField.nativeElement.focus();
            });
        } else {
            this.loginForm.controls['station'].clearValidators();
        }
        this.loginForm.controls['station'].updateValueAndValidity();
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

        // check if permission access given in case of MS
        if(this.msChecked && !(this.appConfig?.AppConfigs?.DisableCheckForDevicePermission)) {
            await this.checkForDevicePermission();
        } 

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
                stationPassword,
                customAuthData
            },
            this.queryData?.['jsonData'] || {}
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
                password: agentPassword,
                sessionKey: ''
            },
            null
        )
            .then((result: IResponse) => {
                // process the login response
                this.loginResponse(result);
                // set loading to false
                this.loading = false;
            })
            .catch((e) => {
                this.logger.error('login', e, false);
                this.videoElement?.nativeElement.play();
                // set loading to false
                this.loading = false;
                // login error
                this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.loginFailed'), 'failure', 'top', 'right');
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
                            this.loginForm.controls['otp'].setValidators(Validators.required);
                            this.loginForm.controls['otp'].updateValueAndValidity();
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
                            this.logger.debug('App config updated!', false);
                        } else {
                            if(this.appConfig?.ConfigMode === 'remote' && (!(response.OtherData.ItemTwo) ||  response.OtherData.ItemTwo == '')) {
                                this.configError = {
                                    errored: true,
                                    retrying: false,
                                    section: 'main'
                                };
                                this.logger.debug('Error occured in getting main content configuration!', false);
                                return;
                            }
                            this.logger.debug('Using developement/login config only!', false);
                        }

                        if (response.OtherData?.ItemFour) {
                            this._appDataService.setExternalAVWidgetOTP = response.OtherData.ItemFour as string;
                            this.externalAVWidgetConfirmation(
                                response.OtherData.ItemFour,
                                response.Data.AgentID,
                                JSON.parse(response.OtherData.ItemTwo),
                                response.Data.StationID,
                            );
                        }
                        // get the agent ID
                        const agentId = response.Data.AgentID;

                        // login success
                        if (this.multiWindowMode?.Enabled) {
                            const domain = window.location.hostname;
                            const windowLocation = window.location.href.split('/');
                            const domainIndex = windowLocation.indexOf(domain);
                            const instanceName = domainIndex ? windowLocation[domainIndex + 1] : '';
                            const windowQueries = this.queryData?.['state'] ? `?state=${this.queryData['state']}` : '';
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
                            const queryParams = this.queryData?.['state']
                                ? {
                                      state: this.queryData['state']
                                  }
                                : {};
                            // we will route to main page
                            this._appDataService.routeToPath([`main/${agentId}`], {
                                queryParams,
                                // state: {
                                //     routeFrom: 'login',
                                //     agentId
                                // },
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
                        this.errorMessage = this.translocoService.translate('loginComponent.lanIdInvalid');
                        this.agentIdEnabled = true;
                        this.loginForm.controls['agentId'].setValidators(Validators.required);
                        this.loginForm.controls['agentId'].updateValueAndValidity();
                        setTimeout(() => {
                            this.agentIdField.nativeElement.focus();
                        });
                    } else {
                        // login failed, invalid lan Id
                        this.errorMessage = this.translocoService.translate('loginComponent.lanIdError');
                    }
                } else {
                    // login failed
                    this.errorMessage = response.ErrorDetails
                        ? response.ErrorDetails
                        : response.ResultMessage
                        ? response.ResultMessage
                        : this.translocoService.translate('loginComponent.unknownError');
                }
            } else {
                this.errorMessage = this.translocoService.translate('loginComponent.loginFailedGenericError');
            }
            // check if any error message then alert
            if (this.errorMessage) {
                this.videoElement?.nativeElement.play();
                // login error
                this._appUIService.showSnackbar(this.errorMessage, 'failure', 'top', 'right');
            }
            this.fuseSplashService.hide();

            // emit login event
            this._tmacEventService.emitSDKEvent({
                event: {
                    EventName: 'AgentLoginEvent',
                    InteractionID: 0,
                    Data: response
                },
                isInteractionEvent: false,
                log: true
            });
        } catch (error) {
            this.videoElement?.nativeElement.play();
            this.logger.error('Error in login', error);
        }
    }

    /**
     * External AV widget credentials notifier
     */
    externalAVWidgetConfirmation(otp: string, agentId: string, configData: any, stationId?: string): void {
        try {
            // Flat to decide whether to show the notificatino or not
            let skipShowingNotification: boolean = false;
            // Get the chat controls widget data
            const chatControlWidgetData = this._appDataService.findWidgetDataByType(configData, 'tw-chat-controls');
            // Check if its disabled at application level
            skipShowingNotification = !chatControlWidgetData?.ExternalAVWidget?.Enabled;
            // Check if its disabled at OCM agent feature level
            SDKClient.getAgentData().featuresList.forEach((f) => {
                const feature = f.Feature.toLowerCase();
                if(AGENT_FEATURES.IsExternalAVWidgetEnabled === feature) skipShowingNotification = !f.IsEnabled; 
            });
            // If its disabled, dont show the notifier
            if(skipShowingNotification || !chatControlWidgetData?.ExternalAVWidget?.Url) return;

            const url = chatControlWidgetData.ExternalAVWidget.Url.replace('$agentId', agentId).replace(
                '$stationId',
                stationId
            );
            const html = `
            <h1>OTP: ${otp}</h1>
            <a href="${url}" target="_blank">${url}</a>
            <h5>Copy or click the above link to use custom AV widget</h5>
            <p>You will have to provide the OTP while logging in to custom AV widget. Please note it down and this credentials will be in the notification section of Agent Desktop so that you can refer it later.<p>
            `;
            const confirmDialogRef = this._appUIService.showCustomDialog(
                'alert',
                {
                    type: 'html',
                    message: html
                },
                'External AV Widget Credentials',
                {
                    messageClasses: 'twd-whitespace-pre-line twd-break-words'
                }
            );
            confirmDialogRef.afterClosed().subscribe((dialogResult: boolean | undefined) => {
                this._appUIService.addNotification({
                    icon: 'external_av_widget_creds',
                    message: { url, otp },
                    status: 'new',
                    showAlert: true
                });
            });
        } catch (ex) {
            console.error(ex);
        }
    }

    /**
     * To check for number only
     * @param event input event
     */
    public numberOnly(event: KeyboardEvent): boolean {
        if (!isNaN(Number(event.key)) || event.key === 'Enter') {
            return true;
        }
        return false;
    }

    /**
     * To reset form field value
     * @param field Form field
     */
    resetField(field: string): void {
        this.loginForm.patchValue({ [field]: '' });
    }

    /**
     * For single sign on
     */
    async ssoLogin(): Promise<boolean> {
        this.logger.debug(`ssoLogin: ${this.ssoType}`, false);
        if (!this.ssoType) {
            return false;
        }

        this.loading = true;

        try {
            if (this.ssoType === 'msteams') {
                const response = await this._msTeamsAuthSerivce.signIn();
                this.logger.debug(`ssoLogin: response=${response?.isSuccess}, ${response?.message}`, false);
                // check if authenticated
                if (response.isSuccess == true) {
                    // check the response
                    if (response.result?.user?.email) {
                        // get the agent lanId
                        const lanId = response.result.user.email.split('@')[0];
                        this.logger.debug(`ssoLogin: lanId=${lanId}`, false);

                        if (lanId) {
                            this.loginForm.patchValue({ lanId: lanId });
                            this.fuseSplashService.show();
                            this.login(true);
                        }
                    }
                }
                return true;
            } else {
                this.logger.warn(`ssoLogin: SSO type "${this.ssoType}" is not a valid, please contact the administrator!`, false);
                this._appUIService.showSnackbar(this.translocoService.translate('loginComponent.ssoTypeInvalid').replace('#ssoType', this.ssoType), 'failure');
            }
        } catch (error) {
            this.logger.error(`ssoLogin: Fail to authenticate`, error.error, false);
        } finally {
            this.loading = false;
        }
        return false;
    }

    /**
     * For single sign out
     */
    public singleSignOut(): void {
        if (this.ssoType === 'msteams') {
            this._msTeamsAuthSerivce.signOut();
        }
    }


    /**
     * method to check if mic access given in case of webphone calls
     * @returns true or false
     */
    private async checkForDevicePermission(): Promise<boolean> {
        try {
          // get the stream based on constrains
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
          // if success, stop all the tracks
          stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
          });
    
          // if success, return promise resolved
          return Promise.resolve(true);
        } catch (err) {
          // if failed, return promise reject
          this._appUIService.showSnackbar('Please provide microphone access to continue', 'failure');
          this.loading = false;
          return Promise.reject(err);
        }
    }


}
