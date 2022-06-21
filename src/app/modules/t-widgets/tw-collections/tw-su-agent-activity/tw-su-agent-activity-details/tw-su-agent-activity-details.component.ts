import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { latLng, tileLayer } from 'leaflet';
import { takeUntil } from 'rxjs/operators';

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
     * Constructor
     */
    constructor(private _tmacEventService: TMACEventService) {
        super('TwSuAgentActivityDetailsComponent');
    }

    /**
     * Lifecycle hooks
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // create the activity widgets
        this.createWidgets(this.data.Data?.ActivityDetails);
        // listen to TMAC events
        this._tmacEventService
            .getNonInteractionEvents(['AgentActivityEvent'])
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
    }

    /**
     * Lifecycle hooks
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    AgentActivityEvent(event: any): void {
        this.createWidgets(event);
    }

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
        const locationWidget = new TwWidgetModel('Location', 'tw-user-location', 'location_on');
        // check if the location is received
        if (item.location) {
            locationWidget.Data = {
                Source: 'dashboard',
                Location: {
                    Latitude: item.location.latitude,
                    Longitude: item.location.longitude
                }
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
}

// for more info visit - https://angular.io/api/core
