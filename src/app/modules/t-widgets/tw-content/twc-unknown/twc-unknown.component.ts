import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';

@Component({
    selector: 'twc-unknown',
    templateUrl: './twc-unknown.component.html',
    styleUrls: ['./twc-unknown.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcUnknownComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

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
