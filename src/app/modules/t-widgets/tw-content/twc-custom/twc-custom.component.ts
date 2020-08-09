import { Component, OnInit, OnDestroy, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from 'app/services/content-page.service';
import { DomSanitizer } from '@angular/platform-browser';

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

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private sanitizer: DomSanitizer
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
                // load the iframe URL
                this.url = this.transform(this.widgetData.Data.Url);
            }
            setTimeout(() => {
                this.loaded = true;
            }, 3000);
        }
    }

    private transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
