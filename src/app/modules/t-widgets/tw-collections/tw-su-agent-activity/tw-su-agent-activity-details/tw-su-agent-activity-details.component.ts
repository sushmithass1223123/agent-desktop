import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AppDataService } from '@services/app-data.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';
import { tileLayer, latLng, circle, polygon } from 'leaflet';

@Component({
    selector: 'tw-su-agent-activity-details',
    templateUrl: './tw-su-agent-activity-details.component.html',
    styleUrls: ['./tw-su-agent-activity-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuAgentActivityDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    @Input() activityData;
    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    options;
    layersControl;
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

        this.data = {
            Name: this.activityData.dateTime ? this.activityData.dateTime : '',
            Description: '',
            Type: 'tw-su-agent-activity',
            Config: {
                Static: false,
                Anchor: false,
                Icon: '',
                Class: '',
                Position: {
                    X: 4,
                    Y: 3
                },
                Actions: ['minimize'],
                ViewState: 'minimize',
                PinState: false,
                FloatState: false,
                Resizable: false,
                Header: true,
                Disabled: false
            },
            Data: {}
        };

        this.options = {
            layers: [tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '' })],
            zoom: 5,
            center: latLng(12.914142, 74.855957)
        };
        this.layersControl = {
            baseLayers: {
                'Open Street Map': tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
                'Open Cycle Map': tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
            },
            overlays: {
                'Big Circle': circle([46.95, -122], { radius: 5000 }),
                'Big Square': polygon([
                    [46.8, -121.55],
                    [46.9, -121.55],
                    [46.9, -121.7],
                    [46.8, -121.7]
                ])
            }
        };
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

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
