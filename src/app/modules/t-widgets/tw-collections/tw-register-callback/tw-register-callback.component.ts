import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FuseConfigService } from '@fuse/services/config.service';
import { SnackbarComponent } from '@modules/shared/snackbar/snackbar.component';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { ReqCampaignContact, ResCampaign, ResData } from 'app/interfaces';
import * as moment from 'moment';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';
import { AppUiService } from 'app/services/app-ui.service';

@Component({
    selector: 'tw-register-callback',
    templateUrl: './tw-register-callback.component.html',
    styleUrls: ['./tw-register-callback.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwRegisterCallbackComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;
    @ViewChild('addContactForm') addContactFormDialog: TemplateRef<any>;

    dataConfig: {
        GetCampaignsUrl: string;
        CreateContactCampaignUrl: string;
    };

    selectedCampaign: ResCampaign;

    getCampaignsReq: ResData<ResCampaign[]> = {
        data: [],
        error: false,
        loading: true,
        msg: ''
    };

    addCampaingReq: ResData<null> = {
        error: false,
        loading: false,
        msg: ''
    };

    addContactFormGroup = new FormGroup({
        name: new FormControl('', [Validators.required]),
        phone: new FormControl('', [Validators.required]),
        date: new FormControl(new Date(), [Validators.required]),
        time: new FormControl('12:00', [Validators.required])
    });

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        private http: HttpClient,
        private matDialog: MatDialog,
        private appUiService: AppUiService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        this.dataConfig = this.data.Data;
        this.fetchCampaigns();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    fetchCampaigns(): void {
        if (this.dataConfig.GetCampaignsUrl) {
            this.http.get<ResCampaign[]>(this.dataConfig.GetCampaignsUrl).subscribe(
                (res) => {
                    this.getCampaignsReq = {
                        data: res,
                        error: false,
                        loading: false,
                        msg: ''
                    };
                },
                () => {
                    this.getCampaignsReq = {
                        error: true,
                        loading: false,
                        msg: COMMON_ERR_MESSAGE
                    };
                }
            );
        } else {
            this.getCampaignsReq = {
                error: true,
                loading: false,
                msg: 'GetCampaignsUrl not found'
            };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    addNewContact(): void {
        if (this.addContactFormGroup.invalid) {
            return;
        }
        const contact = this.addContactFormGroup.value;
        this.addCampaingReq = {
            error: false,
            loading: true,
            msg: ''
        };

        let directAgentScheduleTime: any = new Date(contact.date);
        directAgentScheduleTime.setHours(contact.time.split(':')[0]);
        directAgentScheduleTime.setMinutes(contact.time.split(':')[1]);
        directAgentScheduleTime.setSeconds(0);
        directAgentScheduleTime = moment(directAgentScheduleTime).format('YYYYMMDDHHmmss');

        const { agentId } = SDKClient.getAgentData();

        const reqPacket: ReqCampaignContact = {
            campaignId: this.selectedCampaign.id,
            campaignName: this.selectedCampaign.campaignName,
            channel: this.selectedCampaign.channel,
            directAgent: agentId,
            directAgentScheduleTime,
            dnd: false,
            dynamicValues: '',
            email: this.selectedCampaign.emailAccountId,
            name: contact.name,
            phoneNumber: contact.phone,
            retryCount: this.selectedCampaign.retryCount
        };
        this.http.post(this.dataConfig.CreateContactCampaignUrl, reqPacket).subscribe(
            () => {
                this.addCampaingReq = {
                    error: false,
                    loading: false,
                    msg: ''
                };
                this.matDialog.closeAll();
                this.appUiService.showSnackbar('Added contact successfully', 'success');
            },
            () => {
                this.addCampaingReq = {
                    error: true,
                    loading: false,
                    msg: COMMON_ERR_MESSAGE
                };
                this.appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
            }
        );
    }

    toggleForm(campaign: ResCampaign): void {
        if (this.matDialog.openDialogs.length) {
            this.matDialog.closeAll();
        } else {
            this.selectedCampaign = campaign;
            this.matDialog
                .open(this.addContactFormDialog, {
                    data: campaign,
                    width: '20%',
                    panelClass: 'new-campaign-contact'
                })
                .afterClosed()
                .subscribe(() => {
                    this.addContactFormGroup.reset();
                });
        }
    }
}

// for more info visit - https://angular.io/api/core
