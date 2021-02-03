import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from '@services/content-page.service';

/**
 * Docker Content Widget Component
 */
@Component({
    selector: 'twc-docker',
    templateUrl: './twc-docker.component.html',
    styleUrls: ['./twc-docker.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcDockerComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * To hold static widgets
     */
    dockerWidgets = [];

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
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the docker content widgets
        this.dockerWidgets = this.data.Data.Widgets.Static || [];

    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.destroyWrapper();
    }
}
