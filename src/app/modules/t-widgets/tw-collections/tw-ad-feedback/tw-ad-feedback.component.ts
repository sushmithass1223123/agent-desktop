import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { TwWrapperComponent } from '@modules/t-widgets/tw-wrapper/tw-wrapper.component';
import { MatTableDataSource } from '@angular/material/table';
import { random } from 'lodash';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { fuseAnimations } from '@fuse/animations';

@Component({
    selector: 'tw-ad-feedback',
    templateUrl: './tw-ad-feedback.component.html',
    styleUrls: ['./tw-ad-feedback.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAdFeedbackComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    ratings = Array(5).fill(1);
    stars = 4;
    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    dataConfig: {
        Source: 'dashboard' | 'supervisor';
    };

    feedbackDetailsTable = {
        source: new MatTableDataSource(
            Array(10)
                .fill(1)
                .map((_, i) => ({
                    InteractionID: `100${i}`,
                    Channel: ['Chat', 'Voice', 'Email', 'Whatsapp'][random(0, 3, false)],
                    Feedback: random(0, 5, false),
                    Score: random(1, 10)
                }))
        ),
        columns: ['InteractionID', 'Channel', 'Feedback', 'Score']
    };

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

        this.dataConfig = this.data.Data;
        this.feedbackDetailsTable.source.sort = this.sort;
        this.feedbackDetailsTable.source.paginator = this.paginator;
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
