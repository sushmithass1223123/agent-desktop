import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { AppUiService } from '@services/app-ui.service';
import { TMACEventService } from '@services/tmac-event.service';
import { SDKClient, WorkCode, WorkCodeAddedEvent } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { CustomSDKEvent, IWidget, ResData } from 'app/interfaces';
import { groupBy, orderBy, uniqBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

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
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Work Code input ref
     */
    @ViewChild('workCodeInput') workCodeInput: ElementRef<HTMLInputElement>;

    /**
     * Mat autocomplete ref
     */
    @ViewChild('auto') matAutocomplete: MatAutocomplete;

    /**
     * Load work codes stateful request
     */
    loadWorkCodesReq: ResData<Record<string, WorkCode[]>> = {
        data: {
            listData: []
        },
        error: false,
        loading: false,
        msg: ''
    };

    /**
     * Filtered options
     */
    filteredOptions: Observable<Record<string, WorkCode[]>>;

    /**
     * Data Configuration
     */
    widgetData: WidgetData;

    /**
     * Selected Workcodes
     */
    selectedWorkCodes: any[] = [];

    /**
     * Separator Keys
     */
    separatorKeysCodes: number[] = [ENTER, COMMA];

    /**
     * Work Code Form Control
     */
    workCodeCtrl = new FormControl();

    /**
     * Interaction ID
     */
    interactionId: number;

    /**
     * Workcode model ref
     */
    @ViewChild('addWorkcodeModalRef')
    addWorkcodeModalRef: TemplateRef<any>;

    /**
     * Constructor
     */
    constructor(private _appUiService: AppUiService, private _tmacEventService: TMACEventService, private matDialog: MatDialog) {
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

        this.widgetData = this.data.Data|| new Object();

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
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get ALl work codes Req
     * @method getAllWorkCodes
     */
    private async getAllWorkCodes(): Promise<void> {
        try {
            const loadWCRes = await SDKClient.loadCallWorkCodes(this.widgetData.ByTeam, null);
            const workGroup = {};
            let workCodeList = [];

            // check to order by group
            if (this.widgetData.ByGroup) {
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

            this.loadWorkCodesReq.data = this.widgetData.ByGroup ? groupBy(workCodeList, 'ParentName') : { listData: workCodeList };

            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.error = false;
        } catch (e) {
            this.loadWorkCodesReq.error = true;
            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.msg = COMMON_ERR_MESSAGE;
        }
    }

    /**
     * TeamrWorkCodeDetailsEvent handler
     * @method TeamrWorkCodeDetailsEvent
     * @param {CustomSDKEvent} evt
     */
    private TeamrWorkCodeDetailsEvent(evt: CustomSDKEvent): void {
        this.selectedWorkCodes = orderBy(evt.Data, ['Count'], ['desc']);
    }

    /**
     * WorkCodeAddedEvent Handler
     * @method WorkCodeAddedEvent
     * @param {WorkCodeAddedEvent} evt
     */
    private WorkCodeAddedEvent(evt: WorkCodeAddedEvent): void {
        // check for interaction
        if (evt.InteractionID !== this.interactionId) {
            return;
        }

        // check if the work code is already added
        if (this.selectedWorkCodes.filter((w: WorkCode) => w.Code === evt.Code).length <= 0) {
            this.selectedWorkCodes.push(evt);
            if (this.widgetData.ByGroup) {
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

    /**
     * Track by for avoiding rerender
     * @method trackByID
     * @param {number} index
     * @param {any} item
     */
    public trackByID(index: number, item: any): string {
        return item.Code;
    }

    /**
     * Initial Setup
     * @method setup
     */
    public setup(): void {
        this.widgetData.ByGroup = true;
        let subscription: Observable<any[]>;

        if (this.widgetData.Role === 'interaction') {
            // assign the interaction id
            this.interactionId = this.data.InteractionDetails?.InteractionID;
            this.loadWorkCodesReq.loading = true;
            this.getAllWorkCodes();
            subscription = this._tmacEventService.getInteractionEvents(['WorkCodeAddedEvent'], this.interactionId);
        } else if (this.widgetData.Role === 'supervisor') {
            subscription = this._tmacEventService.getEvents(['TeamrWorkCodeDetailsEvent']);
        } else {
            this.loadWorkCodesReq.error = true;
            this.loadWorkCodesReq.loading = false;
            this.loadWorkCodesReq.msg = 'Role not provided / Role Source';
        }

        // if subscription is not null then subscribe to it
        if (subscription) {
            subscription
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe(evts => evts.forEach(evt => this[evt.EventName](evt)));
        }
    }

    /**
     * Set Work Code
     * @method setWorkCode
     * @param {MatAutocompleteSelectedEvent} option
     */
    public setWorkCode(option: WorkCode, group: string): void {
        this._appUiService.showSnackbar('Setting work code', 'loading');
        SDKClient.setCallWorkCode(
            {
                code: option.Code,
                interactionId: this.data.InteractionDetails.InteractionID
            },
            null
        )
            .then(() => {
                this.selectedWorkCodes.push(option);
                if (this.widgetData.ByGroup) {
                    if (!group) {
                        Object.keys(this.loadWorkCodesReq.data).forEach((k) => {
                            this.loadWorkCodesReq.data[k] = this.loadWorkCodesReq.data[k].filter((x) => x.Code !== option.Code);
                        });
                    } else {
                        this.loadWorkCodesReq.data[group] = this.loadWorkCodesReq.data[group].filter((x) => x.Code !== option.Code);
                    }
                } else {
                    this.loadWorkCodesReq.data.listData = this.loadWorkCodesReq.data.listData.filter((x) => x.Code !== option.Code);
                }
                this._appUiService.showSnackbar('Work code set successfully', 'success');
                this.workCodeInput.nativeElement.value = '';
                this.workCodeCtrl.setValue('');
            })
            .catch(() => {
                this._appUiService.showSnackbar(COMMON_ERR_MESSAGE, 'failure');
            });
    }

    /**
     * Remove Work Code
     * @method removeWorkCode
     * @param {WorkCode} option
     */
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
                if (this.widgetData.ByGroup) {
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

    /**
     * Filter Options
     * @method _filterOptions
     * @param {String} name
     */
    _filterOptions(name: string): Record<string, WorkCode[]> {
        let filteredData: any;
        if (this.widgetData.ByGroup) {
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

    /**
     * Get option value after merging
     * @method getOptionValue
     * @param {any} x
     * @param {any} y
     */
    getOptionValue(x: any, y: any): any {
        return { ...x, ...y };
    }

    /**
     * To open work code modal
     */
    openAddWorkCodeModal(): void {
        this.matDialog.open(this.addWorkcodeModalRef, {
            width: '50%'
        });
    }
}

interface WidgetData {
    /**
     * To get data based on agent profile
     */
    Role: 'supervisor' | 'interaction';
    /**
     * To get call workcodes by team (For Role interaction)
     */
    ByTeam: boolean;
    /**
     * To group call workcodes (For Role interaction)
     */
    ByGroup: boolean;
}
