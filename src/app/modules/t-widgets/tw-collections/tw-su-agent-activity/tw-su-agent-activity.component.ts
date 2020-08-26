import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { TwWidgetModel } from 'app/models';
import { tileLayer, latLng } from 'leaflet';
import { fuseAnimations } from '@fuse/animations';

@Component({
    selector: 'tw-su-agent-activity',
    templateUrl: './tw-su-agent-activity.component.html',
    styleUrls: ['./tw-su-agent-activity.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwSuAgentActivityComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    activityWidgets = [];

    sampleData = [
        {
            dateTime: '10/10/10 10:10:10',
            profilePicUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            details: [
                {
                    Title: 'Agent Name',
                    Value: 'chirag'
                },
                {
                    Title: 'Agent ID',
                    Value: '55001'
                }
            ],
            snapshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            location: {
                x: 12.914142,
                y: 74.855957
            },
            screenshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            screenRecordUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        },
        {
            dateTime: '10/10/10 10:10:10',
            profilePicUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            details: [
                {
                    Title: 'Agent Name',
                    Value: 'chirag'
                },
                {
                    Title: 'Agent ID',
                    Value: '55001'
                }
            ],
            snapshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            location: {
                x: 12.914142,
                y: 74.855957
            },
            screenshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            screenRecordUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        },
        {
            dateTime: '10/10/10 10:10:10',
            profilePicUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            details: [
                {
                    Title: 'Agent Name',
                    Value: 'chirag'
                },
                {
                    Title: 'Agent ID',
                    Value: '55001'
                }
            ],
            snapshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            location: {
                x: 12.914142,
                y: 74.855957
            },
            screenshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            screenRecordUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        }
    ];

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

        this.sampleData.forEach((item: any) => {
            // create activity details widget
            const widget = new TwWidgetModel(item.dateTime, 'tw-su-agent-activity-details', 'local_activity');
            widget.Config.Actions = ['minimize'];
            widget.Config.ViewState = 'minimize';
            widget.Data.Widgets = [];

            // create profile widget
            const profileWidget = new TwWidgetModel('Profile', 'tw-panel', 'account_box');
            profileWidget.Data.ImageURL = item.profilePicUrl;
            profileWidget.Data.Details = item.details;
            profileWidget.Config.Class = 'cover panel';
            profileWidget.Config.Actions = ['maximize'];

            const snapshotWidget = new TwWidgetModel('Snapshot', 'tw-panel', 'camera');
            snapshotWidget.Data.ImageURL = item.snapshotUrl;
            snapshotWidget.Config.Class = 'cover panel';
            snapshotWidget.Config.Actions = ['maximize'];

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

            const screenshotWidget = new TwWidgetModel('Screenshot', 'tw-panel', 'all_out');
            screenshotWidget.Data.ImageURL = item.screenshotUrl;
            screenshotWidget.Config.Class = 'cover panel';
            screenshotWidget.Config.Actions = ['maximize'];

            const screenVideoWidget = new TwWidgetModel('Screen Video', 'tw-panel', 'featured_video');
            screenVideoWidget.Data.VideoURL = item.screenRecordUrl;
            screenVideoWidget.Config.Class = 'cover panel';
            screenVideoWidget.Config.Actions = ['maximize'];

            // push all the widgets
            widget.Data.Widgets.push(profileWidget);
            widget.Data.Widgets.push(snapshotWidget);
            widget.Data.Widgets.push(locationWidget);
            widget.Data.Widgets.push(screenshotWidget);
            widget.Data.Widgets.push(screenVideoWidget);

            // push the widget to list
            this.activityWidgets.push(widget);
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

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
