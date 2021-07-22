import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AOTWidgetService } from '@services/aot-widget.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { getStringVars, setStringVars } from '@tmac/operators';
import { SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { CustomTMACEventTypes, IPostMessage, IWidget } from 'app/interfaces';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * TwCustomComponent
 */
@Component({
    selector: 'tw-custom',
    templateUrl: './tw-custom.component.html',
    styleUrls: ['./tw-custom.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Fuse Config
     */
    // fuseConfig: FuseConfig;
    /**
     * Fuse custom config
     */
    customFuse$ = this._fuseFacadeService.getConfig({ flatTheme: 'flatTheme' });
    /**
     * Window pop widget
     */
    oinWidget: any;
    /**
     * Url loaded flag
     */
    loaded = false;
    /**
     * Custome frame URL
     */
    url: any;
    /**
     * Id and name of frame
     */
    idName: string;
    /**
     * Flag to show the UI or not
     */
    show: boolean;
    /**
     * If this widget is opened for an interaction
     */
    interactionId: number;

    /**
     * subscriptions
     */
    subscriptions: Partial<{
        /**
         * Events by Id
         */
        eventsById: Subscription;
        /**
         * All events
         */
        allEvents: Subscription;
    }>;

    /**
     * Excluded events to emit
     */
    excludedEvents: CustomTMACEventTypes[];

    constructor(
        private sanitizer: DomSanitizer,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private _fuseFacadeService: FuseFacadeService
    ) {
        super();

        this.excludedEvents = [
            'WallboardRefreshEvent',
            'TeamWallboardRefreshEvent',
            'QuizEvent',
            'TeamAgentListEvent',
            'AgentInteractionDetailsEvent',
            'AgentChannelListEvent',
            'AgentStatusDetailsEvent',
            'SupervisorAgentListEvent',
            'TeamAgentListDataEvent',
            'TeamChannelListEvent',
            'TeamIntentListEvent',
            'TeamActiveStatusDetailsEvent',
            'TeamActiveChannelListEvent',
            'TeamAgentInteractionDetailsEvent',
            'TeamrWorkCodeDetailsEvent'
        ];
    }

    // tslint:disable-next-line: completed-docs
    ngOnInit(): void {
        this.subscriptions = {};
        // call the wrapper init method
        this.initWrapper(this.data);

        // assign id
        this.idName = `tw_frame_${this.data.ID}`;

        // check if this is opened in an interaction
        if (this.data.InteractionDetails) {
            this.interactionId = this.data.InteractionDetails.InteractionID;
        }

        // register to post message subject
        this._tmacEventService.postMessage.pipe(takeUntil(this.unsubscribeAll)).subscribe((message: IPostMessage) => {
            const fn = message.function?.toLowerCase();
            // check the message from frame
            if (message.name && message.name !== this.idName) {
                // ignore message from different id
                return;
            }
            switch (fn) {
                case 'gettmacevents':
                    const events = this._tmacEventService.getAllEventsArrayExcluded(this.excludedEvents, this.interactionId);
                    // check event are there
                    if (events.length) {
                        // send event to the frame/opener
                        this.sendEventsToWindow(events);
                    }
                    break;
                default:
            }
        });

        // check if the url is provided
        if (this.data.Data.Url) {
            const url = setStringVars(this.data.Data.Url, {
                AgentData: SDKClient.getAgentData(),
                Interaction: this.data.InteractionDetails
            });

            // check 'Open In New' widget
            if (this.data.Data.OpenInNew) {
                this.oinWidget = window.open(
                    url,
                    this.data.Name,
                    `menubar=no,resizable=yes,location=no,scrollbars=no,
                    width=${this.data.Config.Position.W || screen.width},
                    height=${this.data.Config.Position.H || screen.height}`
                );

                try {
                    if (this.oinWidget) {
                        // listen to widget close event
                        this.oinWidget.onunload = () => {
                            // destroy the widget
                            this._aotWidgetService.destroyWidget(this.data.ID);
                        };
                    }
                } catch (error) {
                    console.error(error);
                }

                return;
            }

            // load the iframe URL
            this.url = this.transform(url);

            // set show to true
            this.show = true;

            // check if auto refresh is enabled
            if (this.data.Data.AutoRefresh && Number(this.data.Data.AutoRefresh) > 0) {
                setInterval(() => {
                    this.onRefreshEvent();
                }, Number(this.data.Data.AutoRefresh) * 1000);
            }
        }
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To sanitize the URL to load URL safely
     *
     * @param url Url to transform
     */
    transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    /**
     * To send TMAC events to the iframe/popup window
     *
     * @param {any[]} events
     */
    private sendEventsToWindow(evts: any[]): void {
        const iframe = document.getElementById('tw_frame_' + this.data.ID);
        // get the element
        const element = this.oinWidget ? this.oinWidget : iframe ? (iframe as HTMLIFrameElement).contentWindow : null;
        // check if the element is present
        if (element) {
            // send post message to the element
            element.postMessage(
                {
                    function: 'onTMACEvent',
                    callback: null,
                    data: evts,
                    source: 'tmac',
                    userObject: null
                },
                '*'
            );
        }
    }

    /**
     * Iframe loaded event
     */
    frameLoaded = (evt: any) => {
        if (!this.subscriptions.eventsById && !this.subscriptions.allEvents) {
            // subscribe to interaction events
            if (this.interactionId) {
                this.subscriptions.eventsById = this._tmacEventService
                    .getInteractionEventsById(this.interactionId)
                    .pipe(takeUntil(this.unsubscribeAll))
                    .subscribe((evts) => this.sendEventsToWindow(evts));
            }

            // subscribe to all non interaction events
            this.subscriptions.allEvents = this._tmacEventService
                .getNonInteractionEventsExcluded(this.excludedEvents)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.sendEventsToWindow(evts));
        }

        // check if id is there to make sure loaded completely
        if (evt.currentTarget.id) {
            // set loaded to true
            setTimeout(() => {
                this.loaded = true;
            });
        }
    };

    /**
     * On refresh event
     */
    onRefreshEvent(): void {
        const urlRef = this.url;
        this.url = null;
        this.loaded = false;
        setTimeout(
            (x) => {
                this.url = x;
            },
            0,
            urlRef
        );
    }
}
