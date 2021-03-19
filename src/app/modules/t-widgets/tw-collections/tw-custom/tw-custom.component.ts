import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_DATA_MAP } from 'app/constants';
import { IWidget } from 'app/interfaces';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IAgentData } from 'tmac-sdk';

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
    fuseConfig: FuseConfig;

    /**
     * Window pop widget
     */
    oinWidget: any;
    /**
     * Initial loaded flag
     */
    initialLoad: boolean;
    /**
     * Url loaded flag
     */
    loaded = false;
    /**
     * Custome frame URL
     */
    url: any;
    /**
     * Agent data
     */
    agentData: IAgentData;
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
        allEvents: Subscription
    }>;

    constructor(
        private sanitizer: DomSanitizer,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private _fuseConfigService: FuseConfigService
    ) {
        super();
    }

    // tslint:disable-next-line: completed-docs
    ngOnInit(): void {
        this.subscriptions = {};
        // call the wrapper init method
        this.initWrapper(this.data);

        // Subscribe to the config changes
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((fuseConfig: FuseConfig) => {
            this.fuseConfig = fuseConfig;
        });

        // check if the url is provided
        if (this.data.Data.Url) {
            // get the url
            let url = this.data.Data.Url;

            // get the agent data map
            let mapObj = AGENT_DATA_MAP();

            // check if interaction details are there
            if (this.data.InteractionDetails) {
                this.interactionId = this.data.InteractionDetails.InteractionID;
                mapObj = { ...mapObj, ...this.data.InteractionDetails };
            }

            // check if extra map data sent with in an interaction
            if (this.data.Data.MapObject) {
                mapObj = { ...mapObj, ...this.data.Data.MapObject };
            }

            // add the query param
            const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
            url = url.replace(reg, (matched: any) => {
                return mapObj[matched] || matched;
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

        // register to TMAC events
        // SDKClient.events.on('onTMACEvent', this.onTMACEvent);
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // de register from TMAC events
        // SDKClient.events.off('onTMACEvent', this.onTMACEvent);
    }

    /**
     * To sanitize the URL to load URL safely
     *
     * @param url Url to transform
     */
    transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // /**
    //  * TMAC event listener function
    //  * @param evt TMAC event
    //  */
    // private onTMACEvent = (evt: IUIEvent) => {
    //     this.sendEventsToWindow([evt]);
    // }

    /**
     * To send TMAC events to the iframe/popup window
     *
     * @param {any[]} events
     */
    private sendEventsToWindow(evts: any[]): void {
        const iframe = document.getElementById('frame_' + this.data.ID);
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
    frameLoaded = () => {
        // check if this is not initial load
        // if (this.initialLoad) {
        if (!this.subscriptions.eventsById && !this.subscriptions.allEvents) {
            // subscribe to interaction events
            this.subscriptions.eventsById = this._tmacEventService
                .getInteractionEventsById(this.interactionId)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.sendEventsToWindow(evts));

            // subscribe to all non interaction events
            this.subscriptions.allEvents = this._tmacEventService
                .getAllEvents()
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.sendEventsToWindow(evts));
        }

        // set loaded to true
        setTimeout(() => {
            this.loaded = true;
        });
        // } else {
        //     // set initial load to true
        //     this.initialLoad = true;
        // }
    }

    /**
     * On refresh event
     */
    onRefreshEvent(): void {
        const urlRef = this.url;
        this.url = null;
        this.initialLoad = false;
        this.loaded = false;
        setTimeout((x) => {
            this.url = x;
        }, 0, urlRef);
    }
}
