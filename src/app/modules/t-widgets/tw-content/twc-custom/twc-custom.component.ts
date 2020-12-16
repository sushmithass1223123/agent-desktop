import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { AGENT_DATA_MAP } from 'app/constants';
import { ContentPageService } from 'app/services/content-page.service';

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
     * Frame loaded flag
     */
    loaded = false;
    /**
     * Url to load the frame
     */
    url: any;
    /**
     * flag to unload the page
     */
    unload: boolean;

    /**
     * Constructor
     * @param {ElementRef} hostElement 
     * @param {ContentPageService} contentPageService 
     * @param {DomSanitizer} _sanitizer 
     */
    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _sanitizer: DomSanitizer
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
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

            setTimeout(() => {
                this.loaded = true;
            }, 3000);
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
            }
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
}
