import { Component, OnInit, OnDestroy, Input, ElementRef } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from 'app/services/content-page.service';

@Component({
    selector: 'twc-unknown',
    templateUrl: './twc-unknown.component.html',
    styleUrls: ['./twc-unknown.component.scss']
})
export class TwcUnknownComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        this.initWrapper(this.data);
    }

    ngOnDestroy(): void {
        this.destroyWrapper();
    }

}
