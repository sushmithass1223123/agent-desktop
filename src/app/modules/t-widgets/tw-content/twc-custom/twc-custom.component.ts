import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { TMACEventService } from '@services/tmac-event.service';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { AGENT_DATA_MAP } from 'app/constants';
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
    fuseConfig: FuseConfig;
    /**
     * Frame loaded flag
     */
    loaded = false;
    /**
     * Initial loaded flag
     */
    initialLoad: boolean;
    /**
     * Url to load the frame
     */
    url: any;
    /**
     * flag to unload the page
     */
    unload: boolean;
    /**
     * subscriptions
     */
    eventSubscriptions: Subscription;

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
        private _fuseConfigService: FuseConfigService
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // Subscribe to the config changes
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((fuseConfig: FuseConfig) => {
            this.fuseConfig = fuseConfig;
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
    }

    /**
     * To send TMAC events to the iframe/popup window
     *
     * @param {any[]} events
     */
    private sendEventsToWindow(evts: any[]): void {
        const iframe = document.getElementById('frame_' + this.data.ID);
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

                // get the agent data map
                const mapObj = AGENT_DATA_MAP();

                // add the query param
                const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
                url = url.replace(reg, (matched: any) => {
                    return mapObj[matched];
                });

                // load the iframe URL
                this.url = this.transform(url);
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
                this.initialLoad = false;
            }
        }
    }

    /**
     * Iframe loaded event
     */
    frameLoaded = () => {
        // check if this is not initial load
        if (this.initialLoad) {
            // set the loaded flag to true
            setTimeout(() => {
                this.loaded = true;
            });
            if (!this.eventSubscriptions) {
                // subscribe to all non interaction events
                this.eventSubscriptions = this._tmacEventService
                    .getAllEvents()
                    .pipe(takeUntil(this.unsubscribeAll))
                    .subscribe((evts) => this.sendEventsToWindow(evts));
            }
        } else {
            // set initial load to true
            this.initialLoad = true;
        }
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
