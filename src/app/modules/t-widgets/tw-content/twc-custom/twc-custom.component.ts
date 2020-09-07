import { Component, OnInit, OnDestroy, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from 'app/services/content-page.service';
import { DomSanitizer } from '@angular/platform-browser';
import { AGENT_DATA_MAP } from 'app/constants';

@Component({
    selector: 'twc-custom',
    templateUrl: './twc-custom.component.html',
    styleUrls: ['./twc-custom.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcCustomComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    loaded = false;
    url: any;

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

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

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

    private transform(url: string): any {
        return this._sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
