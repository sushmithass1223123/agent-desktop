import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FuseConfigService } from '@fuse/services/config.service';
import { SnackbarComponent } from '@modules/shared/snackbar/snackbar.component';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { ResData } from 'app/interfaces';
import * as _ from 'lodash';
import { groupBy } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { SDKClient, WorkCode } from 'tmac-sdk';

@Component({
    selector: 'tw-work-codes',
    templateUrl: './tw-work-codes.component.html',
    styleUrls: ['./tw-work-codes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWorkCodesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any; // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    loadWorkCodesReq: ResData<Record<string, WorkCode[]>> = {
        data: {},
        error: false,
        loading: false,
        msg: ''
    };

    DataConf: {
        Source: string;
        ByTeam: boolean;
    };

    selectedWorkCodes: any = [];
    separatorKeysCodes: number[] = [ENTER, COMMA];
    workCodeCtrl = new FormControl();

    @ViewChild('workCodeInput') workCodeInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') matAutocomplete: MatAutocomplete;

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
        private _snackbar: MatSnackBar
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

        this.DataConf = this.data.Data;

        this.setup();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('TeamrWorkCodeDetailsEvent', this.TeamrWorkCodeDetailsEvent);
        SDKClient.events.off('WorkCodeAddedEvent', this.WorkCodeAddedEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private async getAllWorkCodes(): Promise<void> {
        try {
            const loadWCRes = await SDKClient.loadCallWorkCodes(this.DataConf.ByTeam, null);
            const workGroup = {};
            const workCodeList = [];

            loadWCRes.response?.forEach((item: any) => {
                if (item.ParentID === '0') {
                    workGroup[item.Code] = { i: item.Code, Name: item.Name, Pid: item.ParentID };
                }
            });

            loadWCRes.response?.forEach((item: any, index: number) => {
                if (item.ParentID !== '0') {
                    item.ParentName = workGroup[loadWCRes.response[index].ParentID].Name;
                    workCodeList.push(item);
                }
            });

            this.loadWorkCodesReq.data = groupBy(workCodeList, 'ParentName');
            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.error = false;
        }
        catch (e) {
            this.loadWorkCodesReq.error = true;
            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.msg = COMMON_ERR_MESSAGE;
        }
    }

    private TeamrWorkCodeDetailsEvent = (workCodeList: any) => {
        this.selectedWorkCodes = _.orderBy(workCodeList, ['Count'], ['desc']);
    }

    private WorkCodeAddedEvent = (workCode: WorkCode) => {
        this.selectedWorkCodes.push(workCode);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public setup(): void {
        if (this.DataConf.Source === 'interaction') {
            this.loadWorkCodesReq.loading = true;
            this.getAllWorkCodes();
            SDKClient.events.on('WorkCodeAddedEvent', this.WorkCodeAddedEvent);
        } else if (this.DataConf.Source === 'supervisor') {
            SDKClient.events.on('TeamrWorkCodeDetailsEvent', this.TeamrWorkCodeDetailsEvent);
        } else {
            this.loadWorkCodesReq.error = true;
            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.msg = 'Source not provided / Invalid Source';
        }
    }

    public setWorkCode(option: MatAutocompleteSelectedEvent): void {
        this._snackbar.openFromComponent(SnackbarComponent, {
            data: {
                icon: 'loop',
                loading: true,
                color: 'primary',
                message: 'Setting work code'
            },
            verticalPosition: 'top'
        });
        SDKClient.setCallWorkCode(
            {
                code: option.option.value.Code,
                interactionId: this.data.InteractionDetails.InteractionID
            },
            null
        )
            .then(() => {
                this.selectedWorkCodes.push(option.option.value);
                this.loadWorkCodesReq.data[option.option.group.label] = this.loadWorkCodesReq.data[option.option.group.label].filter(
                    (x) => x.Code !== option.option.value.Code
                );

                this._snackbar.openFromComponent(SnackbarComponent, {
                    data: {
                        icon: 'done',
                        color: 'success',
                        message: 'Work code set successfully'
                    },
                    verticalPosition: 'top'
                });
                setTimeout(() => {
                    this._snackbar.dismiss();
                }, 3000);
            })
            .catch(() => {
                this._snackbar.openFromComponent(SnackbarComponent, {
                    data: {
                        icon: 'close',
                        color: 'danger',
                        message: 'Something went wrong '
                    },
                    verticalPosition: 'top'
                });
                setTimeout(() => {
                    this._snackbar.dismiss();
                }, 3000);
            });
    }

    public removeWorkCode(option: WorkCode): void {
        this._snackbar.openFromComponent(SnackbarComponent, {
            data: {
                icon: 'loop',
                loading: true,
                color: 'primary',
                message: 'Removing work code'
            },
            verticalPosition: 'top'
        });

        SDKClient.removeCallWorkCode(
            {
                code: option.Code,
                interactionId: this.data.InteractionDetails.InteractionID
            },
            null
        )
            .then(() => {
                this.selectedWorkCodes = this.selectedWorkCodes.filter((s: any) => s.Code !== option.Code);
                this.loadWorkCodesReq.data[option.ParentID].push(option);
                this._snackbar.openFromComponent(SnackbarComponent, {
                    data: {
                        icon: 'done',
                        color: 'success',
                        message: 'Work code removed successfully'
                    },
                    verticalPosition: 'top'
                });
                setTimeout(() => {
                    this._snackbar.dismiss();
                }, 3000);
            })
            .catch(() => {
                this._snackbar.openFromComponent(SnackbarComponent, {
                    data: {
                        icon: 'close',
                        color: 'danger',
                        message: 'Something went wrong '
                    },
                    verticalPosition: 'top'
                });
                setTimeout(() => {
                    this._snackbar.dismiss();
                }, 3000);
            });
    }
}

// for more info visit - https://angular.io/api/core
