import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AppDataService } from '@services/app-data.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { getStringVars, setStringVars } from '@tmac/operators';
import { SDKClient } from '@tmac/sdk';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IPostMessage } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Custom content component
 */
@Component({
    selector: 'twc-custom',
    templateUrl: './twc-custom.component.html',
    styleUrls: ['./twc-custom.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcCustomComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * Fuse Config
     */
    // fuseConfig: FuseConfig;
    /**
     * Fuse custom config
     */
    customFuse$ = this._fuseFacadeService.getConfig({ flatTheme: 'flatTheme' });
    /**
     * Frame loaded flag
     */
    loaded = false;
    /**
     * Url to load the frame
     */
    url: any;
    /**
     * Flag to unload the page
     */
    unload: boolean;
    /**
     * Subscriptions
     */
    eventSubscriptions: Subscription;
    /**
     * Auto refresh interval
     */
    autoRefreshInterval: any;

    /**
     * Constructor
     * @param {ElementRef} hostElement 
     * @param {ContentPageService} contentPageService 
     * @param {DomSanitizer} _sanitizer 
     */
    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _sanitizer: DomSanitizer,
        private _tmacEventService: TMACEventService,
        // private _fuseConfigService: FuseConfigService,
        private _fuseFacadeService: FuseFacadeService,
        private _appDataService: AppDataService
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to the config changes
        // this._fuseConfigService.config
        //     .pipe(takeUntil(this.unsubscribeAll))
        //     .subscribe((fuseConfig: FuseConfig) => {
        //         this.fuseConfig = fuseConfig;
        //     });

        // register to post message subject
        this._appDataService.postMessage
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((data: IPostMessage) => {
                // check if the function is to get TMAC events
                if (data.function?.toLowerCase() === 'gettmacevents') {
                    this.sendEventsToWindow(this._tmacEventService.nonInteractionEvents());
                }
            });

        this.eventSubscriptions = null;
        this.unload = this.data.Data.Unload || false;
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this.eventSubscriptions = null;
    }

    /**
     * To send TMAC events to the iframe/popup window
     *
     * @param {any[]} events
     */
    private sendEventsToWindow(evts: any): void {
        const iframe = document.getElementById('twc_frame_' + this.data.ID);
        // get the element
        const element = iframe ? (iframe as HTMLIFrameElement).contentWindow : null;
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
     * To sanitize the URL to load URL safely
     * 
     * @param url Url to transform
     */
    private transform(url: string): any {
        return this._sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    /**
     * On page active
     */
    onActive = () => {
        if (!this.loaded) {
            // check if the url is provided
            if (this.widgetData.Data.Url) {
                // get the url
                let url = this.data.Data.Url;

                const stringVals = getStringVars(url);
                let setJson = {};

                if (stringVals && stringVals.length) {
                    stringVals.forEach(val => {
                        // get the path by taking string between ()
                        const path = val.substring(
                            val.lastIndexOf('${') + 2,
                            val.lastIndexOf('}')
                        );
                        const splitPath = path.split('.');
                        if (splitPath[0].toLowerCase() === 'agentdata') {
                            setJson = {
                                ...setJson,
                                AgentData: SDKClient.getAgentData()
                            };
                        }
                    });

                    // check if json has data
                    if (Object.keys(setJson).length) {
                        url = setStringVars(url, setJson);
                    }
                }

                // load the iframe URL
                this.url = this.transform(url);

                // check if auto refresh is enabled
                if (this.data.Data.AutoRefresh && Number(this.data.Data.AutoRefresh) > 0) {
                    this.autoRefreshInterval = setInterval(() => {
                        // if the page is not active then cle
                        this.onRefreshEvent();
                    }, Number(this.data.Data.AutoRefresh) * 1000);
                }
            }
        }
    }

    /**
     * On page inactive callback
     */
    onInactive = () => {
        // check if loaded and page is active
        if (this.loaded && this.pageActive) {
            if (this.unload) {
                this.loaded = false;
                this.url = null;
                // check if interval has started then clear
                if (this.autoRefreshInterval) {
                    clearInterval(this.autoRefreshInterval);
                }
            }
        }
    }

    /**
     * Iframe loaded event
     */
    frameLoaded = (evt: any) => {
        if (!this.eventSubscriptions) {
            // subscribe to all non interaction events
            this.eventSubscriptions = this._tmacEventService
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
    }

    /**
     * On refresh event
     */
    onRefreshEvent(): void {
        const urlRef = this.url;
        this.url = null;
        this.loaded = false;
        setTimeout((x) => {
            this.url = x;
        }, 0, urlRef);
    }
}
