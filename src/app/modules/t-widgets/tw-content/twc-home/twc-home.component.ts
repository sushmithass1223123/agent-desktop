import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';

@Component({
    selector: 'twc-home',
    templateUrl: './twc-home.component.html',
    styleUrls: ['./twc-home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcHomeComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    homeWidgets = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the home content widgets
        this.homeWidgets = this.data.Data.Widgets || [];
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
