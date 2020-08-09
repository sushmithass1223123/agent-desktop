import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'tw-custom',
    templateUrl: './tw-custom.component.html',
    styleUrls: ['./tw-custom.component.scss']
})
export class TwCustomComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;
    loaded = false;
    url: any;

    constructor(private sanitizer: DomSanitizer) {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // check if the url is provided
        if (this.data.Data.Url) {
            // load the iframe URL
            this.url = this.transform(this.data.Data.Url);
        }
        setTimeout(() => {
            this.loaded = true;
        }, 3000);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

}
