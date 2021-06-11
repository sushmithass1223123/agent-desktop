import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { latLng, tileLayer } from 'leaflet';

/**
 * Supervisor Agent Activity Details Component
 */
@Component({
    selector: 'tw-su-agent-activity-details',
    templateUrl: './tw-su-agent-activity-details.component.html',
    styleUrls: ['./tw-su-agent-activity-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuAgentActivityDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: any;

    /**
     * Activity widget ref list
     */
    activityWidgets: IWidget[] = [];

    /**
     * Location options
     */
    options = {
        layers: [tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })],
        zoom: 5,
        center: latLng(46.879966, -121.726909)
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

        // create the activity widgets
        this.createWidgets(this.data.Data?.ActivityDetails);
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
     * To create widgets
     *
     * @param item
     * @returns
     */
    private createWidgets(item: any): void {
        // check the item
        if (!item) {
            return;
        }

        // create profile widget
        const profileWidget = new TwWidgetModel('Profile', 'tw-panel', 'account_box');
        profileWidget.Data.ImageURL = item.profilePicture;
        profileWidget.Data.Details = item.details;
        profileWidget.Config.Class = 'mx-cover panel';
        profileWidget.Config.Actions = [];

        // create snapshot widget
        const snapshotWidget = new TwWidgetModel('Snapshot', 'tw-panel', 'camera');
        snapshotWidget.Data.ImageURL = item.snapshot;
        snapshotWidget.Config.Class = 'mx-cover panel';
        snapshotWidget.Config.Actions = ['maximize'];

        // create location widget
        const locationWidget = new TwWidgetModel('Location', 'tw-panel', 'location_on');
        // check if the location is received
        if (item.location) {
            locationWidget.Data.Location = {
                layers: [tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })],
                zoom: 5,
                center: latLng(item.location.latitude, item.location.longitude)
            };
        }
        locationWidget.Config.Class = 'mx-cover panel';
        locationWidget.Config.Actions = ['maximize'];

        // create screenshot widget
        const screenshotWidget = new TwWidgetModel('Screenshot', 'tw-panel', 'all_out');
        screenshotWidget.Data.ImageURL = item.screenshot;
        screenshotWidget.Config.Class = 'mx-cover panel';
        screenshotWidget.Config.Actions = ['maximize'];

        // create screenvideo widget
        const screenVideoWidget = new TwWidgetModel('Screen Video', 'tw-panel', 'featured_video');
        screenVideoWidget.Data.VideoURL = item.screenvideo;
        screenVideoWidget.Config.Class = 'mx-cover panel';
        screenVideoWidget.Config.Actions = ['maximize'];

        // push all the widgets
        this.activityWidgets['profileWidget'] = profileWidget;
        this.activityWidgets['snapshotWidget'] = snapshotWidget;
        this.activityWidgets['locationWidget'] = locationWidget;
        this.activityWidgets['screenshotWidget'] = screenshotWidget;
        this.activityWidgets['screenVideoWidget'] = screenVideoWidget;
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
