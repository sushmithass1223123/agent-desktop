import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ResData } from 'app/interfaces';
import { groupBy, orderBy, uniqBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { SDKClient, WorkCode, WorkCodeAddedEvent } from 'tmac-sdk';

/**
 * Work codes Component
 */
@Component({
    selector: 'tw-work-codes',
    templateUrl: './tw-work-codes.component.html',
    styleUrls: ['./tw-work-codes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWorkCodesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    @ViewChild('workCodeInput') workCodeInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') matAutocomplete: MatAutocomplete;

    loadWorkCodesReq: ResData<Record<string, WorkCode[]>> = {
        data: {
            listData: []
        },
        error: false,
        loading: false,
        msg: ''
    };
    filteredOptions: Observable<Record<string, WorkCode[]>>;

    DataConf: {
        Source: string;
        ByTeam: boolean;
        ByGroup: boolean;
    };

    selectedWorkCodes: any[] = [];
    separatorKeysCodes: number[] = [ENTER, COMMA];
    workCodeCtrl = new FormControl();

    interactionId: number;

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
        private _appUiService: AppUiService
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

        this.filteredOptions = this.workCodeCtrl.valueChanges.pipe(
            startWith(''),
            map((wc) => (typeof wc === 'string' ? wc : '')),
            map((wc) => (wc ? this._filterOptions(wc) : this.loadWorkCodesReq.data))
        );

        // do the setup
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
            let workCodeList = [];

            // check to order by group
            if (this.DataConf.ByGroup) {
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
            } else {
                workCodeList = loadWCRes.response;
            }

            workCodeList = uniqBy(workCodeList, 'Name');

            this.loadWorkCodesReq.data = this.DataConf.ByGroup ? groupBy(workCodeList, 'ParentName') : { listData: workCodeList };

            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.error = false;
        } catch (e) {
            this.loadWorkCodesReq.error = true;
            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.msg = COMMON_ERR_MESSAGE;
        }
    }

    private TeamrWorkCodeDetailsEvent = (workCodeList: any) => {
        this.selectedWorkCodes = orderBy(workCodeList, ['Count'], ['desc']);
    }

    private WorkCodeAddedEvent = (evt: WorkCodeAddedEvent) => {
        // check for interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check if the work code is already added
        if (this.selectedWorkCodes.filter((w: WorkCode) => w.Code === evt.Code).length <= 0) {
            this.selectedWorkCodes.push(evt);
            if (this.DataConf.ByGroup) {
                Object.keys(this.loadWorkCodesReq.data).forEach((k) => {
                    this.loadWorkCodesReq.data[k] = this.loadWorkCodesReq.data[k].filter((x) => x.Code !== evt.Code);
                });
            } else {
                this.loadWorkCodesReq.data.listData = this.loadWorkCodesReq.data.listData.filter((x) => x.Code !== evt.Code);
            }
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public setup(): void {
        if (this.DataConf.Source === 'interaction') {
            // assign the interaction id
            this.interactionId = this.data.InteractionDetails?.InteractionID;
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
        this._appUiService.showSnackbar('Setting work code', 'loading');
        SDKClient.setCallWorkCode(
            {
                code: option.option.value.Code,
                interactionId: this.data.InteractionDetails.InteractionID
            },
            null
        )
            .then(() => {
                this.selectedWorkCodes.push(option.option.value);
                if (this.DataConf.ByGroup) {
                    if (!option.option.group.label) {
                        Object.keys(this.loadWorkCodesReq.data).forEach((k) => {
                            this.loadWorkCodesReq.data[k] = this.loadWorkCodesReq.data[k].filter((x) => x.Code !== option.option.value.Code);
                        });
                    } else {
                        this.loadWorkCodesReq.data[option.option.group.label] = this.loadWorkCodesReq.data[option.option.group.label].filter(
                            (x) => x.Code !== option.option.value.Code
                        );
                    }
                } else {
                    this.loadWorkCodesReq.data.listData = this.loadWorkCodesReq.data.listData.filter((x) => x.Code !== option.option.value.Code);
                }
                this._appUiService.showSnackbar('Work code set successfully', 'success');
                this.workCodeInput.nativeElement.value = '';
            })
            .catch(() => {
                this._appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
            });
    }

    public removeWorkCode(option: WorkCode): void {
        this._appUiService.showSnackbar('Removing work code', 'loading');

        SDKClient.removeCallWorkCode(
            {
                code: option.Code,
                interactionId: this.data.InteractionDetails.InteractionID
            },
            null
        )
            .then(() => {
                this.selectedWorkCodes = this.selectedWorkCodes.filter((s: any) => s.Code !== option.Code);
                if (this.DataConf.ByGroup) {
                    this.loadWorkCodesReq.data[(option as any).ParentName].push(option);
                } else {
                    this.loadWorkCodesReq.data.listData.push(option);
                }
                this._appUiService.showSnackbar('Work code removed successfully', 'success');
            })
            .catch(() => {
                this._appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
            });
    }

    _filterOptions(name: string): Record<string, WorkCode[]> {
        let filteredData: any;
        if (this.DataConf.ByGroup) {
            filteredData = {};
            Object.keys(this.loadWorkCodesReq.data).forEach((c) => {
                filteredData[c] = this.loadWorkCodesReq.data[c].filter((x) => x.Name.toLowerCase().includes(name.toLowerCase()));
            });
        } else {
            if (!this.loadWorkCodesReq.data.listData) {
                this.loadWorkCodesReq.data.listData = [];
            }
            filteredData = { listData: this.loadWorkCodesReq.data.listData.filter((x) => x.Name.toLowerCase().includes(name.toLowerCase())) };
        }
        return filteredData;
    }

    getOptionValue(x: any, y: any): any {
        return { ...x, ...y };
    }
}

// for more info visit - https://angular.io/api/core
