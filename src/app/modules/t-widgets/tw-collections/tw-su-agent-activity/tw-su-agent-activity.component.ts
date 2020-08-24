import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AppDataService } from '@services/app-data.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';
import { TWLibrary } from '@modules/t-widgets/utils';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-su-agent-activity',
    templateUrl: './tw-su-agent-activity.component.html',
    styleUrls: ['./tw-su-agent-activity.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwSuAgentActivityComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;
    agentActivityData = [
        {
            title: 'Profile',
            profilePicUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            screenRecordUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            snapshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            location: {
                x: 12.914142,
                y: 74.855957
            },
            dateTime: '10/10/10 10:10:10',
            details: [
                {
                    key: 'name',
                    value: 'chirag'
                },
                {
                    key: 'Phone',
                    value: '1234567890'
                },
                {
                    key: 'Country',
                    value: 'India'
                },
                {
                    key: 'Address',
                    value: '1983  Red Maple Drive, Hollywood, California California, 90028'
                }
            ]
        },
        {
            title: 'Profile',
            profilePicUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            screenRecordUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            snapshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            location: {
                x: 12.914142,
                y: 74.855957
            },
            dateTime: '10/10/10 10:10:10',
            details: [
                {
                    key: 'name',
                    value: 'chirag'
                }
            ]
        },
        {
            title: 'Profile',
            profilePicUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            screenRecordUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            snapshotUrl: 'https://image.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg',
            location: {
                x: 12.914142,
                y: 74.855957
            },
            dateTime: '10/10/10 10:10:10',
            details: [
                {
                    key: 'name',
                    value: 'chirag'
                }
            ]
        }
    ];

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

        // // loop and get the widgets
        // this.agentActivityData.forEach((widget: IWidget) => {
        //     // get the widget component by type
        //     const component = TWLibrary.getWidget(widget.Type, widget);
        //     // check if the component is proper
        //     if (component) {
        //         // append the widget component to the list
        //         this.agentAcitivityPanels.push(component);
        //     }
        // });
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
