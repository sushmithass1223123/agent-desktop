import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { tileLayer, latLng } from 'leaflet';
import { TwWidgetModel } from 'app/models';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-su-agent-activity-details',
    templateUrl: './tw-su-agent-activity-details.component.html',
    styleUrls: ['./tw-su-agent-activity-details.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuAgentActivityDetailsComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    @Output() destroyEvent = new EventEmitter();

    activityWidgets: IWidget[] = [];

    options = {
        layers: [
            tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
        ],
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

    private createWidgets(item: any): void {
        // check the item
        if (!item) {
            return;
        }

        // create profile widget
        const profileWidget = new TwWidgetModel('Profile', 'tw-panel', 'account_box');
        profileWidget.Data.ImageURL = item.profilePicUrl;
        profileWidget.Data.Details = item.details;
        profileWidget.Config.Class = 'cover panel';
        profileWidget.Config.Actions = ['maximize'];

        // create snapshot widget
        const snapshotWidget = new TwWidgetModel('Snapshot', 'tw-panel', 'camera');
        snapshotWidget.Data.ImageURL = item.snapshotUrl;
        snapshotWidget.Config.Class = 'cover panel';
        snapshotWidget.Config.Actions = ['maximize'];

        // create location widget
        const locationWidget = new TwWidgetModel('Location', 'tw-panel', 'location_on');
        locationWidget.Data.Location = {
            layers: [
                tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
            ],
            zoom: 5,
            center: latLng(item.location.x, item.location.y)
        };
        locationWidget.Config.Class = 'cover panel';
        locationWidget.Config.Actions = ['maximize'];

        // create screenshot widget
        const screenshotWidget = new TwWidgetModel('Screenshot', 'tw-panel', 'all_out');
        screenshotWidget.Data.ImageURL = item.screenshotUrl;
        screenshotWidget.Config.Class = 'cover panel';
        screenshotWidget.Config.Actions = ['maximize'];

        // create screenvideo widget
        const screenVideoWidget = new TwWidgetModel('Screen Video', 'tw-panel', 'featured_video');
        screenVideoWidget.Data.VideoURL = item.screenRecordUrl;
        screenVideoWidget.Config.Class = 'cover panel';
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
