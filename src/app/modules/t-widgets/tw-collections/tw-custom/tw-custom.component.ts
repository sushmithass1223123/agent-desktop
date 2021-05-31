import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { getStringVars, setStringVars } from '@tmac/operators';
import { SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IPostMessage, IWidget } from 'app/interfaces';
import { Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

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

    constructor(
        private sanitizer: DomSanitizer,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private _fuseFacadeService: FuseFacadeService,
        private _appDataService: AppDataService
    ) {
        super();
    }

    // tslint:disable-next-line: completed-docs
    ngOnInit(): void {
        this.subscriptions = {};
        // call the wrapper init method
        this.initWrapper(this.data);

        // check if this is opened in an interaction
        if (this.data.InteractionDetails) {
            this.interactionId = this.data.InteractionDetails.InteractionID;
        }

        // register to post message subject
        this._appDataService.postMessage.pipe(takeUntil(this.unsubscribeAll)).subscribe((message: IPostMessage) => {
            const fn = message.function?.toLowerCase();
            switch (fn) {
                case 'gettmacevents': // to get TMAC events
                    const events = this._tmacEventService.getAllEventsArray();
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
            // get the url
            let url = this.data.Data.Url;

            const stringVals = getStringVars(url);
            let setJson = {};

            if (stringVals && stringVals.length) {
                stringVals.forEach((val) => {
                    // get the path by taking string between ()
                    const path = val.substring(val.lastIndexOf('${') + 2, val.lastIndexOf('}'));
                    const splitPath = path.split('.');
                    if (splitPath[0].toLowerCase() === 'agentdata') {
                        setJson = {
                            ...setJson,
                            AgentData: SDKClient.getAgentData()
                        };
                    } else if (this.data.InteractionDetails && splitPath[0].toLowerCase() === 'interaction') {
                        setJson = {
                            ...setJson,
                            Interaction: this.data.InteractionDetails
                        };
                    }
                });

                // check if json has data
                if (Object.keys(setJson).length) {
                    url = setStringVars(url, setJson);
                }
            }

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
                .getAllEvents()
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
