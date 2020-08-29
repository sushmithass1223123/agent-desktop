import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';

@Component({
    selector: 'twc-supervisor',
    templateUrl: './twc-supervisor.component.html',
    styleUrls: ['./twc-supervisor.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcSupervisorComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    supervisorWidgets = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        this.initWrapper(this.data);
        // call the wrapper init method

        // get the content widgets
        this.supervisorWidgets = this.data.Data.Widgets || [];
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
