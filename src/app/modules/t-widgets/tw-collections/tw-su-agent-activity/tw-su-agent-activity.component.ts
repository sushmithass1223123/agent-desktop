import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { TwWidgetModel } from 'app/models';

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

    activityWidget = [];

    activityList = [
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

        this.activityList.forEach((item: any) => {
            // create activity details widget
            const widget = new TwWidgetModel(item.dateTime, 'tw-su-agent-activity-details', 'local_activity');
            widget.Config.Actions = ['minimize'];
            widget.Config.ViewState = 'restore';
            widget.Data.ActivityDetails = item;

            // push the widget to list
            this.activityWidget.push(widget);
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
