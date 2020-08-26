import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'tw-su-work-codes',
    templateUrl: './tw-su-work-codes.component.html',
    styleUrls: ['./tw-su-work-codes.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuWorkCodesComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;
    // @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;
    // @ViewChild('auto') matAutocomplete: MatAutocomplete;
    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    allWorkCodes = [
        {
            name: 'work code1',
            value: 'less'
        },
        {
            name: 'work code2',
            value: 'more'
        },
        {
            name: 'work code3',
            value: 'average'
        },
        {
            name: 'work code4',
            value: 'most'
        },
        {
            name: 'work code5',
            value: 'less'
        },
        {
            name: 'work code6',
            value: 'most'
        }
    ];

    isHeatMap = true;
    visible = true;
    selectable = true;
    removable = true;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    workCodeCtrl = new FormControl();
    filteredWorkCodes: Observable<any[]>;
    selectedWorkCodes = [
        {
            name: 'work code1',
            value: 'less'
        },
        {
            name: 'work code2',
            value: 'more'
        },
        {
            name: 'work code3',
            value: 'average'
        },
        {
            name: 'work code4',
            value: 'most'
        }
    ];

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
        private _appDataService: AppDataService
    ) {
        super();

        this.filteredWorkCodes = this.workCodeCtrl.valueChanges.pipe(
            startWith(null),
            map((workcode) => (workcode ? this._filter(workcode) : this.allWorkCodes.slice()))
        );
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

    private _filter(value: string): any {
        const filterValue = value; // .name.toLowerCase();

        return this.allWorkCodes.filter((workcode) => workcode.name.toLowerCase().indexOf(filterValue) === 0);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        // Add our fruit
        if ((value || '').trim()) {
            const workCode = this.getWorkCode(value);
            if (workCode) {
                this.selectedWorkCodes.push(workCode);
            }
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }

        this.workCodeCtrl.setValue(null);
    }

    public remove(workCode: any): void {
        const index = this.selectedWorkCodes.indexOf(workCode);

        if (index >= 0) {
            this.selectedWorkCodes.splice(index, 1);
        }
    }

    public selected(event: MatAutocompleteSelectedEvent): void {
        this.selectedWorkCodes.push(this.getWorkCode(event.option.viewValue));
        this.workCodeInput.nativeElement.value = '';
        this.workCodeCtrl.setValue(null);
    }

    public getWorkCode(value: string): any {
        return this.allWorkCodes.find((workCode) => workCode.name === value);
    }
}

// for more info visit - https://angular.io/api/core
