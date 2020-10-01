import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from 'app/services/content-page.service';

@Component({
    selector: 'twc-unknown',
    templateUrl: './twc-unknown.component.html',
    styleUrls: ['./twc-unknown.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcUnknownComponent extends TWContentWrapper implements OnInit, OnDestroy {

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        this.initWrapper(this.data);
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.destroyWrapper();
    }

}
