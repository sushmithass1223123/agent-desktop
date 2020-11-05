import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { random } from 'lodash';

/**
 * Feedback compnent
 */
@Component({
    selector: 'tw-ad-feedback',
    templateUrl: './tw-ad-feedback.component.html',
    styleUrls: ['./tw-ad-feedback.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwAdFeedbackComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: any;

    /**
     * Mat sort ref
     */
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    /**
     * Mat Paginator ref
     */
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

    /**
     * Ratings size
     */
    ratings = Array(5).fill(1);
    /**
     * Static stars
     */
    stars = 4;

    /**
     * feedback date
     */
    date: number;

    /**
     * Data config
     */
    dataConfig: {
        /**
         * Source for reusability
         */
        Source: 'dashboard' | 'supervisor';
    };

    /**
     * Feedback details table
     */
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

    /**
     * Constructor
     */
    constructor() {
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

        this.dataConfig = this.data.Data;
        this.feedbackDetailsTable.source.sort = this.sort;
        this.feedbackDetailsTable.source.paginator = this.paginator;

        this.date = new Date().setMinutes(-15);
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
